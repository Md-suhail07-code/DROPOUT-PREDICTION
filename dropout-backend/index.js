const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
// const { parse } = require("csv-parse");
const ExcelJS = require("exceljs");
const axios = require('axios');
const MODEL_SERVICE_URL = 'https://python-backend-2nsd.onrender.com';


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const upload = multer({ storage: multer.memoryStorage() });

// DB connection
const db = new sqlite3.Database("./dropout.db", (err) => {
  if (err) console.error("DB error:", err.message);
  else console.log("Connected to SQLite database");
});

// Initialize schema if not exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin','Mentor','Student')),
    isdataadded INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS mentors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    user_id INTEGER UNIQUE,
    department TEXT,
    phone TEXT,
    password TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    roll_number TEXT UNIQUE,
    section TEXT,
    email TEXT,
    total_held INTEGER DEFAULT 0,
    total_attend INTEGER DEFAULT 0,
    attendance REAL DEFAULT 0,
    backlogs INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    mentor_id INTEGER,
    performance REAL DEFAULT 0,
    score REAL DEFAULT 0,
    fee_status TEXT,
    risk_level TEXT,
    risk_flag INTEGER DEFAULT 0,
    FOREIGN KEY(mentor_id) REFERENCES mentors(id)
  )`);
});
function parseCSV(csv, options, cb) {
  try {
    const cp = require('csv-parse');
    const parser = cp.parse || cp;
    return parser(csv, options, cb);
  } catch (e) {
    import('csv-parse').then(mod => {
      const parser = mod.parse || mod.default || mod;
      parser(csv, options, cb);
    }).catch(err => cb(err));
  }
}
// Auth helpers
function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Missing token" });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid token" });
    req.user = user;
    next();
  });
}

function authorizeRoles(...allowed) {
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
}

// Helper function to calculate risk level
function calculateRiskLevel(attendance, score, feeStatus) {
  let riskScore = 0;
  
  // Attendance scoring (0-40 points)
  if (attendance < 60) riskScore += 40;
  else if (attendance < 70) riskScore += 30;
  else if (attendance < 80) riskScore += 20;
  else if (attendance < 90) riskScore += 10;
  
  // Academic performance scoring (0-30 points)
  if (score < 40) riskScore += 30;
  else if (score < 50) riskScore += 25;
  else if (score < 60) riskScore += 20;
  else if (score < 70) riskScore += 15;
  else if (score < 80) riskScore += 10;
  else if (score < 90) riskScore += 5;
  
  // Fee status scoring (0-30 points)
  if (feeStatus === 'Overdue') riskScore += 30;
  else if (feeStatus === 'Pending') riskScore += 15;
  else if (feeStatus === 'Partial') riskScore += 10;
  
  // Determine risk level
  if (riskScore >= 70) return 'High';
  else if (riskScore >= 40) return 'Medium';
  else return 'Low';
}

function performanceToScore(value) {
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

// Validation middleware
function validateStudent(req, res, next) {
  const { name, age, gender, village, attendance, score, fee_status } = req.body;
  
  if (!name || !age || !gender || !village || attendance === undefined || score === undefined || !fee_status) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required: name, age, gender, village, attendance, score, fee_status'
    });
  }
  
  if (age < 5 || age > 25) {
    return res.status(400).json({
      success: false,
      message: 'Age must be between 5 and 25'
    });
  }
  
  if (attendance < 0 || attendance > 100) {
    return res.status(400).json({
      success: false,
      message: 'Attendance must be between 0 and 100'
    });
  }
  
  if (score < 0 || score > 100) {
    return res.status(400).json({
      success: false,
      message: 'Score must be between 0 and 100'
    });
  }
  
  const validGenders = ['Male', 'Female', 'Other'];
  if (!validGenders.includes(gender)) {
    return res.status(400).json({
      success: false,
      message: 'Gender must be one of: Male, Female, Other'
    });
  }
  
  const validFeeStatuses = ['Paid', 'Pending', 'Partial', 'Overdue'];
  if (!validFeeStatuses.includes(fee_status)) {
    return res.status(400).json({
      success: false,
      message: 'Fee status must be one of: Paid, Pending, Partial, Overdue'
    });
  }
  
  next();
}

// Add this helper function somewhere in your index.js
function generateFallbackRecommendations(studentData) {
    const { attendance, backlogs, fee_status } = studentData;
    const recommendations = [];

    // Determine the overall risk level for the situation analysis
    let risk_level = 'Low';
    if (attendance < 75 || backlogs > 0 || fee_status !== 'Paid') {
        risk_level = 'Medium';
    }
    if (attendance < 60 || backlogs >= 3 || fee_status === 'Overdue') {
        risk_level = 'High';
    }

    // Situation Analysis
    let analysis = `Situation Analysis: This student is currently facing a ${risk_level} risk.`;

    if (risk_level === 'Low') {
        analysis += ` The student is performing exceptionally well with strong attendance and no academic backlogs. They are on track for academic success.`;
        recommendations.push(analysis);
        recommendations.push("✅ Status: Low Risk - No Immediate Action Required");
        recommendations.push("This student is excelling and no intervention is needed. Continue to monitor their progress periodically to ensure they remain on track.");
        recommendations.push("✨ Recommendations for Continued Excellence:");
        recommendations.push("Encourage the student to take on advanced academic challenges or participate in student-led projects to further their growth.");
        recommendations.push("Recognize and reward the student's excellent performance to reinforce their positive behavior and serve as an example to their peers.");
        recommendations.push("Provide opportunities for them to mentor other students, which can improve their leadership skills and strengthen their own knowledge.");
        return recommendations;
    }

    if (attendance < 75) {
        analysis += ` This is primarily due to low attendance (${attendance}%) which appears to be directly contributing to academic difficulties, evidenced by ${backlogs} subject backlogs.`;
    }
    if (backlogs > 0) {
        analysis += ` They have ${backlogs} backlogs, which poses a significant academic challenge.`;
    }
    if (fee_status === 'Overdue') {
        analysis += ` The financial status is a serious concern with an overdue fee status.`;
    }

    recommendations.push(analysis);

    // Immediate Actions
    recommendations.push("⚡ Immediate Actions:");
    if (attendance < 75) {
        recommendations.push(`Reach out to the student within 48 hours for a quick check-in to empathetically understand the reasons behind their ${attendance}% attendance.`);
    }
    if (backlogs > 0) {
        recommendations.push(`Offer immediate support by helping them prioritize which of the ${backlogs} backlog subjects to focus on first, perhaps by connecting them with a relevant course instructor or existing study materials.`);
    }

    // Academic Support
    recommendations.push("📚 Academic Support:");
    if (attendance < 75) {
        recommendations.push("Collaborate with the student to create a realistic attendance improvement plan, emphasizing how consistent presence directly impacts understanding and reduces the risk of future backlogs.");
    }
    if (backlogs > 0) {
        recommendations.push("Connect the student with targeted academic resources such as peer tutoring or specialized study groups to effectively tackle their backlogs.");
    }
    
    // Financial/Mental Health Support (if applicable)
    if (fee_status === 'Overdue' || fee_status === 'Pending' || fee_status === 'Partial') {
      recommendations.push("💰 Financial & Well-being Support:");
      if (fee_status === 'Overdue' || fee_status === 'Partial') {
        recommendations.push("Connect them with the financial aid office to confidentially discuss an installment plan or potential scholarship opportunities to resolve the fee issue.");
      }
      recommendations.push("Suggest a meeting with a mental health counselor to discuss any personal challenges that might be affecting their academic journey and financial well-being.");
    }

    return recommendations;
}
// Routes

// Auth routes
app.post("/auth/signup", (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: "name, email, password, role are required" });
  }
  const validRoles = ["Admin", "Mentor", "Student"];
  if (!validRoles.includes(role)) return res.status(400).json({ success: false, message: "Invalid role" });

  const hashed = bcrypt.hashSync(password, 10);
  const insertUser = `INSERT INTO users (name, email, password, role, isdataadded) VALUES (?, ?, ?, ?, ?)`;
  db.run(insertUser, [name, email, hashed, role], function(err) {
    if (err) {
      return res.status(400).json({ success: false, message: "User create failed", error: err.message });
    }

    const user = { id: this.lastID, name, email, role, isdataadded: 0 };

    if (role === "Mentor") {
      db.run(`INSERT INTO mentors (name, email, user_id) VALUES (?, ?, ?)`, [name, email, user.id], (mErr) => {
        if (mErr) console.error("mentor create error:", mErr.message);
      });
    }

    const token = generateToken(user);
    res.status(201).json({ success: true, data: { user, token } });
  });
});

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: "email and password required" });
  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) return res.status(500).json({ success: false, message: "DB error", error: err.message });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });
    const ok = bcrypt.compareSync(password, user.password);
    if (!ok) return res.status(401).json({ success: false, message: "Invalid credentials" });
    const token = generateToken(user);
    res.json({ success: true, data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token } });
  });
});

// Health check route
app.get("/", (req, res) => {
  res.json({ 
    success: true,
    message: "Dropout Prediction API running 🚀",
    version: "1.0.0",
    endpoints: [
      "POST /auth/signup - Create user",
      "POST /auth/login - Login",
      "GET /admin/students - Admin: all students",
      "GET /mentor/students - Mentor: own students",
      "GET /student/me - Student: own profile",
      "POST /students - Add a new student",
      "GET /students - Get all students",
      "GET /students/high-risk - Get high-risk students",
      "PUT /students/:id/risk-level - Update student risk level"
    ]
  });
});

// Admin: all students (auth)
app.get("/admin/students", authenticateToken, authorizeRoles("Admin"), (req, res) => {
  db.all(`SELECT s.*, m.name as mentor_name FROM students s LEFT JOIN mentors m ON s.mentor_id = m.id ORDER BY s.name ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: "Failed to fetch students", error: err.message });
    res.json({ success: true, count: rows.length, data: rows });
  });
});

