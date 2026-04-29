const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const db = new Database(path.join(__dirname, 'students.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    course TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const insertStudent = db.prepare(
  'INSERT INTO students (name, email, course) VALUES (?, ?, ?)'
);
const listStudents = db.prepare(
  'SELECT id, name, email, course, created_at FROM students ORDER BY id DESC'
);

app.use(express.urlencoded({ extended: false }));

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderLayout(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 32px;
      background: #f5f7fb;
      color: #1f2937;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #fff;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }
    h1, h2 {
      margin-top: 0;
    }
    form {
      display: grid;
      gap: 12px;
      margin-bottom: 24px;
    }
    input, button {
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #d1d5db;
      font-size: 16px;
    }
    button {
      background: #2563eb;
      color: #fff;
      border: none;
      cursor: pointer;
    }
    button:hover {
      background: #1d4ed8;
    }
    .message {
      margin: 0 0 16px;
      padding: 12px;
      border-radius: 8px;
      background: #ecfdf5;
      color: #065f46;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .links {
      margin-bottom: 16px;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    ${body}
  </div>
</body>
</html>`;
}

function renderFormPage(message = '') {
  return renderLayout(
    'Student Registration',
    `
      <h1>Student Registration System</h1>
      <p>Enter student details and save them to the database.</p>
      ${message ? `<p class="message">${escapeHtml(message)}</p>` : ''}
      <form method="POST" action="/students">
        <input type="text" name="name" placeholder="Student name" required />
        <input type="email" name="email" placeholder="Email address" required />
        <input type="text" name="course" placeholder="Course" required />
        <button type="submit">Register Student</button>
      </form>
      <div class="links"><a href="/students">View registered students</a></div>
    `
  );
}

function renderStudentsPage(message = '') {
  const students = listStudents.all();

  return renderLayout(
    'Registered Students',
    `
      <h1>Registered Students</h1>
      <div class="links"><a href="/">Add a new student</a></div>
      ${message ? `<p class="message">${escapeHtml(message)}</p>` : ''}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Course</th>
            <th>Registered At</th>
          </tr>
        </thead>
        <tbody>
          ${students.length === 0 ? '<tr><td colspan="5">No students registered yet.</td></tr>' : students.map((student) => `
            <tr>
              <td>${student.id}</td>
              <td>${escapeHtml(student.name)}</td>
              <td>${escapeHtml(student.email)}</td>
              <td>${escapeHtml(student.course)}</td>
              <td>${escapeHtml(student.created_at)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
  );
}

app.get('/', (req, res) => {
  res.send(renderFormPage(req.query.message || ''));
});

app.post('/students', (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim();
  const course = (req.body.course || '').trim();

  if (!name || !email || !course) {
    res.status(400).send(renderFormPage('All fields are required.'));
    return;
  }

  insertStudent.run(name, email, course);
  res.redirect('/students?message=Student%20registered%20successfully.');
});

app.get('/students', (req, res) => {
  res.send(renderStudentsPage(req.query.message || ''));
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Student Registration System is running on http://localhost:${port}`);
});