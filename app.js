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

// Return a due date as "YYYY-MM-DD", or null if it is empty or not a valid date.
function cleanDue(due) {
  return /^\d{4}-\d{2}-\d{2}$/.test(due || "") ? due : null;
}

// Return a new list with the trimmed task added at the top (blank titles are ignored).
function addTask(tasks, title, due) {
  const clean = title.trim();
  if (!clean) return tasks;
  return [
    { id: newId(), title: clean, createdAt: Date.now(), done: false, due: cleanDue(due) },
    ...tasks,
  ];
}

// Return a new list with the given task's done state flipped.
function toggleTask(tasks, id) {
  return tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task));
}

// Return a new list without the given task.
function deleteTask(tasks, id) {
  return tasks.filter((task) => task.id !== id);
}

// Return a new list with the given task renamed and its due date set (blank titles are ignored).
function editTask(tasks, id, title, due) {
  const clean = title.trim();
  if (!clean) return tasks;
  return tasks.map((task) =>
    task.id === id ? { ...task, title: clean, due: cleanDue(due) } : task
  );
}

// Return today's date on this device as "YYYY-MM-DD".
function todayString(now = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// True if the task is not done and its due date is before today.
function isOverdue(task, today) {
  return !task.done && Boolean(task.due) && task.due < today;
}

// Return only the tasks that match the filter: "all", "todo", "done" or "overdue".
function filterTasks(tasks, filter, today) {
  if (filter === "todo") return tasks.filter((task) => !task.done);
  if (filter === "done") return tasks.filter((task) => task.done);
  if (filter === "overdue") return tasks.filter((task) => isOverdue(task, today));
  return tasks;
}

// Describe a due date in words, e.g. "Due today", "Due tomorrow", "Overdue · 24 Oct".
function dueText(task, today) {
  const [y, m, d] = task.due.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const days = Math.round((date - new Date(`${today}T00:00`)) / 86400000);
  const label = date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  if (isOverdue(task, today)) return `Overdue · ${label}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due ${label}`;
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

// Build the row for a task being edited: name box, due date box and a Save button.
function editRow(task) {
  const form = document.createElement("form");
  form.className = "edit-row";
  form.dataset.id = task.id;
  const input = document.createElement("input");
  input.type = "text";
  input.name = "title";
  input.value = task.title;
  input.maxLength = 200;
  input.enterKeyHint = "done";
  input.setAttribute("aria-label", "Task name");
  const due = document.createElement("input");
  due.type = "date";
  due.name = "due";
  due.value = task.due || "";
  due.setAttribute("aria-label", "Due date (optional)");
  const save = document.createElement("button");
  save.type = "submit";
  save.className = "task-action save";
  save.textContent = "Save";
  form.append(input, due, save);
  return form;
}

// Build the normal row for a task: checkbox, title, due date, Edit and Delete buttons.
function taskRow(task, today) {
  const label = document.createElement("label");
  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = Boolean(task.done);
  box.dataset.id = task.id;
  const text = document.createElement("span");
  text.className = "task-text";
  const title = document.createElement("span");
  title.className = "task-title";
  title.textContent = task.title;
  text.append(title);
  if (task.due) {
    const due = document.createElement("span");
    due.className = "task-due";
    due.classList.toggle("overdue", isOverdue(task, today));
    due.textContent = dueText(task, today);
    text.append(due);
  }
  label.append(box, text);
  return [label, actionButton("Edit", "edit", task), actionButton("Delete", "delete", task)];
}

// Draw the filter buttons, the matching tasks, the task count and the empty message.
function render(tasks, filter) {
  const today = todayString();
  const shown = filterTasks(tasks, filter, today);
  document.querySelectorAll("#filters button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
  });
  document.getElementById("task-list").replaceChildren(
    ...shown.map((task) => {
      const li = document.createElement("li");
      li.classList.toggle("done", Boolean(task.done));
      if (task.id === editingId) li.append(editRow(task));
      else li.append(...taskRow(task, today));
      return li;
    })
  );
  const doneCount = tasks.filter((task) => task.done).length;
  const overdueCount = tasks.filter((task) => isOverdue(task, today)).length;
  const parts = [`${tasks.length} task${tasks.length === 1 ? "" : "s"}`];
  if (doneCount) parts.push(`${doneCount} done`);
  if (overdueCount) parts.push(`${overdueCount} overdue`);
  document.getElementById("count").textContent = tasks.length ? parts.join(", ") : "";
  document.getElementById("filters").hidden = tasks.length === 0;
  const empty = document.getElementById("empty");
  empty.hidden = shown.length > 0;
  empty.textContent = tasks.length ? "No tasks match this filter." : "No tasks yet. Add one above.";
}

// Save the list, redraw it, and put the cursor in the edit box if one is open.
function update(newTasks) {
  tasks = newTasks;
  saveTasks(tasks);
  render(tasks, filter);
  const editInput = document.querySelector(".edit-row input[name=title]");
  if (editInput && !document.querySelector(".edit-row").contains(document.activeElement)) {
    editInput.focus();
    editInput.select();
  }
}

// Finish editing: keep the new name (unless blank) and due date, and close the edit box.
function finishEdit(form) {
  if (form.dataset.id !== editingId) return;
  editingId = null;
  update(editTask(tasks, form.dataset.id, form.elements.title.value, form.elements.due.value));
}

// Save and close the edit box, if one is open.
function finishOpenEdit() {
  const form = document.querySelector(".edit-row");
  if (form) finishEdit(form);
}

let tasks = loadTasks();
let filter = "all"; // which tasks to show: "all", "todo", "done" or "overdue"
let editingId = null; // id of the task being edited, if any
render(tasks, filter);

document.getElementById("task-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("task-input");
  const due = document.getElementById("task-due");
  if (!input.value.trim()) return input.focus();
  update(addTask(tasks, input.value, due.value));
  input.value = "";
  due.value = "";
  input.focus();
});

document.getElementById("filters").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;
  filter = button.dataset.filter;
  render(tasks, filter);
});

// Redraw when the tablet wakes up or the page is reopened, so "today" and "overdue" stay correct.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !editingId) render(tasks, filter);
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
  finishOpenEdit();
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

// Moving focus outside the list (e.g. to the add box or a filter) saves the edit box.
// Taps inside the list are handled by the click handlers, so the row isn't redrawn mid-tap.
// Native date pickers move focus nowhere, so a missing relatedTarget is ignored.
list.addEventListener("focusout", (event) => {
  const form = event.target.closest(".edit-row");
  if (form && event.relatedTarget && !list.contains(event.relatedTarget)) finishEdit(form);
});

// Tapping anywhere outside the edit box also saves it (after any checkbox tap has finished).
document.addEventListener("click", (event) => {
  const form = document.querySelector(".edit-row");
  if (form && !form.contains(event.target) && !event.target.closest("button[data-action]")) {
    setTimeout(() => finishEdit(form));
  }
});

// Escape cancels the edit.
list.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !event.target.closest(".edit-row")) return;
  editingId = null;
  render(tasks, filter);
});
