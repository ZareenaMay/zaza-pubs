# CLAUDE.md

Guidance for Claude when working in this repository.

## Project
**My Tasks** is a very simple to-do list app for a tablet. The user can add tasks and see them in a list.

## Key decisions
- **Platform:** a single web page that runs in the tablet's browser.
- **Storage:** tasks are saved on the tablet in browser `localStorage` under the key `tasks`. There is no server, database or account.
- **No build step:** plain HTML, CSS and JavaScript, with no frameworks or dependencies.

## Files
- `index.html`: page structure (title, add form, task list, empty state)
- `style.css`: tablet-friendly layout with large touch targets, light and dark mode
- `app.js`: app logic
- `README.md`: short overview for people

## Data model
```js
{ id: "uuid", title: "Buy milk", createdAt: 1761436800000, done: false, due: "2026-10-30" }
```
The list is an array of these, newest first. Older saved tasks may lack `done` or `due`; treat missing as `false` / no due date. `due` is a local date string `YYYY-MM-DD` or `null`.

## Code structure (app.js)
- `loadTasks()` reads from localStorage (returns `[]` on any error)
- `saveTasks(tasks)` writes to localStorage (fails silently)
- `addTask(tasks, title, due)` trims the title, ignores blanks, returns a new array
- `toggleTask(tasks, id)` flips a task's `done` state, returns a new array
- `deleteTask(tasks, id)` removes a task, returns a new array
- `editTask(tasks, id, title, due)` renames a task and sets its due date (trims, ignores blank titles), returns a new array
- `isOverdue(task, today)` and `filterTasks(tasks, filter, today)` (`all`, `todo`, `done`, `overdue`) work on `YYYY-MM-DD` strings
- `render(tasks, filter)` draws the filter buttons, matching tasks, task count and empty state

Keep data logic separate from rendering so a backend can replace storage later.

## Conventions
- Keep it simple. Add only what a feature needs.
- When creating a new function, always add a one-line comment above it describing what it does.
- Use `textContent`, never `innerHTML`, for task text.
- Wrap every localStorage access in try/catch.
- Keep touch targets at least 48px tall and the layout usable from phone to tablet width.
- Define colors as CSS variables in `:root`, with dark-mode overrides.

## Running
Open `index.html` in a browser. There are no tests or build commands yet.

## Roadmap
1. ~~Mark a task done~~ (done)
2. ~~Delete or edit a task~~ (done)
3. ~~Due dates and filters~~ (done)
4. Sync across devices (needs a backend)
