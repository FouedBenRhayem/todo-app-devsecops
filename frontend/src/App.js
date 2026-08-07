import Auth from "./Auth";
import React, { useState, useEffect, useCallback } from "react";

const API_URL = process.env.REACT_APP_API_URL || "";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4";

const THEMES = {
  dark: {
    "--bg-grad": "linear-gradient(180deg, rgba(5,5,8,0.55), rgba(5,5,8,0.75))",
    "--text": "#ffffff",
    "--text-sub": "rgba(255,255,255,0.7)",
    "--text-muted": "rgba(255,255,255,0.5)",
    "--glass-bg": "rgba(255,255,255,0.01)",
    "--glass-bg-strong": "rgba(255,255,255,0.02)",
    "--border-grad": "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%, transparent 40%, transparent 60%, rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%)",
    "--border-grad-strong": "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 20%, transparent 40%, transparent 60%, rgba(255,255,255,0.2) 80%, rgba(255,255,255,0.5) 100%)",
    "--icon-bg": "rgba(255,255,255,0.1)",
    "--icon-bg-active": "rgba(255,255,255,0.18)",
    "--input-bg": "rgba(255,255,255,0.05)"
  },
  light: {
    "--bg-grad": "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(225,225,232,0.8))",
    "--text": "#16161a",
    "--text-sub": "rgba(22,22,26,0.72)",
    "--text-muted": "rgba(22,22,26,0.55)",
    "--glass-bg": "rgba(0,0,0,0.02)",
    "--glass-bg-strong": "rgba(0,0,0,0.03)",
    "--border-grad": "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.08) 20%, transparent 40%, transparent 60%, rgba(0,0,0,0.08) 80%, rgba(0,0,0,0.22) 100%)",
    "--border-grad-strong": "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.1) 20%, transparent 40%, transparent 60%, rgba(0,0,0,0.1) 80%, rgba(0,0,0,0.28) 100%)",
    "--icon-bg": "rgba(0,0,0,0.07)",
    "--icon-bg-active": "rgba(0,0,0,0.14)",
    "--input-bg": "rgba(0,0,0,0.04)"
  }
};

const PRIORITY_OPACITY = { High: 1, Medium: 0.6, Low: 0.35 };

function normalizeTask(t) {
  return {
    id: t.id,
    title: t.title || "",
    description: t.description || "",
    priority: t.priority || "Medium",
    dueDate: t.dueDate || "",
    done: !!t.done
  };
}

