const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./tracking.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS shipments (
    tracking_number TEXT PRIMARY KEY,
    carrier TEXT,
    status TEXT,
    location TEXT,
    last_updated TEXT,
    notes TEXT,
    email TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_number TEXT,
    status TEXT,
    location TEXT,
    timestamp TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_number TEXT,
    message TEXT,
    timestamp TEXT
  )`);
});

function generateTracking(carrier) {
  const randomDigits = (length) => Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
  const randomLetters = (length) => Array.from({ length }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');

  switch (carrier) {
    case 'UPS': return '1Z' + randomLetters(6) + randomDigits(10);
    case 'DHL': return 'JD' + randomDigits(18);
    case 'EVRI': return 'H00' + randomDigits(13);
    case 'ROYALMAIL': return randomLetters(2) + randomDigits(9) + 'GB';
    default: return 'TEST' + randomDigits(10);
  }
}

function sendNotification(tracking, status, email) {
  const message = `Parcel ${tracking} update: ${status}`;
  const time = new Date().toISOString();

  db.run(`INSERT INTO notifications (tracking_number, message, timestamp) VALUES (?, ?, ?)`,
    [tracking, message, time]);

  console.log('📧 FAKE EMAIL SENT TO:', email || 'no email');
  console.log('MESSAGE:', message);
}

app.post('/create', (req, res) => {
  const { carrier, status, location, notes, email } = req.body;
  const tracking = generateTracking(carrier);
  const time = new Date().toISOString();

  db.run(`INSERT INTO shipments VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [tracking, carrier, status, location, time, notes, email]);

  db.run(`INSERT INTO history (tracking_number, status, location, timestamp) VALUES (?, ?, ?, ?)`,
    [tracking, status, location, time]);

  sendNotification(tracking, status, email);

  res.json({ tracking });
});

app.post('/update', (req, res) => {
  const { tracking, status, location } = req.body;
  const time = new Date().toISOString();

  db.get(`SELECT email FROM shipments WHERE tracking_number=?`, [tracking], (err, row) => {
    const email = row ? row.email : null;

    db.run(`UPDATE shipments SET status=?, location=?, last_updated=? WHERE tracking_number=?`,
      [status, location, time, tracking]);

    db.run(`INSERT INTO history (tracking_number, status, location, timestamp) VALUES (?, ?, ?, ?)`,
      [tracking, status, location, time]);

    sendNotification(tracking, status, email);

    res.json({ message: 'Updated + Notification Sent' });
  });
});

app.get('/track/:tracking', (req, res) => {
  const tracking = req.params.tracking;

  db.get(`SELECT * FROM shipments WHERE tracking_number=?`, [tracking], (err, shipment) => {
    if (!shipment) return res.status(404).json({ error: 'Not found' });

    db.all(`SELECT * FROM history WHERE tracking_number=? ORDER BY timestamp DESC`, [tracking], (err, history) => {
      db.all(`SELECT * FROM notifications WHERE tracking_number=? ORDER BY timestamp DESC`, [tracking], (err, notifications) => {
        res.json({ shipment, history, notifications });
      });
    });
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