app.get("/admin/students/:id", authenticateToken, authorizeRoles("Admin"), (req, res) => { 
  const { id } = req.params;
  db.get(`SELECT s.*, m.name as mentor_name, m.email as mentor_email FROM students s LEFT JOIN mentors m ON s.mentor_id = m.id WHERE s.id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: "DB error", error: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, data: row });
  });
});

// Admin/mentor can request prediction+recommendations for a student by id
// Corrected route with fallback logic
app.get("/admin/students/:id/predict", authenticateToken, authorizeRoles("Admin", "Mentor"), (req, res) => {
  const { id } = req.params;
  db.get(`SELECT attendance, backlogs, fee_status FROM students WHERE id = ?`, [id], async (err, row) => {
    // ... (unchanged code)
    try {
      // Attempt to call the Python model service
      const payload = {
        attendance: row.attendance || 0,
        backlogs: row.backlogs || 0,
        fee_status: row.fee_status || 'Paid'
      };
      const resp = await axios.post(`${MODEL_SERVICE_URL}/predict`, payload, { timeout: 10000 });
      return res.json({ success: true, data: resp.data.data });

    } catch (e) {
      // Fallback logic
      console.error("Model call error, providing fallback recommendations:", e.message || e);
      const fallbackRecs = generateFallbackRecommendations(row);
      const fallbackPrediction = {
        // You can't get the ML model's prediction, so use your database's risk level or a default
        risk_level: row.risk_level || 'Unknown',
        confidence: 0, // Confidence is unknown
        proba: []
      };
      
      return res.json({
        success: true,
        data: {
          prediction: fallbackPrediction,
          recommendations: fallbackRecs,
          explanation: {
            attendance: row.attendance || 0,
            backlogs: row.backlogs || 0,
            fee_status: row.fee_status || 'Paid'
          }
        }
      });
    }
  });
});

app.get("/admin/isdataadded", authenticateToken, authorizeRoles("Admin"), (req, res) => {
  const userId = req.user.id;

  db.get(`SELECT isdataadded FROM users WHERE id = ?`, [userId], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: "DB error", error: err.message });
    }

    if (!row) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Return the current status
    res.status(200).json({ success: true, isdataadded: row.isdataadded });
  });
});

app.put("/admin/toggle-data-added", authenticateToken, authorizeRoles("Admin"), (req, res) => {
  const userId = req.user.id;

  // First, get the current value of isdataadded
  db.get(`SELECT isdataadded FROM users WHERE id = ?`, [userId], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: "DB error", error: err.message });
    }

    if (!row) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Determine the new value (toggle 1 to 0 or 0 to 1)
    const newStatus = row.isdataadded === 1 ? 0 : 1;

    // Now, update the value in the database
    db.run(`UPDATE users SET isdataadded = ? WHERE id = ?`, [newStatus, userId], function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: "DB error", error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: "User not found or no changes made." });
      }

      res.status(200).json({ success: true, message: `isdataadded updated to ${newStatus}.` });
    });
  });
});


// Mentor: own students
app.get("/mentor/students", authenticateToken, authorizeRoles("Mentor"), (req, res) => {
  // Look up mentor by linked user_id when available, or fallback to the authenticated email
  const userId = req.user && req.user.id;
  const userEmail = req.user && req.user.email;
  db.get(`SELECT id, email FROM mentors WHERE user_id = ? OR email = ? LIMIT 1`, [userId || null, userEmail || null], (err, mentor) => {
    if (err) {
      return res.status(500).json({ success: false, message: "DB error", error: err.message });
    }
    if (!mentor) {
      return res.status(404).json({ success: false, message: "Mentor profile not found" });
    }

    // ✅ Use mentor.email, not just id
    db.all(`SELECT * FROM students WHERE mentor_id = ? ORDER BY name ASC`, [mentor.id], (e2, rows) => {
      if (e2) {
        return res.status(500).json({ success: false, message: "Failed to fetch", error: e2.message });
      }
      res.json({ success: true, count: rows.length, data: rows });
    });
  });
});

// Student: own profile by email match
app.get("/student/me", authenticateToken, authorizeRoles("Student"), (req, res) => {
  db.get(`SELECT * FROM students WHERE email = ?`, [req.user.email], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: "DB error", error: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Student profile not found" });
    res.json({ success: true, data: row });
  });
});

// POST /students - Add a new student
app.post("/students", validateStudent, (req, res) => {
  const { name, age, gender, village, attendance, score, fee_status, email, roll_number, mentor_id, performance } = req.body;
  const risk_level = calculateRiskLevel(attendance, score, fee_status);
  const risk_flag = attendance < 75 ? 1 : 0;
  
  const sql = `INSERT INTO students (name, age, gender, village, attendance, score, fee_status, risk_level, email, roll_number, mentor_id, performance, risk_flag) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [name, age, gender, village, attendance, score, fee_status, risk_level, email || null, roll_number || null, mentor_id || null, performance || score || 0, risk_flag], function(err) {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to add student',
        error: err.message
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      data: {
        id: this.lastID,
        name,
        age,
        gender,
        village,
        attendance,
        score,
        fee_status,
        risk_level,
        email: email || null,
        roll_number: roll_number || null,
        mentor_id: mentor_id || null,
        performance: performance || score || 0,
        risk_flag
      }
    });
  });
});

