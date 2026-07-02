const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDatabaseConnection } = require('../config/db');

// Ensure uploads folder exists
const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and PDF files are allowed!'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ==========================================
// 1. STUDENT PROFILE ROUTES
// ==========================================

router.put('/profile', async (req, res) => {
  const { name, roll_number, department, current_semester, contact_info, photo_url } = req.body;
  try {
    const db = await getDatabaseConnection();
    await db.run(
      `UPDATE users 
       SET name = ?, roll_number = ?, department = ?, current_semester = ?, contact_info = ?, photo_url = ?
       WHERE id = ?`,
      [name, roll_number, department, current_semester, contact_info, photo_url, req.user.id]
    );

    const updatedUser = await db.get(
      'SELECT id, username, name, roll_number, department, current_semester, contact_info, photo_url FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Photo upload endpoint
router.post('/profile/upload-photo', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  const photoUrl = `/uploads/${req.file.filename}`;
  res.json({ photoUrl });
});

// ==========================================
// 2. ACADEMIC RECORDS ROUTES
// ==========================================

router.get('/academics', async (req, res) => {
  try {
    const db = await getDatabaseConnection();
    const records = await db.all(
      'SELECT * FROM academic_records WHERE user_id = ? ORDER BY semester ASC, subject_name ASC',
      [req.user.id]
    );
    res.json(records);
  } catch (error) {
    console.error('Fetch academics error:', error);
    res.status(500).json({ error: 'Failed to fetch academic records.' });
  }
});

router.post('/academics', async (req, res) => {
  const { semester, subject_name, subject_code, max_marks, marks_obtained, credits } = req.body;
  if (!semester || !subject_name || !subject_code || !max_marks || marks_obtained === undefined || !credits) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const db = await getDatabaseConnection();
    const result = await db.run(
      `INSERT INTO academic_records (user_id, semester, subject_name, subject_code, max_marks, marks_obtained, credits)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, semester, subject_name, subject_code, max_marks, marks_obtained, credits]
    );
    const newRecord = { id: result.lastID, user_id: req.user.id, semester, subject_name, subject_code, max_marks, marks_obtained, credits };
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Add academic record error:', error);
    res.status(500).json({ error: 'Failed to add academic record.' });
  }
});

router.put('/academics/:id', async (req, res) => {
  const { semester, subject_name, subject_code, max_marks, marks_obtained, credits } = req.body;
  try {
    const db = await getDatabaseConnection();
    // Validate ownership
    const record = await db.get('SELECT id FROM academic_records WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!record) return res.status(404).json({ error: 'Record not found or unauthorized' });

    await db.run(
      `UPDATE academic_records 
       SET semester = ?, subject_name = ?, subject_code = ?, max_marks = ?, marks_obtained = ?, credits = ?
       WHERE id = ? AND user_id = ?`,
      [semester, subject_name, subject_code, max_marks, marks_obtained, credits, req.params.id, req.user.id]
    );
    res.json({ id: parseInt(req.params.id), semester, subject_name, subject_code, max_marks, marks_obtained, credits });
  } catch (error) {
    console.error('Update academic record error:', error);
    res.status(500).json({ error: 'Failed to update academic record.' });
  }
});

router.delete('/academics/:id', async (req, res) => {
  try {
    const db = await getDatabaseConnection();
    // Validate ownership
    const record = await db.get('SELECT id FROM academic_records WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!record) return res.status(404).json({ error: 'Record not found or unauthorized' });

    await db.run('DELETE FROM academic_records WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Academic record deleted successfully', id: parseInt(req.params.id) });
  } catch (error) {
    console.error('Delete academic record error:', error);
    res.status(500).json({ error: 'Failed to delete academic record.' });
  }
});

// ==========================================
// 3. ATTENDANCE TRACKER ROUTES
// ==========================================

router.get('/attendance', async (req, res) => {
  try {
    const db = await getDatabaseConnection();
    const records = await db.all(
      'SELECT * FROM attendance WHERE user_id = ? ORDER BY semester ASC, subject_name ASC',
      [req.user.id]
    );
    res.json(records);
  } catch (error) {
    console.error('Fetch attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records.' });
  }
});

router.post('/attendance', async (req, res) => {
  const { semester, subject_name, total_classes, attended_classes } = req.body;
  if (!semester || !subject_name || total_classes === undefined || attended_classes === undefined) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const db = await getDatabaseConnection();
    const result = await db.run(
      `INSERT INTO attendance (user_id, semester, subject_name, total_classes, attended_classes)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, semester, subject_name, total_classes, attended_classes]
    );
    res.status(201).json({ id: result.lastID, user_id: req.user.id, semester, subject_name, total_classes, attended_classes });
  } catch (error) {
    console.error('Add attendance error:', error);
    res.status(500).json({ error: 'Failed to add attendance record.' });
  }
});

router.put('/attendance/:id', async (req, res) => {
  const { semester, subject_name, total_classes, attended_classes } = req.body;
  try {
    const db = await getDatabaseConnection();
    const record = await db.get('SELECT id FROM attendance WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!record) return res.status(404).json({ error: 'Record not found or unauthorized' });

    await db.run(
      `UPDATE attendance 
       SET semester = ?, subject_name = ?, total_classes = ?, attended_classes = ?
       WHERE id = ? AND user_id = ?`,
      [semester, subject_name, total_classes, attended_classes, req.params.id, req.user.id]
    );
    res.json({ id: parseInt(req.params.id), semester, subject_name, total_classes, attended_classes });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: 'Failed to update attendance record.' });
  }
});

