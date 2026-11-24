// Tasks are saved on this device in the browser's local storage.
const STORAGE_KEY = "tasks";
const FILTER_KEY = "taskFilter";
const UNDO_SECONDS = 6;
const FILTERS = ["all", "todo", "overdue", "done"];
const EMPTY_MESSAGES = {
  all: "No tasks yet. Add one above.",
  todo: "Nothing left to do.",
  overdue: "Nothing overdue.",
  done: "No finished tasks yet.",
};

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
function addTask(tasks, title, due) {
  const clean = title.trim();
  if (!clean) return tasks;
  return [{ id: newId(), title: clean, done: false, due: due || null, createdAt: Date.now() }, ...tasks];
}

// Return a new list with the given task marked done or not done.
function setTaskDone(tasks, id, done) {
  return tasks.map((task) => (task.id === id ? { ...task, done } : task));
}

// Return a new list with the given task's title and due date changed (a blank title keeps the old one).
function editTask(tasks, id, title, due) {
  const clean = title.trim();
  return tasks.map((task) =>
    task.id === id ? { ...task, title: clean || task.title, due: due || null } : task
  );
}

// Load the filter the user picked last time, or "all".
function loadFilter() {
  try {
    const saved = localStorage.getItem(FILTER_KEY);
    return FILTERS.includes(saved) ? saved : "all";
  } catch {
    return "all";
  }
}

// Remember the chosen filter on this device.
function saveFilter(filter) {
  try {
    localStorage.setItem(FILTER_KEY, filter);
  } catch {
    // Storage unavailable; the filter just won't be remembered.
  }
}

// Today's date as "YYYY-MM-DD" in the tablet's own time zone.
function todayString() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Turn a "YYYY-MM-DD" string into a local Date at midnight.
function parseDate(text) {
  const [year, month, day] = text.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Is this task past its due date and still not done?
function isOverdue(task, today) {
  return Boolean(task.due) && !task.done && task.due < today;
}

// Does this task belong in the chosen filter?
function matchesFilter(task, filter, today) {
  if (filter === "todo") return !task.done;
  if (filter === "done") return Boolean(task.done);
  if (filter === "overdue") return isOverdue(task, today);
  return true;
}

// Describe a due date in friendly words, e.g. "Due today" or "Overdue · Mon 3 Nov".
function describeDue(task, today) {
  const due = parseDate(task.due);
  const days = Math.round((due - parseDate(today)) / 86400000);
  const sameYear = due.getFullYear() === parseDate(today).getFullYear();
  const dateText = due.toLocaleDateString(undefined, {
    weekday: "short", day: "numeric", month: "short", year: sameYear ? undefined : "numeric",
  });
  if (task.done) return { text: `Due ${dateText}`, state: "" };
  if (days < 0) return { text: `Overdue · ${dateText}`, state: "overdue" };
  if (days === 0) return { text: "Due today", state: "today" };
  if (days === 1) return { text: "Due tomorrow", state: "" };
  return { text: `Due ${dateText}`, state: "" };
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

// Build one task row in normal mode: checkbox, title, due date, Edit and Delete buttons.
function renderTask(task, today) {
  const li = document.createElement("li");
  li.className = task.done ? "task done" : "task";
  li.dataset.id = task.id;

  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = Boolean(task.done);

  const text = document.createElement("span");
  text.className = "text";
  const title = document.createElement("span");
  title.className = "title";
  title.textContent = task.title;
  text.append(title);

  if (task.due) {
    const { text: dueText, state } = describeDue(task, today);
    const due = document.createElement("span");
    due.className = state ? `due ${state}` : "due";
    due.textContent = dueText;
    text.append(due);
  }

  label.append(checkbox, text);
  li.append(
    label,
    makeButton("Edit", "edit", `Edit "${task.title}"`),
    makeButton("Delete", "delete", `Delete "${task.title}"`, "danger")
  );
  return li;
}

// Build one task row in edit mode: name and due date boxes with Save and Cancel.
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

  const dueInput = document.createElement("input");
  dueInput.type = "date";
  dueInput.id = "edit-due";
  dueInput.className = "date-input";
  dueInput.value = task.due || "";
  dueInput.setAttribute("aria-label", "Due date");

  const save = makeButton("Save", "save", null, "primary");
  save.type = "submit";
  form.append(input, dueInput, save, makeButton("Cancel", "cancel"));
  li.append(form);
  return li;
}

// Draw the filter buttons, the tasks that match the filter, the done count and empty message.
function render(tasks) {
  const today = todayString();
  const shown = tasks.filter((task) => matchesFilter(task, filter, today));
  document.getElementById("task-list").replaceChildren(
    ...shown.map((task) => (task.id === editingId ? renderEditTask(task) : renderTask(task, today)))
  );

  const overdueCount = tasks.filter((task) => isOverdue(task, today)).length;
  document.querySelectorAll("#filters button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
  });
  document.getElementById("overdue-count").textContent = overdueCount ? ` (${overdueCount})` : "";

  const empty = document.getElementById("empty");
  empty.hidden = shown.length > 0;
  empty.textContent = tasks.length ? EMPTY_MESSAGES[filter] : EMPTY_MESSAGES.all;
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
let filter = loadFilter();
let editingId = null;
let lastDeleted = null;
let undoTimer = null;
render(tasks);

document.getElementById("task-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("task-input");
  const dueInput = document.getElementById("task-due");
  if (!input.value.trim()) return input.focus();
  update(addTask(tasks, input.value, dueInput.value));
  input.value = "";
  dueInput.value = "";
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
  const title = document.getElementById("edit-input").value;
  const due = document.getElementById("edit-due").value;
  editingId = null;
  update(editTask(tasks, id, title, due));
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

document.getElementById("filters").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;
  filter = button.dataset.filter;
  editingId = null;
  saveFilter(filter);
  render(tasks);
});
