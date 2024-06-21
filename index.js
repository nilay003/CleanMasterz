const express = require('express');
const { check, validationResult } = require('express-validator');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + '/public'));
app.use('/public/images/', express.static('./public/images'));
app.set('view engine', 'ejs');

// Session configuration
app.use(session({
    secret: 'your_secret_key_here',
    resave: true,
    saveUninitialized: false,
    cookie: { secure: false } 
}));

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cleanmasterz'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        throw err;
    }
    console.log('MySQL Connected as id', db.threadId);
});

// Hash function using SHA-256
function hashPassword(password) {
    const hash = crypto.createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
}

// Routes
app.get('/', (req, res) => {
    res.render('index', { errorsLocation: undefined });
});

app.post('/login', [
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Invalid Email or Password').isLength({ min: 8 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.render('index', { errors: errors.array(), errorsLocation: 'login' });
    }

    const { email, password } = req.body;

    try {
        const hashedPassword = hashPassword(password);
        const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
        db.query(sql, [email, hashedPassword], (err, results) => {
            if (err) {
                console.error('Error querying database:', err);
                return res.status(500).send('Error querying database');
            }

            if (results.length === 1) {
                req.session.userId = results[0].user_id;
                req.session.userName = results[0].name;
                console.log('Login successful:', results[0].name);
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        return res.status(500).send('Error saving session');
                    }
                    res.redirect('/userdashboard');
                });
            } else {
                console.log('Invalid email or password');
                res.render('index', { errors: [{ msg: 'Invalid email or password' }], errorsLocation: 'login' });
            }
        });
    } catch (error) {
        console.error('Error processing login:', error);
        res.status(500).send('Error processing request');
    }
});

app.get('/userdashboard', (req, res) => {
    console.log('User dashboard accessed by:', req.session.userName);
    if (!req.session.userId) {
        return res.redirect('/');
    }
    res.render('userdashboard', { userName: req.session.userName });
});

app.post('/saveuserdata', [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Please enter valid email address').isEmail(),
    check('password', 'Password must be at least 8 characters').isLength({ min: 8 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.render('index', { errors: errors.array(), errorsLocation: 'signup' });
    }

    const { name, email, password } = req.body;
    console.log('Received form data:', { name, email, password });

    try {
        const hashedPassword = hashPassword(password);
        const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        db.query(sql, [name, email, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).send('Error inserting user');
            }
            console.log('User registered successfully!');
            res.redirect('/');
        });
    } catch (error) {
        console.error('Error processing registration:', error);
        res.status(500).send('Error processing request');
    }
});


// Route for displaying user profile
app.get('/profile', (req, res) => {
    if (!req.session.userName) {
        return res.redirect('/');
    }

    // Fetch user data from database based on req.session.userId or req.session.userName
    const sql = 'SELECT * FROM users WHERE user_id = ?'; // Adjust SQL query based on your database schema
    db.query(sql, [req.session.userId], (err, results) => {
        if (err) {
            console.error('Error fetching user data:', err);
            return res.status(500).send('Error fetching user data');
        }
        if (results.length !== 1) {
            return res.status(404).send('User not found');
        }
        const user = results[0];
        res.render('userprofile', { userName: req.session.userName, user });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log('Error destroying session:', err);
            return res.redirect('/userdashboard');
        }
        res.redirect('/');
    });
});

// Server listening
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Website Executed Successfully....Open Using http://localhost:${PORT}/`);
});
