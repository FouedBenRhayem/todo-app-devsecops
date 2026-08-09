from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import os
import hashlib
import jwt
import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        return respons
SECRET_KEY = "devsecops-secret-key"

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
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(200) UNIQUE NOT NULL,
            password VARCHAR(200) NOT NULL
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
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

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def get_user_from_token(request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[7:]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload["user_id"]
    except:
        return None

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Email and password required"}), 400
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO users (name, email, password) VALUES (%s, %s, %s) RETURNING id",
            (data.get('name', ''), data['email'], hash_password(data['password']))
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        token = jwt.encode(
            {"user_id": user_id, "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)},
            SECRET_KEY, algorithm="HS256"
        )
        return jsonify({"token": token, "name": data.get('name', '')}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"message": "Email already exists"}), 400
    finally:
        cur.close()
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, name FROM users WHERE email=%s AND password=%s",
        (data['email'], hash_password(data['password']))
    )
    user = cur.fetchone()
    cur.close()
    conn.close()
    if not user:
        return jsonify({"message": "Incorrect email or password"}), 401
    token = jwt.encode(
        {"user_id": user[0], "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)},
        SECRET_KEY, algorithm="HS256"
    )
    return jsonify({"token": token, "name": user[1]}), 200

@app.route('/tasks', methods=['GET'])
def get_tasks():
    user_id = get_user_from_token(request)
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, title, description, priority, due_date, done FROM tasks WHERE user_id=%s", (user_id,))
    tasks = [{"id": r[0], "title": r[1], "description": r[2], "priority": r[3], "dueDate": r[4], "done": r[5]} for r in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(tasks), 200

@app.route('/tasks', methods=['POST'])
def create_task():
    user_id = get_user_from_token(request)
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401
    data = request.get_json()
    if not data or 'title' not in data:
        return jsonify({"error": "title is required"}), 400
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO tasks (user_id, title, description, priority, due_date) VALUES (%s, %s, %s, %s, %s) RETURNING id",
        (user_id, data['title'], data.get('description', ''), data.get('priority', 'Medium'), data.get('dueDate', ''))
    )
    task_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"id": task_id, "title": data['title'], "description": data.get('description', ''), "priority": data.get('priority', 'Medium'), "dueDate": data.get('dueDate', ''), "done": False}), 201

@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    user_id = get_user_from_token(request)
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401
    data = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE tasks SET done=%s WHERE id=%s AND user_id=%s", (data.get('done', True), task_id, user_id))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "updated"}), 200

@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    user_id = get_user_from_token(request)
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM tasks WHERE id=%s AND user_id=%s", (task_id, user_id))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "deleted"}), 200

with app.app_context():
    init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
