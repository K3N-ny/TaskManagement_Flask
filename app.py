from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import jwt
import datetime

app = Flask(__name__)
CORS(app)

# Database Configuration (No Password)
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:new2u@localhost/task_management'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# User Model
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    firstname = db.Column(db.String(50), nullable=False)
    lastname = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False)

# Create Tables
with app.app_context():
    db.create_all()
class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(80), nullable=False)  # Associate task with user
    task = db.Column(db.String(200), nullable=False)
    status = db.Column(db.Enum('upcoming', 'completed', name='task_status'), default='upcoming', nullable=False)

# Create Tables
with app.app_context():
    db.create_all()
# Serve index.html
@app.route('/')
def home():
    return render_template('index.html')

# Signup Route
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    firstname = data.get('firstname')
    lastname = data.get('lastname')
    email = data.get('email')
    password = data.get('password')

    if not all([firstname, lastname, email, password]):
        return jsonify({'message': 'All fields are required'}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'message': 'User already exists'}), 400

    new_user = User(firstname=firstname, lastname=lastname, email=email, password=password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'})

# Login Route
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email, password=password).first()
    if not user:
        return jsonify({'message': 'Invalid credentials'}), 401

    # Generate JWT Token
    token = jwt.encode({'email': email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
                       app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({'token': token})


@app.route('/tasks', methods=['GET', 'POST'])
def manage_tasks():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token is missing'}), 401

    try:
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        email = decoded['email']
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401

    # Add New Task
    if request.method == 'POST':
        data = request.json
        task_text = data.get('task')
        if not task_text:
            return jsonify({'message': 'Task content is required'}), 400

        new_task = Task(email=email, task=task_text, status='upcoming')
        db.session.add(new_task)
        db.session.commit()
        return jsonify({'message': 'Task added'})

    # Retrieve Tasks Based on Status (default: upcoming)
    status = request.args.get('status', 'upcoming')
    if status not in ['upcoming', 'completed']:
        return jsonify({'message': 'Invalid status'}), 400

    tasks = Task.query.filter_by(email=email, status=status).all()
    return jsonify({'tasks': [{'id': t.id, 'task': t.task, 'status': t.status} for t in tasks]})


@app.route('/tasks/<int:task_id>/complete', methods=['PUT'])
def complete_task(task_id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token is missing'}), 401

    try:
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        email = decoded['email']
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401

    # Find the task that belongs to the user
    task = Task.query.filter_by(id=task_id, email=email).first()
    if not task:
        return jsonify({'message': 'Task not found'}), 404

    # Update status to 'completed'
    task.status = 'completed'
    db.session.commit()

    return jsonify(
        {'message': 'Task marked as completed', 'task': {'id': task.id, 'task': task.task, 'status': task.status}})


@app.route('/tasks/<int:task_id>/edit', methods=['PUT'])
def edit_task(task_id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token is missing'}), 401

    try:
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        email = decoded['email']
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401

    data = request.json
    new_task_text = data.get('task')

    if not new_task_text:
        return jsonify({'message': 'Task content is required'}), 400

    # Find the task that belongs to the user
    task = Task.query.filter_by(id=task_id, email=email).first()
    if not task:
        return jsonify({'message': 'Task not found'}), 404

    # Update the task text
    task.task = new_task_text
    db.session.commit()

    return jsonify(
        {'message': 'Task updated successfully', 'task': {'id': task.id, 'task': task.task, 'status': task.status}})


@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token is missing'}), 401

    try:
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        email = decoded['email']
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401

    task = Task.query.filter_by(id=task_id, email=email).first()
    if not task:
        return jsonify({'message': 'Task not found'}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted'})


if __name__ == '__main__':
    app.run(debug=True)