export default function App() {
  const [auth, setAuth] = useState(null);
  const [mode, setMode] = useState("dark");
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "", priority: "Medium", dueDate: "" });

  // Si pas connecté → afficher Auth
  if (!auth) {
    return <Auth onAuthenticated={(data) => setAuth(data)} />;
  }

  useEffect(() => {
    fetch(`${API_URL}/tasks`, {
      headers: { "Authorization": `Bearer ${auth.token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error(`GET /tasks failed (${res.status})`);
        return res.json();
      })
      .then((data) => setTasks((data || []).map(normalizeTask)))
      .catch((err) => setError(`Could not load tasks: ${err.message}`));
  }, [auth]);

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "dark" ? "light" : "dark"));
  }, []);

  const addTask = useCallback(
    (e) => {
      e.preventDefault();
      if (!form.title.trim()) return;
      fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${auth.token}`
        },
        body: JSON.stringify(form)
      })
        .then((res) => {
          if (!res.ok) throw new Error(`POST /tasks failed (${res.status})`);
          return res.json();
        })
        .then((created) => {
          setTasks((prev) => [...prev, normalizeTask(created)]);
          setForm({ title: "", description: "", priority: "Medium", dueDate: "" });
        })
        .catch((err) => setError(`Could not add task: ${err.message}`));
    },
    [form, auth]
  );

  const toggleComplete = useCallback((task) => {
    const nextDone = !task.done;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: nextDone } : t)));
    fetch(`${API_URL}/tasks/${task.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth.token}`
      },
      body: JSON.stringify({ done: nextDone })
    }).catch((err) => {
      setError(`Could not update task: ${err.message}`);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: task.done } : t)));
    });
  }, [auth]);

  const deleteTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    fetch(`${API_URL}/tasks/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${auth.token}` }
    }).catch((err) => setError(`Could not delete task: ${err.message}`));
  }, [auth]);

  const logout = () => setAuth(null);

  const isDark = mode === "dark";
  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.done).length,
    pending: tasks.filter((t) => !t.done).length
  };
  const filtered = tasks.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.done : t.done
  );

  const themeVars = THEMES[mode];

  return (
    <div className="app" style={themeVars}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Source+Serif+4:ital,wght@1,500&display=swap');
        *{box-sizing:border-box;}
        .app{min-height:100vh;font-family:'Poppins',sans-serif;color:var(--text);position:relative;transition:color .5s ease;}
        .video-bg{position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;}
        .scrim{position:fixed;inset:0;z-index:1;background:var(--bg-grad);transition:background .5s ease;}
        .content{position:relative;z-index:10;padding:32px;}
        .wrap{max-width:1160px;margin:0 auto;}
        input,textarea,select,button{font-family:'Poppins',sans-serif;}
        input::placeholder,textarea::placeholder{color:inherit;opacity:.5;}
        .liquid-glass{position:relative;overflow:hidden;background:var(--glass-bg);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);border:none;box-shadow:inset 0 1px 1px rgba(255,255,255,0.08);border-radius:1rem;}
        .liquid-glass::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1.4px;background:var(--border-grad);-webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;}
        .liquid-glass-strong{position:relative;overflow:hidden;background:var(--glass-bg-strong);backdrop-filter:blur(50px);-webkit-backdrop-filter:blur(50px);border:none;box-shadow:4px 4px 4px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.12);border-radius:1.5rem;}
        .liquid-glass-strong::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1.4px;background:var(--border-grad-strong);-webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;}
        .hoverable{transition:transform .2s ease;cursor:pointer;}
        .hoverable:hover{transform:scale(1.05);}
        .hoverable:active{transform:scale(.95);}
        .row-hoverable{transition:transform .2s ease;}
        .row-hoverable:hover{transform:scale(1.01);}
        .topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;}
        .brand{display:flex;align-items:center;gap:10px;}
        .brand-main{font-weight:600;font-size:1.75rem;letter-spacing:-.03em;}
        .brand-accent{font-family:'Source Serif 4',serif;font-style:italic;font-size:1.75rem;color:var(--text-sub);}
        .topbar-right{display:flex;align-items:center;gap:10px;}
        .mode-btn{display:flex;align-items:center;gap:10px;padding:10px 18px;border-radius:9999px;font-size:.875rem;border:none;color:var(--text);}
        .logout-btn{padding:10px 18px;border-radius:9999px;font-size:.875rem;border:none;color:var(--text);cursor:pointer;background:var(--glass-bg);}
        .welcome{font-size:.875rem;color:var(--text-muted);}
        .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px;}
        .stat-card{padding:22px;}
        .stat-label{display:flex;align-items:center;gap:10px;margin-bottom:14px;color:var(--text-muted);font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;}
        .stat-value{font-size:2.25rem;font-weight:500;letter-spacing:-.03em;}
        .main{display:grid;grid-template-columns:360px 1fr;gap:24px;align-items:start;}
        @media (max-width:900px){.main{grid-template-columns:1fr;}.stats{grid-template-columns:1fr;}}
        .form-panel{padding:26px;display:flex;flex-direction:column;gap:16px;}
        .form-title{margin:0;font-size:1.125rem;font-weight:500;}
        .field-label{display:block;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;}
        .input,textarea.input{width:100%;padding:12px 14px;border-radius:.75rem;border:none;outline:none;font-size:.9375rem;background:var(--input-bg);color:var(--text);}
        textarea.input{resize:none;font-size:.875rem;}
        .prio-row{display:flex;gap:8px;}
        .pill-btn{flex:1;padding:9px;border-radius:9999px;font-size:.8125rem;border:none;cursor:pointer;transition:all .2s ease;color:var(--text-muted);background:var(--glass-bg);}
        .pill-btn.active{background:var(--icon-bg-active);color:var(--text);}
        .submit-btn{display:flex;align-items:center;justify-content:center;gap:10px;padding:13px;border-radius:9999px;border:none;cursor:pointer;font-size:.9375rem;margin-top:6px;background:var(--icon-bg-active);color:var(--text);}
        .filters{display:flex;gap:8px;margin-bottom:18px;}
        .filter-btn{padding:9px 20px;border-radius:9999px;font-size:.8125rem;border:none;cursor:pointer;transition:all .2s ease;color:var(--text-muted);background:var(--glass-bg);}
        .filter-btn.active{background:var(--icon-bg-active);color:var(--text);}
        .task-list{display:flex;flex-direction:column;gap:12px;}
        .task-row{display:flex;align-items:flex-start;gap:14px;padding:18px 20px;border-radius:1.25rem;}
        .check-btn{width:24px;height:24px;border-radius:9999px;border:none;cursor:pointer;flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;color:var(--text);background:var(--icon-bg);}
        .check-btn.done{background:var(--icon-bg-active);}
        .task-body{flex:1;min-width:0;}
        .task-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
        .task-title{font-size:.9375rem;font-weight:500;}
        .badge{font-size:.6875rem;letter-spacing:.06em;text-transform:uppercase;padding:3px 10px;border-radius:9999px;color:var(--text);}
        .task-desc{margin:6px 0 0 0;font-size:.8125rem;line-height:1.4;color:var(--text-muted);}
        .task-due{display:block;margin-top:8px;font-size:.75rem;color:var(--text-muted);}
        .delete-btn{width:30px;height:30px;border-radius:9999px;border:none;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--text);background:var(--icon-bg);}
        .error-banner{padding:12px 18px;border-radius:.75rem;background:rgba(255,255,255,0.08);color:var(--text);font-size:.8125rem;margin-bottom:20px;}
      `}</style>

      <video className="video-bg" autoPlay muted loop playsInline>
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>
      <div className="scrim" />

      <div className="content">
        <div className="wrap">
          <div className="topbar">
            <div className="brand">
              <span className="brand-main">bloom</span>
              <span className="brand-accent">tasks</span>
            </div>
            <div className="topbar-right">
              {auth?.name && <span className="welcome">👋 {auth.name}</span>}
              <button className="mode-btn liquid-glass hoverable" onClick={toggleMode}>
                {isDark ? "☀️ Light" : "🌙 Dark"}
              </button>
              <button className="logout-btn liquid-glass hoverable" onClick={logout}>
                Logout
              </button>
            </div>
          </div>

          {error && <div className="error-banner liquid-glass">{error}</div>}

          <div className="stats">
            <div className="stat-card liquid-glass">
              <div className="stat-label">Total</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-card liquid-glass">
              <div className="stat-label">Completed</div>
              <div className="stat-value">{stats.completed}</div>
            </div>
            <div className="stat-card liquid-glass">
              <div className="stat-label">Pending</div>
              <div className="stat-value">{stats.pending}</div>
            </div>
          </div>

          <div className="main">
            <form className="form-panel liquid-glass-strong" onSubmit={addTask}>
              <h3 className="form-title">Add task</h3>
              <input className="input" type="text" placeholder="Task title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              <textarea className="input" placeholder="Description (optional)" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              <div>
                <span className="field-label">Priority</span>
                <div className="prio-row">
                  {["High", "Medium", "Low"].map((p) => (
                    <button key={p} type="button" className={`pill-btn ${form.priority === p ? "active" : ""}`} onClick={() => setForm((f) => ({ ...f, priority: p }))}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <span className="field-label">Due date</span>
                <input className="input" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <button className="submit-btn hoverable" type="submit">+ Add Task</button>
            </form>

            <div>
              <div className="filters">
                {["all", "active", "completed"].map((f) => (
                  <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                    {f[0].toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <div className="task-list">
                {filtered.map((task) => {
                  const op = PRIORITY_OPACITY[task.priority] ?? 0.6;
                  const badgeBg = isDark ? `rgba(255,255,255,${0.08 + op * 0.14})` : `rgba(0,0,0,${0.05 + op * 0.12})`;
                  return (
                    <div key={task.id} className="task-row liquid-glass row-hoverable">
                      <button className={`check-btn hoverable ${task.done ? "done" : ""}`} onClick={() => toggleComplete(task)}>
                        {task.done && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                      </button>
                      <div className="task-body">
                        <div className="task-head">
                          <span className="task-title" style={{ textDecoration: task.done ? "line-through" : "none" }}>{task.title}</span>
                          <span className="badge" style={{ background: badgeBg }}>{task.priority}</span>
                        </div>
                        {task.description && <p className="task-desc">{task.description}</p>}
                        {task.dueDate && <span className="task-due">Due {task.dueDate}</span>}
                      </div>
                      <button className="delete-btn hoverable" onClick={() => deleteTask(task.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
