let token = localStorage.getItem('token');
let selectedTasks = new Set();

function showSignup() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('signupPage').style.display = 'block';
}

function showLogin() {
    document.getElementById('signupPage').style.display = 'none';
    document.getElementById('loginPage').style.display = 'block';
}

function goHome() {
    document.getElementById('taskPage').style.display = 'none';
    document.getElementById('loginPage').style.display = 'block';
    localStorage.removeItem('token');
    token = null;
}

function refreshTasks() {
    getTasks();
}

function signup() {
    const firstname = document.getElementById('firstname').value;
    const lastname = document.getElementById('lastname').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    if (!firstname || !lastname || !email || !password) {
        alert('Please fill in all fields');
        return;
    }

    fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstname, lastname, email, password })
    }).then(res => res.json()).then(data => {
        if (data.message === 'User registered successfully') {
            showLogin();
        }
        alert(data.message);
    }).catch(error => {
        console.error('Error during signup:', error);
        alert('Failed to sign up. Please try again.');
    });
}

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
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
    }).catch(error => {
        console.error('Error during login:', error);
        alert('Failed to log in. Please try again.');
    });
}

function getTasks() {
    if (!token) {
        alert('Please log in first');
        return;
    }

    // Clear selected tasks when refreshing
    selectedTasks.clear();
    updateActionButtonsState();

    fetch('http://localhost:5000/tasks?status=upcoming', {
        headers: { 'Authorization': token }
    }).then(res => {
        if (!res.ok) {
            throw new Error('Failed to fetch tasks');
        }
        return res.json();
    }).then(data => {
        const taskList = document.getElementById('ongoingTasks');
        taskList.innerHTML = '';
        data.tasks.forEach(task => {
            const li = document.createElement('div');
            li.className = 'task-item';
            li.dataset.id = task.id;
            li.innerHTML = `
                <div class="task-controls">
                    <button class="select-button" onclick="toggleTaskSelection(${task.id})" title="Select task">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="select-icon">
                            <path d="M9 3h6m-6 0L3 3v18l6-2m0-16l6 18l6-2V3l-6 0m-6 0v16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <label class="checkbox-container">
                        <input type="checkbox" onchange="toggleTaskStatus(${task.id})">
                        <span class="checkmark"></span>
                    </label>
                </div>
                <span class="task-text">${task.task}</span>
            `;
            taskList.appendChild(li);
        });
    }).catch(error => {
        console.error('Error fetching tasks:', error);
        alert('Failed to load tasks. Please try again.');
    });

    fetch('http://localhost:5000/tasks?status=completed', {
        headers: { 'Authorization': token }
    }).then(res => {
        if (!res.ok) {
            throw new Error('Failed to fetch completed tasks');
        }
        return res.json();
    }).then(data => {
        const completedTaskList = document.getElementById('completedTasks');
        completedTaskList.innerHTML = '';
        data.tasks.forEach(task => {
            const li = document.createElement('div');
            li.className = 'task-item completed';
            li.innerHTML = `
                <div class="task-controls">
                    <button class="select-button" onclick="toggleTaskSelection(${task.id})" title="Select task">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="select-icon">
                            <path d="M9 3h6m-6 0L3 3v18l6-2m0-16l6 18l6-2V3l-6 0m-6 0v16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <label class="checkbox-container">
                        <input type="checkbox" checked onchange="toggleTaskStatus(${task.id})">
                        <span class="checkmark"></span>
                    </label>
                </div>
                <span class="task-text">${task.task}</span>
            `;
            completedTaskList.appendChild(li);
        });
    }).catch(error => {
        console.error('Error fetching completed tasks:', error);
        alert('Failed to load completed tasks. Please try again.');
    });
}

function toggleTaskSelection(taskId) {
    const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
    if (!taskItem) return;

    if (selectedTasks.has(taskId)) {
        selectedTasks.delete(taskId);
        taskItem.querySelector('.select-button').classList.remove('selected');
        taskItem.querySelector('.task-text').classList.remove('selected');
    } else {
        selectedTasks.add(taskId);
        taskItem.querySelector('.select-button').classList.add('selected');
        taskItem.querySelector('.task-text').classList.add('selected');
    }

    // Update header action buttons state
    updateActionButtonsState();
}

