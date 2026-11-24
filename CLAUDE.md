# CLAUDE.md

Guidance for Claude when working in this repository.

## Project
**My Tasks** is a very simple to-do list app for a tablet. The user can add tasks, see them in a list, tick them off as done, edit them and delete them (with Undo).

## Key decisions
- **Platform:** a single web page that runs in the tablet's browser.
- **Storage:** tasks are saved on the tablet in browser `localStorage` under the key `tasks`. There is no server, database or account.
- **No build step:** plain HTML, CSS and JavaScript, with no frameworks or dependencies.

## Files
- `index.html`: page structure (title, add form, task list, empty state, undo bar)
- `style.css`: tablet-friendly layout with large touch targets, light and dark mode
- `app.js`: app logic
- `README.md`: short overview for people

## Data model
```js
{ id: "uuid", title: "Buy milk", done: false, createdAt: 1761436800000 }
```
The list is an array of these, newest first. Tasks saved before `done` existed have no `done` field; treat that as not done.

## Code structure (app.js)
- `loadTasks()` reads from localStorage (returns `[]` on any error)
- `saveTasks(tasks)` writes to localStorage (fails silently)
- `addTask(tasks, title)` trims the title, ignores blanks, returns a new array
- `setTaskDone(tasks, id, done)` marks one task done or not done, returns a new array
- `renameTask(tasks, id, title)` changes a title (blank is ignored), returns a new array
- `deleteTask(tasks, id)` / `restoreTask(tasks, task, index)` remove a task and put it back for Undo
- `renderTask(task)` builds a normal row: checkbox, title, Edit and Delete buttons
- `renderEditTask(task)` builds a row in edit mode: text box, Save and Cancel
- `showUndo(title)` / `hideUndo()` show and hide the "Deleted … Undo" bar
- `update(tasks)` saves the list and redraws; use it for every change
- `render(tasks)` draws the list, the "X of Y done" count and empty state

Only one task is edited at a time (`editingId`). Button clicks on rows are handled once on the list, by each button's `data-action`.

Keep data logic separate from rendering so a backend can replace storage later.

## Conventions
- Keep it simple. Add only what a feature needs.
- When creating a new function, always add a one-line comment above it describing what it does.
- Use `textContent`, never `innerHTML`, for task text.
- Don't use `alert()`, `confirm()` or `prompt()`; build confirmations into the page (like the Undo bar).
- Wrap every localStorage access in try/catch.
- Keep touch targets at least 48px tall and the layout usable from phone to tablet width.
- Define colors as CSS variables in `:root`, with dark-mode overrides.

## Running
Open `index.html` in a browser. There are no tests or build commands yet.

## Roadmap
1. Due dates and filters
2. Sync across devices (needs a backend)
