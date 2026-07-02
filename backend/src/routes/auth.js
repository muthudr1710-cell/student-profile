const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDatabaseConnection } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

// Register a new student
router.post('/register', async (req, res) => {
  const { username, password, name, roll_number, department, current_semester, contact_info } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const db = await getDatabaseConnection();

    // Check if user already exists
    const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await db.run(
      `INSERT INTO users (username, password, name, roll_number, department, current_semester, contact_info, photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        hashedPassword,
        name || '',
        roll_number || '',
        department || '',
        current_semester || 1,
        contact_info || '',
        ''
      ]
    );

    const userId = result.lastID;
    const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: userId,
        username,
        name: name || '',
        roll_number: roll_number || '',
        department: department || '',
        current_semester: current_semester || 1,
        contact_info: contact_info || '',
        photo_url: ''
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login student
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const db = await getDatabaseConnection();
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        roll_number: user.roll_number,
        department: user.department,
        current_semester: user.current_semester,
        contact_info: user.contact_info,
        photo_url: user.photo_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Get current user details
router.get('/me', async (req, res) => {
  try {
    const db = await getDatabaseConnection();
    const user = await db.get(
      'SELECT id, username, name, roll_number, department, current_semester, contact_info, photo_url FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error fetching user.' });
  }
});

module.exports = router;
