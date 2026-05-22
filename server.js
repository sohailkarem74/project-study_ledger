const path = require('path');
const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS flashcards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    subject TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_flashcards_created_at
  ON flashcards(created_at DESC);
`);

const selectCard = db.prepare(`
  SELECT
    id,
    title,
    content,
    subject,
    created_at AS createdAt
  FROM flashcards
  WHERE id = ?
`);

function cleanCardInput(body) {
  return {
    title: String(body.title || '').trim(),
    content: String(body.content || '').trim(),
    subject: String(body.subject || '').trim()
  };
}

function validateCard(body) {
  const card = cleanCardInput(body);
  const errors = {};

  if (!card.title) errors.title = 'Title is required.';
  if (!card.content) errors.content = 'Back content is required.';
  if (!card.subject) errors.subject = 'Subject tag is required.';
  if (card.title.length > 120) errors.title = 'Title must be 120 characters or less.';
  if (card.subject.length > 40) errors.subject = 'Subject tag must be 40 characters or less.';
  if (card.content.length > 1200) errors.content = 'Back content must be 1200 characters or less.';

  return { card, errors };
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/flashcards', (_req, res) => {
  const cards = db.prepare(`
    SELECT
      id,
      title,
      content,
      subject,
      created_at AS createdAt
    FROM flashcards
    ORDER BY datetime(created_at) DESC, id DESC
  `).all();

  res.json(cards);
});

app.post('/api/flashcards', (req, res) => {
  const { card, errors } = validateCard(req.body || {});

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  const createdAt = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO flashcards (title, content, subject, created_at)
    VALUES (?, ?, ?, ?)
  `).run(card.title, card.content, card.subject, createdAt);

  return res.status(201).json(selectCard.get(result.lastInsertRowid));
});

app.put('/api/flashcards/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid flashcard id.' });
  }

  const { card, errors } = validateCard(req.body || {});

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  const result = db.prepare(`
    UPDATE flashcards
    SET title = ?, content = ?, subject = ?
    WHERE id = ?
  `).run(card.title, card.content, card.subject, id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Flashcard not found.' });
  }

  return res.json(selectCard.get(id));
});

app.delete('/api/flashcards/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid flashcard id.' });
  }

  const result = db.prepare('DELETE FROM flashcards WHERE id = ?').run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Flashcard not found.' });
  }

  return res.json({ ok: true });
});

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`Flashcards app running at http://localhost:${PORT}`);
});
