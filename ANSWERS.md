# Assessment Answers

## 1. How to Run

```bash
npm install
node server.js
# Open http://localhost:3000
```

## 2. Stack Choice

I chose Node.js, Express, and SQLite with `better-sqlite3` because the app can run with no frontend build step and only one server command after installing dependencies. Express serves both the API and the plain HTML/CSS/JS frontend, while SQLite keeps persistence self-contained in a local `database.db` file. For a fresh-machine demo, this is simpler than React + Vite because there is no bundler, dev server split, or extra build workflow to explain.

## 3. One Real Edge Case

Empty flashcard titles are validated on the backend in `server.js` line 46 inside `validateCard`, where a blank `title` returns a `400` response with `Title is required.` The frontend also displays that validation message beside the title field in `public/app.js`.

## 4. AI Usage

Placeholder: This project was AI-assisted using the assessment prompt. One thing I changed manually was: [describe one concrete adjustment you made, such as revising copy, changing spacing, or tightening validation].

## 5. Honest thing

This version does not include user authentication or search/filtering. I would add search by creating a `GET /api/flashcards?subject=&q=` endpoint, adding an index for subject/title lookup, and placing a small filter row above the flashcard grid. Authentication would require a users table, password hashing, sessions or tokens, and scoping flashcards by `user_id`.