// GET /students - Get all students
app.get("/students", (req, res) => {
  const sql = "SELECT * FROM students ORDER BY risk_level DESC, name ASC";
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch students',
        error: err.message
      });
    }
    
    res.json({
      success: true,
      message: 'Students fetched successfully',
      count: rows.length,
      data: rows
    });
  });
});

// GET /students/high-risk - Get high-risk students
app.get("/students/high-risk", (req, res) => {
  const sql = "SELECT * FROM students WHERE risk_level = 'High' ORDER BY attendance ASC, score ASC";
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch high-risk students',
        error: err.message
      });
    }
    
    res.json({
      success: true,
      message: 'High-risk students fetched successfully',
      count: rows.length,
      data: rows
    });
  });
});

app.get("/students/medium-risk", (req, res) => {
  const sql = "SELECT * FROM students WHERE risk_level = 'Medium' ORDER BY attendance ASC, score ASC";
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch medium-risk students',
        error: err.message
      });
    }
    
    res.json({
      success: true,
      message: 'Medium-risk students fetched successfully',
      count: rows.length,
      data: rows
    });
  });
});

app.get("/students/low-risk", (req, res) => {
  const sql = "SELECT * FROM students WHERE risk_level = 'Low' ORDER BY attendance ASC, score ASC";
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch low-risk students',
        error: err.message
      });
    }
    res.json({
      success: true,
      message: 'Low-risk students fetched successfully',
      count: rows.length,
      data: rows
    });
  });
});

