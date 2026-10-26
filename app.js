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

// Return a new list without the given task.
function deleteTask(tasks, id) {
  return tasks.filter((task) => task.id !== id);
}

// Return a new list with the given task renamed (blank titles are ignored).
function editTask(tasks, id, title) {
  const clean = title.trim();
  if (!clean) return tasks;
  return tasks.map((task) => (task.id === id ? { ...task, title: clean } : task));
}

// Make a small button that tells the list which action to run on which task.
function actionButton(text, action, task) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `task-action ${action}`;
  button.textContent = text;
  button.dataset.action = action;
  button.dataset.id = task.id;
  button.setAttribute("aria-label", `${text} "${task.title}"`);
  return button;
}

// Build the row for a task being renamed: a text box and a Save button.
function editRow(task) {
  const form = document.createElement("form");
  form.className = "edit-row";
  form.dataset.id = task.id;
  const input = document.createElement("input");
  input.type = "text";
  input.value = task.title;
  input.maxLength = 200;
  input.enterKeyHint = "done";
  input.setAttribute("aria-label", "Task name");
  const save = document.createElement("button");
  save.type = "submit";
  save.className = "task-action save";
  save.textContent = "Save";
  form.append(input, save);
  return form;
}

// Build the normal row for a task: checkbox, title, Edit and Delete buttons.
function taskRow(task) {
  const label = document.createElement("label");
  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = Boolean(task.done);
  box.dataset.id = task.id;
  const title = document.createElement("span");
  title.textContent = task.title;
  label.append(box, title);
  return [label, actionButton("Edit", "edit", task), actionButton("Delete", "delete", task)];
}

// Draw the task list, task count and empty message on the page.
function render(tasks) {
  const list = document.getElementById("task-list");
  list.replaceChildren(
    ...tasks.map((task) => {
      const li = document.createElement("li");
      li.classList.toggle("done", Boolean(task.done));
      if (task.id === editingId) li.append(editRow(task));
      else li.append(...taskRow(task));
      return li;
    })
  );
  const doneCount = tasks.filter((task) => task.done).length;
  document.getElementById("empty").hidden = tasks.length > 0;
  document.getElementById("count").textContent = tasks.length
    ? `${tasks.length} task${tasks.length === 1 ? "" : "s"}${doneCount ? `, ${doneCount} done` : ""}`
    : "";
}

// Save the list, redraw it, and put the cursor in the edit box if one is open.
function update(newTasks) {
  tasks = newTasks;
  saveTasks(tasks);
  render(tasks);
  const editInput = document.querySelector(".edit-row input");
  if (editInput) {
    editInput.focus();
    editInput.select();
  }
}

// Finish renaming: keep the new name (unless blank) and close the edit box.
function finishEdit(form) {
  if (form.dataset.id !== editingId) return;
  editingId = null;
  update(editTask(tasks, form.dataset.id, form.querySelector("input").value));
}

let tasks = loadTasks();
let editingId = null; // id of the task being renamed, if any
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
  const id = event.target.dataset.id;
  if (!id || event.target.type !== "checkbox") return;
  update(toggleTask(tasks, id));
});

list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.dataset.id;
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  if (button.dataset.action === "edit") {
    editingId = id;
    update(tasks);
  } else if (button.dataset.action === "delete" && confirm(`Delete "${task.title}"?`)) {
    if (editingId === id) editingId = null;
    update(deleteTask(tasks, id));
  }
});

list.addEventListener("submit", (event) => {
  event.preventDefault();
  finishEdit(event.target);
});

// Tapping away from the edit box saves it; Escape cancels.
list.addEventListener("focusout", (event) => {
  const form = event.target.closest(".edit-row");
  if (form && !form.contains(event.relatedTarget)) finishEdit(form);
});

list.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !event.target.closest(".edit-row")) return;
  editingId = null;
  render(tasks);
});
