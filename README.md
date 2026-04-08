# Job & Interview Tracker

A complete browser-based tracker for job applications and interviews, built with vanilla HTML/CSS/JavaScript and ready for GitHub deployment (including GitHub Pages).

## Features

- Add, edit, and delete job application entries.
- Pick location with linked State → City dropdowns (all U.S. states + city options per state).
- State and city are required for each entry.
- Filter entries by status.
- Includes an **Accepted** status with a check-mark badge; start date is requested only for accepted jobs.
- Tracks days since each application was submitted, plus average days applied in the summary.
- Sort by application date, interview date, company, or status (ascending/descending).
- Persistent data storage with `localStorage`.
- CSV export and import support with input sanitization.
- Browser notifications for interviews scheduled for **today**.
- Responsive, lively UI with colorful status badges and a polished dashboard style.
- Delete confirmation prompt before removing entries.

## Project Structure

- `index.html` — app layout and controls.
- `styles.css` — visual design and responsive styles.
- `script.js` — state management, persistence, filtering/sorting, CSV import/export, notifications.

## Run Locally

Open `index.html` in any modern browser.

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. In GitHub, open **Settings → Pages**.
3. Set **Source** to `Deploy from a branch`.
4. Choose your branch (e.g., `main`) and folder `/ (root)`.
5. Save and wait for the deployment URL.

## CSV Format

Exported CSV columns:

```csv
id,company,position,status,applicationDate,interviewDate,startDate,location,notes,updatedAt
```

For imports, include at least:

- `company`
- `position`
- `applicationDate` (YYYY-MM-DD)

Rows missing these required fields are skipped.
