# Study Ledger

A persistent CRUD flashcards app with a study mode, built for a technical internship assessment.

## How to Run

```bash
npm install
node server.js
# Open http://localhost:3000
```

The SQLite database file, `database.db`, is created automatically on first run.

## What It Does

- Create flashcards with a title, answer content, subject tag, and created date.
- View all flashcards in a responsive notebook-style grid.
- Edit flashcards in a modal.
- Delete flashcards after a confirmation prompt.
- Study cards one at a time, flip to reveal the answer, mark each card, and see a final score.

## Tech Stack

- Node.js
- Express
- SQLite with `better-sqlite3`
- Plain HTML, CSS, and JavaScript served by Express

## Suggested Commit History

1. Initial Express server and SQLite schema
2. CRUD API endpoints
3. Frontend HTML/CSS layout
4. Study mode feature
5. Polish, README, and answers