router.delete('/attendance/:id', async (req, res) => {
  try {
    const db = await getDatabaseConnection();
    const record = await db.get('SELECT id FROM attendance WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!record) return res.status(404).json({ error: 'Record not found or unauthorized' });

    await db.run('DELETE FROM attendance WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Attendance record deleted successfully', id: parseInt(req.params.id) });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ error: 'Failed to delete attendance record.' });
  }
});

// ==========================================
// 4. PROJECTS ROUTES
// ==========================================

router.get('/projects', async (req, res) => {
  try {
    const db = await getDatabaseConnection();
    const records = await db.all('SELECT * FROM projects WHERE user_id = ?', [req.user.id]);
    res.json(records);
  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

router.post('/projects', async (req, res) => {
  const { title, description, tech_used, duration, link, role } = req.body;
  if (!title || !description || !tech_used || !duration || !role) {
    return res.status(400).json({ error: 'Required fields: title, description, tech_used, duration, role' });
  }
  try {
    const db = await getDatabaseConnection();
    const result = await db.run(
      `INSERT INTO projects (user_id, title, description, tech_used, duration, link, role)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, description, tech_used, duration, link || '', role]
    );
    res.status(201).json({ id: result.lastID, user_id: req.user.id, title, description, tech_used, duration, link, role });
  } catch (error) {
    console.error('Add project error:', error);
    res.status(500).json({ error: 'Failed to add project.' });
  }
});

router.put('/projects/:id', async (req, res) => {
  const { title, description, tech_used, duration, link, role } = req.body;
  try {
    const db = await getDatabaseConnection();
    const record = await db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!record) return res.status(404).json({ error: 'Project not found or unauthorized' });

    await db.run(
      `UPDATE projects 
       SET title = ?, description = ?, tech_used = ?, duration = ?, link = ?, role = ?
       WHERE id = ? AND user_id = ?`,
      [title, description, tech_used, duration, link, role, req.params.id, req.user.id]
    );
    res.json({ id: parseInt(req.params.id), title, description, tech_used, duration, link, role });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    const db = await getDatabaseConnection();
    const record = await db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!record) return res.status(404).json({ error: 'Project not found or unauthorized' });

    await db.run('DELETE FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Project deleted successfully', id: parseInt(req.params.id) });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

// ==========================================
// 5. EVENTS & COMPETITIONS ROUTES
// ==========================================

router.get('/events', async (req, res) => {
  try {
    const db = await getDatabaseConnection();
    const records = await db.all('SELECT * FROM events WHERE user_id = ? ORDER BY date DESC', [req.user.id]);
    res.json(records);
  } catch (error) {
    console.error('Fetch events error:', error);
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
});

router.post('/events', async (req, res) => {
  const { event_name, type, date, level, result_status } = req.body;
  if (!event_name || !type || !date || !level || !result_status) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const db = await getDatabaseConnection();
    const result = await db.run(
      `INSERT INTO events (user_id, event_name, type, date, level, result_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, event_name, type, date, level, result_status]
    );
    res.status(201).json({ id: result.lastID, user_id: req.user.id, event_name, type, date, level, result_status });
  } catch (error) {
    console.error('Add event error:', error);
    res.status(500).json({ error: 'Failed to add event.' });
  }
});

router.put('/events/:id', async (req, res) => {
  const { event_name, type, date, level, result_status } = req.body;
  try {
    const db = await getDatabaseConnection();
    const record = await db.get('SELECT id FROM events WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!record) return res.status(404).json({ error: 'Event not found or unauthorized' });

    await db.run(
      `UPDATE events 
       SET event_name = ?, type = ?, date = ?, level = ?, result_status = ?
       WHERE id = ? AND user_id = ?`,
      [event_name, type, date, level, result_status, req.params.id, req.user.id]
    );
    res.json({ id: parseInt(req.params.id), event_name, type, date, level, result_status });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event.' });
  }
});

router.delete('/events/:id', async (req, res) => {
  try {
    const db = await getDatabaseConnection();
    const record = await db.get('SELECT id FROM events WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!record) return res.status(404).json({ error: 'Event not found or unauthorized' });

    await db.run('DELETE FROM events WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Event deleted successfully', id: parseInt(req.params.id) });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event.' });
  }
});

// ==========================================
// 6. ACHIEVEMENTS ROUTES
// ==========================================

router.get('/achievements', async (req, res) => {
  try {
    const db = await getDatabaseConnection();
    const records = await db.all('SELECT * FROM achievements WHERE user_id = ? ORDER BY date DESC', [req.user.id]);
    res.json(records);
  } catch (error) {
    console.error('Fetch achievements error:', error);
    res.status(500).json({ error: 'Failed to fetch achievements.' });
  }
});

router.post('/achievements', async (req, res) => {
  const { title, description, date, issuing_authority } = req.body;
  if (!title || !description || !date || !issuing_authority) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const db = await getDatabaseConnection();
    const result = await db.run(
      `INSERT INTO achievements (user_id, title, description, date, issuing_authority)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, title, description, date, issuing_authority]
    );
    res.status(201).json({ id: result.lastID, user_id: req.user.id, title, description, date, issuing_authority });
  } catch (error) {
    console.error('Add achievement error:', error);
    res.status(500).json({ error: 'Failed to add achievement.' });
  }
});

router.put('/achievements/:id', async (req, res) => {
  const { title, description, date, issuing_authority } = req.body;
  try {
    const db = await getDatabaseConnection();
    const record = await db.get('SELECT id FROM achievements WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!record) return res.status(404).json({ error: 'Achievement not found or unauthorized' });

    await db.run(
      `UPDATE achievements 
       SET title = ?, description = ?, date = ?, issuing_authority = ?
       WHERE id = ? AND user_id = ?`,
      [title, description, date, issuing_authority, req.params.id, req.user.id]
    );
    res.json({ id: parseInt(req.params.id), title, description, date, issuing_authority });
  } catch (error) {
    console.error('Update achievement error:', error);
    res.status(500).json({ error: 'Failed to update achievement.' });
  }
});

router.delete('/achievements/:id', async (req, res) => {
  try {
    const db = await getDatabaseConnection();
    const record = await db.get('SELECT id FROM achievements WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!record) return res.status(404).json({ error: 'Achievement not found or unauthorized' });

    await db.run('DELETE FROM achievements WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Achievement deleted successfully', id: parseInt(req.params.id) });
  } catch (error) {
    console.error('Delete achievement error:', error);
    res.status(500).json({ error: 'Failed to delete achievement.' });
  }
});

// ==========================================
// 7. SKILLS ROUTES
// ==========================================

router.get('/skills', async (req, res) => {
  try {
    const db = await getDatabaseConnection();
    const records = await db.all('SELECT * FROM skills WHERE user_id = ?', [req.user.id]);
    res.json(records);
  } catch (error) {
    console.error('Fetch skills error:', error);
    res.status(500).json({ error: 'Failed to fetch skills.' });
  }
});

router.post('/skills', async (req, res) => {
  const { skill_name, category, rating } = req.body;
  if (!skill_name || !category || rating === undefined) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const db = await getDatabaseConnection();
    const result = await db.run(
      `INSERT INTO skills (user_id, skill_name, category, rating)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, skill_name, category, rating]
    );
    res.status(201).json({ id: result.lastID, user_id: req.user.id, skill_name, category, rating });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({ error: 'Failed to add skill.' });
  }
});

router.put('/skills/:id', async (req, res) => {
  const { skill_name, category, rating } = req.body;
  try {
    const db = await getDatabaseConnection();
    const record = await db.get('SELECT id FROM skills WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!record) return res.status(404).json({ error: 'Skill not found or unauthorized' });

    await db.run(
      `UPDATE skills 
       SET skill_name = ?, category = ?, rating = ?
       WHERE id = ? AND user_id = ?`,
      [skill_name, category, rating, req.params.id, req.user.id]
    );
    res.json({ id: parseInt(req.params.id), skill_name, category, rating });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ error: 'Failed to update skill.' });
  }
});

router.delete('/skills/:id', async (req, res) => {
  try {
    const db = await getDatabaseConnection();
    const record = await db.get('SELECT id FROM skills WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!record) return res.status(404).json({ error: 'Skill not found or unauthorized' });

    await db.run('DELETE FROM skills WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Skill deleted successfully', id: parseInt(req.params.id) });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ error: 'Failed to delete skill.' });
  }
});

