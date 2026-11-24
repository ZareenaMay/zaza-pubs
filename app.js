// Tasks are saved on this device in the browser's local storage.
const STORAGE_KEY = "tasks";

// Read the saved task list from this device, or an empty list if none.
function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

// Save the task list to this device.
function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Storage unavailable (e.g. private mode); the list still works until the page closes.
  }
}

// Make a unique id for a new task.
function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
}

// Return a new list with the trimmed task added at the top (blank titles are ignored).
function addTask(tasks, title) {
  const clean = title.trim();
  if (!clean) return tasks;
  return [{ id: newId(), title: clean, done: false, createdAt: Date.now() }, ...tasks];
}

// Return a new list with the given task marked done or not done.
function setTaskDone(tasks, id, done) {
  return tasks.map((task) => (task.id === id ? { ...task, done } : task));
}

// Build one task row: a checkbox and the task title, both tappable.
function renderTask(task) {
  const li = document.createElement("li");
  li.className = task.done ? "task done" : "task";

  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = Boolean(task.done);
  checkbox.dataset.id = task.id;

  const title = document.createElement("span");
  title.className = "title";
  title.textContent = task.title;

  label.append(checkbox, title);
  li.append(label);
  return li;
}

// Draw the task list, task count and empty message on the page.
function render(tasks) {
  document.getElementById("task-list").replaceChildren(...tasks.map(renderTask));
  document.getElementById("empty").hidden = tasks.length > 0;
  const doneCount = tasks.filter((task) => task.done).length;
  document.getElementById("count").textContent =
    tasks.length ? `${doneCount} of ${tasks.length} done` : "";
}

let tasks = loadTasks();
render(tasks);

document.getElementById("task-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("task-input");
  tasks = addTask(tasks, input.value);
  saveTasks(tasks);
  render(tasks);
  input.value = "";
  input.focus();
});

document.getElementById("task-list").addEventListener("change", (event) => {
  const checkbox = event.target;
  if (checkbox.type !== "checkbox") return;
  tasks = setTaskDone(tasks, checkbox.dataset.id, checkbox.checked);
  saveTasks(tasks);
  render(tasks);
});
