let token = localStorage.getItem('token');

function signup() {
    const phoneNumber = '+44' + document.getElementById('phone').value;
    fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            firstname: document.getElementById('firstname').value,
            lastname: document.getElementById('lastname').value,
            email: document.getElementById('signupEmail').value,
            phone: phoneNumber
        })
    }).then(res => res.json()).then(data => {
        if (data.message === 'User registered successfully') {
            showLogin();
        }
        alert(data.message);
    });
}

function login() {
    fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: document.getElementById('loginEmail').value,
            password: document.getElementById('loginPassword').value
        })
    }).then(res => res.json()).then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            token = data.token;
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('taskPage').style.display = 'block';
            getTasks();
        } else {
            alert(data.message);
        }
    });
}

function getTasks() {
    fetch('http://localhost:5000/tasks?status=upcoming', {
        headers: { 'Authorization': token }
    }).then(res => res.json()).then(data => {
        const taskList = document.getElementById('ongoingTasks');
        taskList.innerHTML = '';
        data.tasks.forEach(task => {
            const li = document.createElement('div');
            li.innerHTML = `
                <span>${task.task}</span>
                <button onclick="completeTask(${task.id})">✔</button>
                <button onclick="editTask(${task.id}, '${task.task}')">✏</button>
                <button onclick="deleteTask(${task.id})">🗑</button>
            `;
            taskList.appendChild(li);
        });
    });

    fetch('http://localhost:5000/tasks?status=completed', {
        headers: { 'Authorization': token }
    }).then(res => res.json()).then(data => {
        const completedTaskList = document.getElementById('completedTasks');
        completedTaskList.innerHTML = '';
        data.tasks.forEach(task => {
            const li = document.createElement('div');
            li.innerHTML = `
                <span>${task.task} (Completed)</span>
                <button onclick="deleteTask(${task.id})">🗑</button>
            `;
            completedTaskList.appendChild(li);
        });
    });
}

function addTask() {
    let taskText = prompt("Enter your new task:");
    if (taskText) {
        fetch('http://localhost:5000/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ task: taskText })
        }).then(() => getTasks());
    }
}

function completeTask(id) {
    fetch(`http://localhost:5000/tasks/${id}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': token }
    }).then(() => getTasks());
}

function editTask(id, currentTask) {
    const newTask = prompt("Edit Task:", currentTask);
    if (newTask) {
        fetch(`http://localhost:5000/tasks/${id}/edit`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ task: newTask })
        }).then(() => getTasks());
    }
}

function deleteTask(id) {
    fetch(`http://localhost:5000/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
    }).then(() => getTasks());
}
