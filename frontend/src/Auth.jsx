import React, { useState } from "react";

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
    "--border-grad":
      "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%, transparent 40%, transparent 60%, rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%)",
    "--border-grad-strong":
      "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 20%, transparent 40%, transparent 60%, rgba(255,255,255,0.2) 80%, rgba(255,255,255,0.5) 100%)",
    "--icon-bg": "rgba(255,255,255,0.1)",
    "--icon-bg-active": "rgba(255,255,255,0.18)",
    "--input-bg": "rgba(255,255,255,0.05)",
    "--error-bg": "rgba(255,255,255,0.12)"
  },
  light: {
    "--bg-grad": "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(225,225,232,0.8))",
    "--text": "#16161a",
    "--text-sub": "rgba(22,22,26,0.72)",
    "--text-muted": "rgba(22,22,26,0.55)",
    "--glass-bg": "rgba(0,0,0,0.02)",
    "--glass-bg-strong": "rgba(0,0,0,0.03)",
    "--border-grad":
      "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.08) 20%, transparent 40%, transparent 60%, rgba(0,0,0,0.08) 80%, rgba(0,0,0,0.22) 100%)",
    "--border-grad-strong":
      "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.1) 20%, transparent 40%, transparent 60%, rgba(0,0,0,0.1) 80%, rgba(0,0,0,0.28) 100%)",
    "--icon-bg": "rgba(0,0,0,0.07)",
    "--icon-bg-active": "rgba(0,0,0,0.14)",
    "--input-bg": "rgba(0,0,0,0.04)",
    "--error-bg": "rgba(0,0,0,0.08)"
  }
};

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState("dark");
  const [view, setView] = useState("login"); // "login" | "register"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [login, setLogin] = useState({ email: "", password: "" });
  const [reg, setReg] = useState({ name: "", email: "", password: "", confirm: "" });

  const isDark = mode === "dark";
  const toggleMode = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  const switchView = (v) => {
    setError("");
    setView(v);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    if (!login.email.trim() || !login.password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(login)
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Incorrect email or password.");
        return data;
      })
      .then((data) => {
        setLoading(false);
        if (onAuthenticated) onAuthenticated(data);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message);
      });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError("");
    if (!reg.name.trim() || !reg.email.trim() || !reg.password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (reg.password !== reg.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: reg.name, email: reg.email, password: reg.password })
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "An account with this email already exists.");
        return data;
      })
      .then((data) => {
        setLoading(false);
        if (onAuthenticated) onAuthenticated(data);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message);
      });
  };

  const themeVars = THEMES[mode];

  return (
    <div className="auth-app" style={themeVars}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Source+Serif+4:ital,wght@1,500&display=swap');
        *{box-sizing:border-box;}
        .auth-app{min-height:100vh;font-family:'Poppins',sans-serif;color:var(--text);position:relative;transition:color .5s ease;}
        .video-bg{position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;}
        .scrim{position:fixed;inset:0;z-index:1;background:var(--bg-grad);transition:background .5s ease;}
        .content{position:relative;z-index:10;padding:32px;min-height:100vh;display:flex;flex-direction:column;}
        input,button{font-family:'Poppins',sans-serif;}
        input::placeholder{color:inherit;opacity:.5;}

        .liquid-glass{position:relative;overflow:hidden;background:var(--glass-bg);background-blend-mode:luminosity;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);border:none;box-shadow:inset 0 1px 1px rgba(255,255,255,0.08);border-radius:1rem;}
        .liquid-glass::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1.4px;background:var(--border-grad);-webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;}
        .liquid-glass-strong{position:relative;overflow:hidden;background:var(--glass-bg-strong);background-blend-mode:luminosity;backdrop-filter:blur(50px);-webkit-backdrop-filter:blur(50px);border:none;box-shadow:4px 4px 4px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.12);border-radius:1.5rem;}
        .liquid-glass-strong::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1.4px;background:var(--border-grad-strong);-webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;}

        .hoverable{transition:transform .2s ease;cursor:pointer;}
        .hoverable:hover{transform:scale(1.05);}
        .hoverable:active{transform:scale(.95);}

        .topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:auto;}
        .brand{display:flex;align-items:center;gap:10px;}
        .brand-main{font-weight:600;font-size:1.75rem;letter-spacing:-.03em;}
        .brand-accent{font-family:'Source Serif 4',serif;font-style:italic;font-size:1.75rem;color:var(--text-sub);}
        .mode-btn{display:flex;align-items:center;gap:10px;padding:10px 18px;border-radius:9999px;font-size:.875rem;border:none;color:var(--text);}

        .auth-center{flex:1;display:flex;align-items:center;justify-content:center;padding:40px 0;}
        .auth-card{width:100%;max-width:420px;padding:40px;display:flex;flex-direction:column;gap:20px;animation:fadeSlide .4s ease;}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
        .auth-title{margin:0;font-size:1.75rem;font-weight:500;letter-spacing:-.02em;}
        .auth-sub{margin:-12px 0 0 0;font-size:.875rem;color:var(--text-muted);}
        .field-label{display:block;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;}
        .input{width:100%;padding:13px 14px;border-radius:.75rem;border:none;outline:none;font-size:.9375rem;background:var(--input-bg);color:var(--text);}
        .submit-btn{display:flex;align-items:center;justify-content:center;gap:10px;padding:14px;border-radius:9999px;border:none;cursor:pointer;font-size:.9375rem;margin-top:6px;background:var(--icon-bg-active);color:var(--text);}
        .submit-btn:disabled{opacity:.6;cursor:default;}
        .switch-row{text-align:center;font-size:.875rem;color:var(--text-muted);}
        .switch-link{color:var(--text);font-weight:500;cursor:pointer;background:none;border:none;font-size:inherit;font-family:inherit;padding:0;text-decoration:underline;text-underline-offset:3px;}
        .error-banner{padding:12px 16px;border-radius:.75rem;background:var(--error-bg);color:var(--text);font-size:.8125rem;}
      `}</style>

      <video className="video-bg" autoPlay muted loop playsInline>
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>
      <div className="scrim" />

      <div className="content">
        <div className="topbar">
          <div className="brand">
            <span className="brand-main">bloom</span>
            <span className="brand-accent">tasks</span>
          </div>
          <button className="mode-btn liquid-glass hoverable" onClick={toggleMode}>
            {isDark ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" /><line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" /><line x1="4" y1="12" x2="2" y2="12" /><line x1="22" y1="12" x2="20" y2="12" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.5A9 9 0 1111.5 3 7 7 0 0021 12.5z" />
              </svg>
            )}
            {isDark ? "Light mode" : "Dark mode"}
          </button>
        </div>

        <div className="auth-center">
          {view === "login" ? (
            <form className="auth-card liquid-glass-strong" onSubmit={handleLogin} key="login">
              <h2 className="auth-title">Welcome back</h2>
              <p className="auth-sub">Log in to continue to your tasks.</p>

              {error && <div className="error-banner liquid-glass">{error}</div>}

              <div>
                <span className="field-label">Email</span>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={login.email}
                  onChange={(e) => setLogin((s) => ({ ...s, email: e.target.value }))}
                />
              </div>
              <div>
                <span className="field-label">Password</span>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={login.password}
                  onChange={(e) => setLogin((s) => ({ ...s, password: e.target.value }))}
                />
              </div>

              <button className="submit-btn hoverable" type="submit" disabled={loading}>
                {loading ? "Logging in…" : "Login"}
              </button>

              <div className="switch-row">
                Don't have an account?{" "}
                <button type="button" className="switch-link" onClick={() => switchView("register")}>
                  Register
                </button>
              </div>
            </form>
          ) : (
            <form className="auth-card liquid-glass-strong" onSubmit={handleRegister} key="register">
              <h2 className="auth-title">Create your account</h2>
              <p className="auth-sub">Start growing your task list.</p>

              {error && <div className="error-banner liquid-glass">{error}</div>}

              <div>
                <span className="field-label">Name</span>
                <input
                  className="input"
                  type="text"
                  placeholder="Jane Doe"
                  value={reg.name}
                  onChange={(e) => setReg((s) => ({ ...s, name: e.target.value }))}
                />
              </div>
              <div>
                <span className="field-label">Email</span>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={reg.email}
                  onChange={(e) => setReg((s) => ({ ...s, email: e.target.value }))}
                />
              </div>
              <div>
                <span className="field-label">Password</span>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={reg.password}
                  onChange={(e) => setReg((s) => ({ ...s, password: e.target.value }))}
                />
              </div>
              <div>
                <span className="field-label">Confirm password</span>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={reg.confirm}
                  onChange={(e) => setReg((s) => ({ ...s, confirm: e.target.value }))}
                />
              </div>

              <button className="submit-btn hoverable" type="submit" disabled={loading}>
                {loading ? "Creating account…" : "Register"}
              </button>

              <div className="switch-row">
                Already have an account?{" "}
                <button type="button" className="switch-link" onClick={() => switchView("login")}>
                  Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}