// =================== Mentor APIs ===================

// Add mentor (Admin only - JSON)
app.post("/admin/mentors/add", authenticateToken, authorizeRoles("Admin"), (req, res) => {
  const { name, email, department, phone, password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: "Name and Email are required" });
  }

  const query = `
    INSERT INTO mentors (name, email, department, phone, password)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(query, [name, email, department || null, phone || null, password || "password123"], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(409).json({ success: false, message: "Mentor already exists with this email" });
      }
      return res.status(500).json({ success: false, message: "Database error", error: err.message });
    }

    return res.json({
      success: true,
      message: "Mentor added successfully",
      mentor_id: this.lastID
    });
  });
});


// Import mentors from CSV (Admin only - Bulk Upload)
app.post("/admin/mentors/import", authenticateToken, authorizeRoles("Admin"), upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

  const csv = req.file.buffer.toString();

  parseCSV(csv, { columns: true, skip_empty_lines: true, trim: true }, (err, rows) => {
    if (err) return res.status(400).json({ success: false, message: "CSV parse error", error: err.message });

    let processed = 0;
    const total = rows.length;
    if (total === 0) return res.json({ success: true, message: "No rows to import", count: 0 });

    rows.forEach(r => {
      const name = r.NAME || r.Name || r.name || "";
      const email = r.EMAIL || r.Email || r.email || null;
      const department = r.DEPARTMENT || r.Department || r.department || null;
      const phone = r.PHONE || r.Phone || r.phone || null;
      const password = r.PASSWORD || r.Password || r.password || "password123";

      if (!name || !email) {
        processed++;
        if (processed === total) {
          return res.status(207).json({ success: false, message: "Import completed with errors", count: total, error: "Some mentors missing required fields" });
        }
        return;
      }

      // Try to insert with full columns; if the table was created earlier without extra columns, fallback to (name,email)
      db.run(
        `INSERT OR IGNORE INTO mentors (name, email, department, phone, password)
         VALUES (?, ?, ?, ?, ?)`,
        [name, email, department, phone, password],
        function (insErr) {
          if (insErr && /no such column/i.test(insErr.message)) {
            // fallback to minimal insert
            db.run(`INSERT OR IGNORE INTO mentors (name, email) VALUES (?, ?)`, [name, email], (err2) => {
              processed++;
              if (processed === total) {
                if (err2) return res.status(207).json({ success: false, message: "Import completed with errors", count: total, error: err2.message });
                return res.json({ success: true, message: "Mentor import completed", count: total });
              }
            });
            return;
          }
          processed++;
          if (processed === total) {
            if (insErr) return res.status(207).json({ success: false, message: "Import completed with errors", count: total, error: insErr.message });
            return res.json({ success: true, message: "Mentor import completed", count: total });
          }
        }
      );
    });
  });
});



// CSV import (Admin)
app.post("/admin/students/import", authenticateToken, authorizeRoles("Admin"), upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
  const csv = req.file.buffer.toString();
  parseCSV(csv, { columns: true, skip_empty_lines: true, trim: true }, (err, rows) => {
    if (err) return res.status(400).json({ success: false, message: "CSV parse error", error: err.message });
    // Helper to resolve or create mentor by email
    const resolveMentorId = (mentorEmail, mentorName, cb) => {
      if (!mentorEmail) return cb(null, null);
      const name = mentorName || mentorEmail.split('@')[0];
      // Avoid race by using INSERT OR IGNORE then SELECT id
      db.run(`INSERT OR IGNORE INTO mentors (name, email) VALUES (?, ?)`, [name, mentorEmail], function() {
        db.get(`SELECT id FROM mentors WHERE email = ?`, [mentorEmail], (e, row) => {
          if (e) return cb(e);
          cb(null, row ? row.id : null);
        });
      });
    };

    let processed = 0;
    const total = rows.length;
    if (total === 0) return res.json({ success: true, message: "No rows to import", count: 0 });

    rows.forEach(r => {
      const name = r.NAME || r.Name || r.name || "";
      const roll_number = r.ROLLNO || r.Roll || r.Roll_Number || null;
      const section = r.Section || r.section || null;
      const email = r.EMAIL || r.Email || r.email || null;

      const total_held = parseInt(r["Total-Held"] || r.total_held || 0);
      const total_attend = parseInt(r["Total-Attend"] || r.total_attend || 0);
      const attendance = total_held > 0 ? ((total_attend / total_held) * 100).toFixed(2) : 0;

      const backlogs = parseInt(r["No.of backlogs"] || r.backlogs || 0);
      const attempts = parseInt(r["No.of attempts"] || r.attempts || 0);
      const fee_status = r["fee-status"] || r.fee_status || "Paid";
      const mentor_email = r.mentor_email || r.Mentor_Email || r.Mentor || null;

      const score = 100 - (backlogs * 10 + attempts * 5); // simple baseline score
      const risk_level = calculateRiskLevel(attendance, score, fee_status);
      const risk_flag = risk_level === 'High' ? 1 : 0;

      resolveMentorId(mentor_email, null, (mErr, mentor_id) => {
        if (mErr) {
          processed++;
          if (processed === total) {
            return res.status(207).json({ success: false, message: "Import completed with errors", count: total, error: mErr.message });
          }
          return;
        }
    db.run(
  `INSERT INTO students (name, roll_number, section, email, total_held, total_attend, attendance, backlogs, attempts, fee_status, score, risk_level, risk_flag, mentor_id)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [name, roll_number, section, email, total_held, total_attend, attendance, backlogs, attempts, fee_status, score, risk_level, risk_flag, mentor_id],
    (insErr) => {
      processed++;
      if (processed === total) {
        if (insErr) return res.status(207).json({ success: false, message: "Import completed with errors", count: total, error: insErr.message });
        return res.json({ success: true, message: "Import completed", count: total });
      }
    }
  );
      });
    });
  });
});