// ==========================================
// 8. SPORTS CERTIFICATES ROUTES
// ==========================================

router.get('/sports', async (req, res) => {
  try {
    const db = await getDatabaseConnection();
    const records = await db.all('SELECT * FROM sports_certificates WHERE user_id = ? ORDER BY date DESC', [req.user.id]);
    res.json(records);
  } catch (error) {
    console.error('Fetch sports records error:', error);
    res.status(500).json({ error: 'Failed to fetch sports records.' });
  }
});

router.post('/sports', async (req, res) => {
  const { sport_name, level, position_rank, date, certificate_path } = req.body;
  if (!sport_name || !level || !position_rank || !date) {
    return res.status(400).json({ error: 'Required fields: sport_name, level, position_rank, date' });
  }
  try {
    const db = await getDatabaseConnection();
    const result = await db.run(
      `INSERT INTO sports_certificates (user_id, sport_name, level, position_rank, date, certificate_path)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, sport_name, level, position_rank, date, certificate_path || '']
    );
    res.status(201).json({ id: result.lastID, user_id: req.user.id, sport_name, level, position_rank, date, certificate_path });
  } catch (error) {
    console.error('Add sports record error:', error);
    res.status(500).json({ error: 'Failed to add sports record.' });
  }
});

// Certificate upload endpoint
router.post('/sports/upload-certificate', upload.single('certificate'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  const certUrl = `/uploads/${req.file.filename}`;
  res.json({ certUrl });
});

router.put('/sports/:id', async (req, res) => {
  const { sport_name, level, position_rank, date, certificate_path } = req.body;
  try {
    const db = await getDatabaseConnection();
    const record = await db.get('SELECT id FROM sports_certificates WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!record) return res.status(404).json({ error: 'Sports record not found or unauthorized' });

    await db.run(
      `UPDATE sports_certificates 
       SET sport_name = ?, level = ?, position_rank = ?, date = ?, certificate_path = ?
       WHERE id = ? AND user_id = ?`,
      [sport_name, level, position_rank, date, certificate_path, req.params.id, req.user.id]
    );
    res.json({ id: parseInt(req.params.id), sport_name, level, position_rank, date, certificate_path });
  } catch (error) {
    console.error('Update sports record error:', error);
    res.status(500).json({ error: 'Failed to update sports record.' });
  }
});

router.delete('/sports/:id', async (req, res) => {
  try {
    const db = await getDatabaseConnection();
    const record = await db.get('SELECT id FROM sports_certificates WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!record) return res.status(404).json({ error: 'Sports record not found or unauthorized' });

    await db.run('DELETE FROM sports_certificates WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Sports record deleted successfully', id: parseInt(req.params.id) });
  } catch (error) {
    console.error('Delete sports record error:', error);
    res.status(500).json({ error: 'Failed to delete sports record.' });
  }
});

// ==========================================
// 9. RECENT ACTIVITY OVERVIEW ENDPOINT
// ==========================================
router.get('/recent-activity', async (req, res) => {
  try {
    const db = await getDatabaseConnection();
    const activities = [];

    // Projects
    const p = await db.all('SELECT "project" as type, title, id, "Added project" as action FROM projects WHERE user_id = ? ORDER BY id DESC LIMIT 2', [req.user.id]);
    activities.push(...p);

    // Achievements
    const a = await db.all('SELECT "achievement" as type, title, date, id, "Earned achievement" as action FROM achievements WHERE user_id = ? ORDER BY date DESC LIMIT 2', [req.user.id]);
    activities.push(...a);

    // Events
    const e = await db.all('SELECT "event" as type, event_name as title, date, id, "Participated in event" as action FROM events WHERE user_id = ? ORDER BY date DESC LIMIT 2', [req.user.id]);
    activities.push(...e);

    // Sort by id / date
    activities.sort((x, y) => (y.date || y.id) > (x.date || x.id) ? 1 : -1);

    res.json(activities.slice(0, 5));
  } catch (error) {
    console.error('Fetch recent activity error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity.' });
  }
});

module.exports = router;
