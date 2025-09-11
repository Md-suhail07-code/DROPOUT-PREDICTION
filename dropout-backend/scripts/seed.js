const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { parse } = require('csv-parse');

const DB_PATH = path.resolve(__dirname, '..', 'dropout.db');
// Default CSV path: projectRoot/backend/uploads/students.csv
const DEFAULT_CSV = path.resolve(__dirname, '..', '..', 'backend', 'uploads', 'students.csv');
const CSV_PATH = process.env.CSV_PATH || process.argv[2] || DEFAULT_CSV;

if (!fs.existsSync(CSV_PATH)) {
  console.error(`CSV not found at: ${CSV_PATH}`);
  process.exit(1);
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('DB error:', err.message);
    process.exit(1);
  }
});

function perfToScore(value) {
  if (value == null) return 0;
  const v = String(value).trim().toLowerCase();
  switch (v) {
    case 'excellent': return 90;
    case 'good': return 80;
    case 'average': return 70;
    case 'poor': return 50;
    default: {
      const n = parseFloat(value);
      return Number.isFinite(n) ? n : 0;
    }
  }
}

function resolveMentorId(mentorEmail, cb) {
  if (!mentorEmail) return cb(null, null);
  const name = mentorEmail.split('@')[0];
  db.run(`INSERT OR IGNORE INTO mentors (name, email) VALUES (?, ?)`, [name, mentorEmail], function() {
    db.get(`SELECT id FROM mentors WHERE email = ?`, [mentorEmail], (e, row) => {
      if (e) return cb(e);
      cb(null, row ? row.id : null);
    });
  });
}

function computeRiskLevel(attendance, score) {
  if (attendance < 60 || score < 40) return 'High';
  if (attendance < 80 || score < 60) return 'Medium';
  return 'Low';
}

function importRows(rows, done) {
  let processed = 0;
  let inserted = 0;
  let errors = 0;

  if (rows.length === 0) return done(null, { processed, inserted, errors });

  rows.forEach(r => {
    const name = r.name || r.Name || '';
    const roll_number = r.roll_number || r.Roll || r.Roll_Number || null;
    const attendance = parseFloat(r.attendance ?? r.Attendance ?? 0) || 0;
    const mentor_email = r.mentor_email || r.MentorEmail || r.mentor || null;
    const performance = perfToScore(r.performance ?? r.Performance);
    const score = performance;
    const email = r.email || r.Email || null;
    const fee_status = r.fee_status || r.Fee_Status || 'Paid';
    const backlogs = parseInt(r.backlogs ?? r.Backlogs ?? 0) || 0;
    const risk_level = computeRiskLevel(attendance, score);
    const risk_flag = risk_level === 'High' ? 1 : 0;

    resolveMentorId(mentor_email, (mErr, mentor_id) => {
      if (mErr) {
        errors++; processed++;
        if (processed === rows.length) done(null, { processed, inserted, errors });
        return;
      }
      db.run(
        `INSERT INTO students (name, roll_number, email, attendance, mentor_id, performance, score, risk_flag, risk_level, fee_status, backlogs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, roll_number, email, attendance, mentor_id, performance, score, risk_flag, risk_level, fee_status, backlogs],
        (insErr) => {
          if (insErr) errors++; else inserted++;
          processed++;
          if (processed === rows.length) done(null, { processed, inserted, errors });
        }
      );
    });
  });
}

function main() {
  const content = fs.readFileSync(CSV_PATH, 'utf8');
  parse(content, { columns: true, skip_empty_lines: true, trim: true }, (err, rows) => {
    if (err) {
      console.error('CSV parse error:', err.message);
      process.exit(1);
    }
    importRows(rows, (e, summary) => {
      if (e) {
        console.error('Import error:', e.message);
        process.exit(1);
      }
      console.log('Seeding complete:', summary);
      db.close();
    });
  });
}

main();