// Excel export (Admin)
app.get("/admin/students/export", authenticateToken, authorizeRoles("Admin"), async (req, res) => {
  db.all(`SELECT s.*, m.name as mentor_name FROM students s LEFT JOIN mentors m ON s.mentor_id = m.id ORDER BY s.name ASC`, [], async (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: "DB error", error: err.message });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Students");
    ws.columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "Name", key: "name", width: 24 },
      { header: "Roll Number", key: "roll_number", width: 16 },
      { header: "Email", key: "email", width: 26 },
      { header: "Attendance", key: "attendance", width: 14 },
      { header: "Performance", key: "performance", width: 14 },
      { header: "Risk Flag", key: "risk_flag", width: 10 },
      { header: "Mentor Name", key: "mentor_name", width: 24 },
      { header: "Fee Status", key: "fee_status", width: 14 },
      { header: "Backlogs", key: "backlogs", width: 10 }
    ];
    rows.forEach(r => ws.addRow(r));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="students.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  });
});

// CSV export (Admin)
app.get("/admin/students/export-csv", authenticateToken, authorizeRoles("Admin"), (req, res) => {
  db.all(`SELECT s.id, s.name, s.roll_number, s.email, s.attendance, s.performance, s.risk_flag, COALESCE(m.name,'') as mentor_name, COALESCE(m.email,'') as mentor_email FROM students s LEFT JOIN mentors m ON s.mentor_id = m.id ORDER BY s.name ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: "DB error", error: err.message });
    const headers = ['id','name','roll_number','email','attendance','performance','risk_flag','mentor_name','mentor_email'];
    const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => {
      const v = r[h];
      const str = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(str) ? '"' + str.replace(/"/g,'""') + '"' : str;
    }).join(',')));
    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
    res.send(csv);
  });
});

// PUT /students/:id/risk-level - Update student risk level
app.put("/students/:id/risk-level", (req, res) => {
  const { id } = req.params;
  const { risk_level } = req.body;
  
  if (!risk_level) {
    return res.status(400).json({
      success: false,
      message: 'Risk level is required'
    });
  }
  
  const validRiskLevels = ['Low', 'Medium', 'High'];
  if (!validRiskLevels.includes(risk_level)) {
    return res.status(400).json({
      success: false,
      message: 'Risk level must be one of: Low, Medium, High'
    });
  }
  
  const sql = "UPDATE students SET risk_level = ? WHERE id = ?";
  
  db.run(sql, [risk_level, id], function(err) {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update risk level',
        error: err.message
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Risk level updated successfully',
      data: {
        id: parseInt(id),
        risk_level
      }
    });
  });
});

// GET /students/:id - Get a specific student
app.get("/students/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM students WHERE id = ?";
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch student',
        error: err.message
      });
    }
    
    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Student fetched successfully',
      data: row
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'POST /students',
      'GET /students',
      'GET /students/high-risk',
      'PUT /students/:id/risk-level',
      'GET /students/:id'
    ]
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Dropout Prediction API v1.0.0`);
  console.log(`📝 Available endpoints:`);
  console.log(`   POST   /auth/signup - Create user`);
  console.log(`   POST   /auth/login  - Login`);
  console.log(`   POST   /students - Add a new student`);
  console.log(`   GET    /students - Get all students`);
  console.log(`   GET    /students/high-risk - Get high-risk students`);
  console.log(`   PUT    /students/:id/risk-level - Update risk level`);
  console.log(`   GET    /students/:id - Get specific student`);
  console.log(`   GET    /admin/students - Admin: all students (auth)`);
  console.log(`   GET    /mentor/students - Mentor: own students (auth)`);
  console.log(`   GET    /student/me - Student: own profile (auth)`);
  console.log(`   POST   /admin/students/import - Admin: import CSV`);
  console.log(`   GET    /admin/students/export - Admin: export Excel`);
});
