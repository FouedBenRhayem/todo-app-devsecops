from flask import Flask, jsonify, request
import psycopg2
import os

app = Flask(__name__)

def get_db():
    conn = psycopg2.connect(
        host=os.environ.get("DB_HOST", "db"),
        database=os.environ.get("DB_NAME", "tododb"),
        user=os.environ.get("DB_USER", "postgres"),
        password=os.environ.get("DB_PASSWORD", "postgres")
    )
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            description TEXT DEFAULT '',
            priority VARCHAR(20) DEFAULT 'Medium',
            due_date VARCHAR(20) DEFAULT '',
            done BOOLEAN DEFAULT FALSE
        )
    ''')
    conn.commit()
    cur.close()
    conn.close()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

@app.route('/tasks', methods=['GET'])
def get_tasks():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, title, description, priority, due_date, done FROM tasks")
    tasks = [
        {
            "id": r[0],
            "title": r[1],
            "description": r[2],
            "priority": r[3],
            "dueDate": r[4],
            "done": r[5]
        } for r in cur.fetchall()
    ]
    cur.close()
    conn.close()
    return jsonify(tasks), 200

@app.route('/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    if not data or 'title' not in data:
        return jsonify({"error": "title is required"}), 400
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO tasks (title, description, priority, due_date) VALUES (%s, %s, %s, %s) RETURNING id",
        (data['title'], data.get('description', ''), data.get('priority', 'Medium'), data.get('dueDate', ''))
    )
    task_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({
        "id": task_id,
        "title": data['title'],
        "description": data.get('description', ''),
        "priority": data.get('priority', 'Medium'),
        "dueDate": data.get('dueDate', ''),
        "done": False
    }), 201

@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "UPDATE tasks SET done = %s WHERE id = %s",
        (data.get('done', True), task_id)
    )
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "updated"}), 200

@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "deleted"}), 200

with app.app_context():
    init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
