# My Tasks

A very simple to-do list for a tablet. Add tasks with an optional due date, tick them off when they're done, filter by All, To do, Overdue or Done, and edit or delete them. A deleted task can be brought back with Undo for a few seconds.

- Works in the tablet's web browser, no install or account.
- Tasks are saved on the tablet (browser local storage), so they survive a refresh.
- Clearing the browser's site data will erase the tasks.

## Google Sheets version
`my-tasks-sheets.html` is the same app, but it saves tasks in a **My Tasks** Google Sheet in your Google Drive (Claude folder), so they work on any device and you can view them in Google Sheets. It runs as a claude.ai page: open it from its claude.ai link while signed in, and allow Google Sheets the first time.

## Files
- `index.html` – page structure
- `style.css` – tablet-friendly layout, light and dark mode
- `app.js` – load, add, render and save tasks

## Next ideas
Sort by due date.
