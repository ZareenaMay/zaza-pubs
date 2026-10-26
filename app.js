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
  return [{ id: newId(), title: clean, createdAt: Date.now(), done: false }, ...tasks];
}

// Return a new list with the given task's done state flipped.
function toggleTask(tasks, id) {
  return tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task));
}

// Draw the task list, task count and empty message on the page.
function render(tasks) {
  const list = document.getElementById("task-list");
  list.replaceChildren(
    ...tasks.map((task) => {
      const li = document.createElement("li");
      li.classList.toggle("done", Boolean(task.done));
      const label = document.createElement("label");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = Boolean(task.done);
      box.dataset.id = task.id;
      const title = document.createElement("span");
      title.textContent = task.title;
      label.append(box, title);
      li.append(label);
      return li;
    })
  );
  const doneCount = tasks.filter((task) => task.done).length;
  document.getElementById("empty").hidden = tasks.length > 0;
  document.getElementById("count").textContent = tasks.length
    ? `${tasks.length} task${tasks.length === 1 ? "" : "s"}${doneCount ? `, ${doneCount} done` : ""}`
    : "";
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
  const id = event.target.dataset.id;
  if (!id) return;
  tasks = toggleTask(tasks, id);
  saveTasks(tasks);
  render(tasks);
});
