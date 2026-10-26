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
  return [{ id: newId(), title: clean, createdAt: Date.now() }, ...tasks];
}

// Draw the task list, task count and empty message on the page.
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
