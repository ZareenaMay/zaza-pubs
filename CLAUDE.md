# CLAUDE.md

Guidance for Claude when working in this repository.

## Project
**My Tasks** is a very simple to-do list app for a tablet. The user can add tasks, see them in a list, tick them off as done, give them due dates, filter them (All, To do, Overdue, Done), edit them and delete them (with Undo).

## Two versions
- `index.html` + `style.css` + `app.js`: the original app. Saves tasks on the device in `localStorage`. Open the file in any browser.
- `my-tasks-sheets.html`: the version the user actually uses, published as a claude.ai artifact (https://claude.ai/artifact/3pf3wCRRsAeKCJyq87sChv). It saves tasks in the user's **My Tasks** Google Sheet (Claude folder in Google Drive, id `1xZXnQgFfgM8O_SN_6fICxmeoRtJuNPHFN2cPmuDLPx0`) through the claude.ai Google Sheets connector (`mcp` capability, tools `get_values` and `update_spreadsheet`). It only works when opened from the claude.ai link. Publish changes with the Artifact tool to that same URL.

Both share the same task logic, rendering and look; keep features in step unless the user says otherwise.

### The Google Sheet
- Tab `Tasks`, sheetId `0`. Row 1 is the header: Task | Due date | Done | ID. Newest task in row 2.
- Due date is a real date formatted `yyyy-mm-dd`; Done is a tickbox (TRUE/FALSE); ID is plain text.
- Add a task by inserting a row at index 1 and filling it with `updateCells` in the same `update_spreadsheet` call (don't use `append_values`: the tickbox column makes Sheets append at the bottom of the grid).
- Before changing or deleting a row, re-read the sheet and find the row by ID; rows can move when the sheet is edited directly.
- Write names with `stringValue` in `updateCells`, never through `update_values`, which would turn text like `1/2` or `=x` into dates or formulas.
- A row typed straight into the sheet with no ID gets one the next time the app loads.
- When the user asks Claude to change a task (e.g. "mark X done"), edit the sheet directly with the Google Sheets tools; the app picks it up next time it opens.

## Key decisions
- **Platform:** a single web page that runs in the tablet's browser.
- **Storage:** the original app saves tasks in browser `localStorage` under the key `tasks`; the Sheets version saves them in the Google Sheet and offers once to move any `tasks` left on the device into it (then sets `tasksMovedToSheet`). Both remember the chosen filter under `taskFilter`.
- **No build step:** plain HTML, CSS and JavaScript, with no frameworks or dependencies.

## Files
- `my-tasks-sheets.html`: the Google Sheets version, all in one file (see above)
- `index.html`: page structure (title, add form with due date, filter buttons, task list, empty state, undo bar)
- `style.css`: tablet-friendly layout with large touch targets, light and dark mode
- `app.js`: app logic
- `README.md`: short overview for people

## Data model
```js
{ id: "uuid", title: "Buy milk", done: false, due: "2026-11-30", createdAt: 1761436800000 }
```
The list is an array of these, newest first. `due` is an optional "YYYY-MM-DD" string in the tablet's local time, or `null`. Older tasks may have no `done` or `due` field; treat those as not done and no due date. Compare dates as strings against `todayString()`, never with `new Date("YYYY-MM-DD")` (that parses as UTC and can be a day off).

## Code structure (app.js)
- `loadTasks()` reads from localStorage (returns `[]` on any error)
- `saveTasks(tasks)` writes to localStorage (fails silently)
- `addTask(tasks, title, due)` trims the title, ignores blanks, returns a new array
- `setTaskDone(tasks, id, done)` marks one task done or not done, returns a new array
- `editTask(tasks, id, title, due)` changes a title and due date (a blank title keeps the old one), returns a new array
- `todayString()`, `parseDate(text)`, `isOverdue(task, today)`, `describeDue(task, today)` handle due dates ("Due today", "Overdue · Mon 3 Nov")
- `matchesFilter(task, filter, today)` decides which tasks a filter shows; `loadFilter()` / `saveFilter(filter)` remember the choice
- `deleteTask(tasks, id)` / `restoreTask(tasks, task, index)` remove a task and put it back for Undo
- `renderTask(task)` builds a normal row: checkbox, title, Edit and Delete buttons
- `renderEditTask(task)` builds a row in edit mode: text box, Save and Cancel
- `showUndo(title)` / `hideUndo()` show and hide the "Deleted … Undo" bar
- `update(tasks)` saves the list and redraws; use it for every change
- `render(tasks)` draws the filter buttons, the tasks matching the filter, the "X of Y done" count and a filter-specific empty message

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
1. Sort by due date
2. Bring the original app in line with the Sheets version, or retire it
