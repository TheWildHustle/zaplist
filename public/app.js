document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskTitle = document.getElementById('task-title');
    const taskDescription = document.getElementById('task-description');
    const taskList = document.getElementById('tasks');

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTask(taskTitle.value, taskDescription.value);
        taskTitle.value = '';
        taskDescription.value = '';
    });

    function addTask(title, description) {
        const taskItem = document.createElement('li');
        taskItem.innerHTML = `
            <h3>${title}</h3>
            <p>${description}</p>
            <button class="delete-task">Delete</button>
        `;
        taskList.appendChild(taskItem);

        const deleteButton = taskItem.querySelector('.delete-task');
        deleteButton.addEventListener('click', () => {
            taskList.removeChild(taskItem);
        });
    }
});