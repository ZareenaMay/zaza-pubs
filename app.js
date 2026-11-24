// Tasks are saved on this device in the browser's local storage.
const STORAGE_KEY = "tasks";
const UNDO_SECONDS = 6;

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

// Return a new list with the given task's title changed (blank titles are ignored).
function renameTask(tasks, id, title) {
  const clean = title.trim();
  if (!clean) return tasks;
  return tasks.map((task) => (task.id === id ? { ...task, title: clean } : task));
}

// Return a new list without the given task.
function deleteTask(tasks, id) {
  return tasks.filter((task) => task.id !== id);
}

// Return a new list with a deleted task put back where it was.
function restoreTask(tasks, task, index) {
  const copy = [...tasks];
  copy.splice(Math.min(index, copy.length), 0, task);
  return copy;
}

// Make a small text button that the list's click handler recognises by its action.
function makeButton(text, action, label, extraClass) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.dataset.action = action;
  button.className = extraClass ? `row-btn ${extraClass}` : "row-btn";
  if (label) button.setAttribute("aria-label", label);
  return button;
}

// Build one task row in normal mode: checkbox, title, Edit and Delete buttons.
function renderTask(task) {
  const li = document.createElement("li");
  li.className = task.done ? "task done" : "task";
  li.dataset.id = task.id;

  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = Boolean(task.done);

  const title = document.createElement("span");
  title.className = "title";
  title.textContent = task.title;

  label.append(checkbox, title);
  li.append(
    label,
    makeButton("Edit", "edit", `Edit "${task.title}"`),
    makeButton("Delete", "delete", `Delete "${task.title}"`, "danger")
  );
  return li;
}

// Build one task row in edit mode: a text box with Save and Cancel.
function renderEditTask(task) {
  const li = document.createElement("li");
  li.className = "task editing";
  li.dataset.id = task.id;

  const form = document.createElement("form");
  form.className = "edit-form";
  form.autocomplete = "off";

  const input = document.createElement("input");
  input.type = "text";
  input.id = "edit-input";
  input.value = task.title;
  input.maxLength = 200;
  input.setAttribute("aria-label", "Task name");
  input.setAttribute("enterkeyhint", "done");

  const save = makeButton("Save", "save", null, "primary");
  save.type = "submit";
  form.append(input, save, makeButton("Cancel", "cancel"));
  li.append(form);
  return li;
}

// Draw the task list, the done count and empty message on the page.
function render(tasks) {
  document.getElementById("task-list").replaceChildren(
    ...tasks.map((task) => (task.id === editingId ? renderEditTask(task) : renderTask(task)))
  );
  document.getElementById("empty").hidden = tasks.length > 0;
  const doneCount = tasks.filter((task) => task.done).length;
  document.getElementById("count").textContent =
    tasks.length ? `${doneCount} of ${tasks.length} done` : "";

  const editInput = document.getElementById("edit-input");
  if (editInput) {
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);
  }
}

// Show the "Task deleted · Undo" bar, hiding it again after a few seconds.
function showUndo(title) {
  document.getElementById("undo-text").textContent = `Deleted "${title}"`;
  document.getElementById("undo-bar").hidden = false;
  clearTimeout(undoTimer);
  undoTimer = setTimeout(hideUndo, UNDO_SECONDS * 1000);
}

// Hide the undo bar and forget the last deleted task.
function hideUndo() {
  clearTimeout(undoTimer);
  document.getElementById("undo-bar").hidden = true;
  lastDeleted = null;
}

// Save the list, then redraw the page.
function update(newTasks) {
  tasks = newTasks;
  saveTasks(tasks);
  render(tasks);
}

let tasks = loadTasks();
let editingId = null;
let lastDeleted = null;
let undoTimer = null;
render(tasks);

document.getElementById("task-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("task-input");
  update(addTask(tasks, input.value));
  input.value = "";
  input.focus();
});

const list = document.getElementById("task-list");

list.addEventListener("change", (event) => {
  if (event.target.type !== "checkbox") return;
  const id = event.target.closest("li").dataset.id;
  update(setTaskDone(tasks, id, event.target.checked));
});

list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button || button.type === "submit") return;
  const id = button.closest("li").dataset.id;
  const action = button.dataset.action;

  if (action === "edit") {
    editingId = id;
    render(tasks);
  } else if (action === "cancel") {
    editingId = null;
    render(tasks);
  } else if (action === "delete") {
    const index = tasks.findIndex((task) => task.id === id);
    lastDeleted = { task: tasks[index], index };
    update(deleteTask(tasks, id));
    showUndo(lastDeleted.task.title);
  }
});

list.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = event.target.closest("li").dataset.id;
  const title = event.target.querySelector("input").value;
  editingId = null;
  update(renameTask(tasks, id, title));
});

list.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && editingId) {
    editingId = null;
    render(tasks);
  }
});

document.getElementById("undo-btn").addEventListener("click", () => {
  if (lastDeleted) update(restoreTask(tasks, lastDeleted.task, lastDeleted.index));
  hideUndo();
});
