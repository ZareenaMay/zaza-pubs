// Tasks are saved on this device in the browser's local storage.
const STORAGE_KEY = "tasks";

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Storage unavailable (e.g. private mode); the list still works until the page closes.
  }
}

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
}

function addTask(tasks, title) {
  const clean = title.trim();
  if (!clean) return tasks;
  return [{ id: newId(), title: clean, createdAt: Date.now() }, ...tasks];
}

function render(tasks) {
  const list = document.getElementById("task-list");
  list.replaceChildren(
    ...tasks.map((task) => {
      const li = document.createElement("li");
      li.textContent = task.title;
      return li;
    })
  );
  document.getElementById("empty").hidden = tasks.length > 0;
  document.getElementById("count").textContent =
    tasks.length ? `${tasks.length} task${tasks.length === 1 ? "" : "s"}` : "";
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