function updateActionButtonsState() {
    const editBtn = document.querySelector('.action-button[title="Update selected tasks"]');
    const deleteBtn = document.querySelector('.action-button[title="Delete selected tasks"]');
    
    if (selectedTasks.size > 0) {
        editBtn.removeAttribute('disabled');
        deleteBtn.removeAttribute('disabled');
        editBtn.style.opacity = '1';
        deleteBtn.style.opacity = '1';
    } else {
        editBtn.setAttribute('disabled', 'true');
        deleteBtn.setAttribute('disabled', 'true');
        editBtn.style.opacity = '0.5';
        deleteBtn.style.opacity = '0.5';
    }
}

function toggleTaskStatus(taskId) {
    fetch(`http://localhost:5000/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': token }
    }).then(() => getTasks()).catch(error => {
        console.error('Error updating task status:', error);
        alert('Failed to update task status. Please try again.');
    });
}

function addTask() {
    if (!token) {
        alert('Please log in first');
        return;
    }

    let taskText = prompt("Enter your new task:");
    if (taskText) {
        fetch('http://localhost:5000/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ task: taskText })
        }).then(() => getTasks()).catch(error => {
            console.error('Error adding task:', error);
            alert('Failed to add task. Please try again.');
        });
    }
}

function completeTask(id) {
    if (!token) {
        alert('Please log in first');
        return;
    }

    fetch(`http://localhost:5000/tasks/${id}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': token }
    }).then(() => getTasks()).catch(error => {
        console.error('Error completing task:', error);
        alert('Failed to complete task. Please try again.');
    });
}

function editTask() {
    if (selectedTasks.size === 0) {
        alert('Please select tasks to edit');
        return;
    }

    // Get the selected task elements
    const selectedTaskElements = Array.from(selectedTasks).map(taskId => 
        document.querySelector(`.task-item[data-id="${taskId}"]`)
    ).filter(el => el); // Filter out any null elements

    if (selectedTaskElements.length === 0) return;

    let promptMessage;
    let currentText;

    if (selectedTasks.size === 1) {
        // For single task, show its current text
        currentText = selectedTaskElements[0].querySelector('.task-text').textContent;
        promptMessage = "Edit task:";
    } else {
        // For multiple tasks, show count and first task as example
        currentText = selectedTaskElements[0].querySelector('.task-text').textContent;
        promptMessage = `Edit ${selectedTasks.size} tasks (current example: "${currentText}"):`;
    }

    const newTask = prompt(promptMessage, currentText);
    if (!newTask) return;

    const editPromises = Array.from(selectedTasks).map(taskId => 
        fetch(`http://localhost:5000/tasks/${taskId}/edit`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': token 
            },
            body: JSON.stringify({ task: newTask })
        })
    );

    Promise.all(editPromises)
        .then(() => {
            selectedTasks.clear();
            updateActionButtonsState();
            getTasks();
        })
        .catch(error => {
            console.error('Error editing tasks:', error);
            alert('Failed to edit tasks. Please try again.');
        });
}

function deleteTask() {
    if (selectedTasks.size === 0) {
        alert('Please select tasks to delete');
        return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedTasks.size} task(s)?`)) {
        return;
    }

    const deletePromises = Array.from(selectedTasks).map(taskId =>
        fetch(`http://localhost:5000/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        })
    );

    Promise.all(deletePromises)
        .then(() => {
            selectedTasks.clear();
            updateActionButtonsState();
            getTasks();
        })
        .catch(error => {
            console.error('Error deleting tasks:', error);
            alert('Failed to delete tasks. Please try again.');
        });
}

function clearTasks() {
    if (!token) {
        alert('Please log in first');
        return;
    }

    if (confirm("Are you sure you want to delete all tasks?")) {
        fetch('http://localhost:5000/tasks', {
            method: 'DELETE',
            headers: { 'Authorization': token }
        }).then(() => getTasks()).catch(error => {
            console.error('Error clearing tasks:', error);
            alert('Failed to clear tasks. Please try again.');
        });
    }
}

// Add toggle functionality for completed tasks
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.querySelector('.toggle-btn');
    const completedContainer = document.querySelector('.completed-container');
    
    toggleBtn.addEventListener('click', function() {
        const isHidden = completedContainer.style.display === 'none';
        completedContainer.style.display = isHidden ? 'block' : 'none';
        toggleBtn.textContent = isHidden ? '▼' : '▼';
    });

    // Initialize action buttons state on page load
    updateActionButtonsState();
});
