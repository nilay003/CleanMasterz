const express = require('express');
const { check, validationResult } = require('express-validator');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql'); 
const app = express();

// Express Body-parser
app.use(express.urlencoded({ extended: true }));

// Set path to public and views folder
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + '/public'));
app.use('/public/images/', express.static('./public/images'));
app.set('view engine', 'ejs');

// Configure express-session middleware
app.use(session({
    secret: 'your_secret_key_here', // Replace with a random secret key for session management
    resave: false,
    saveUninitialized: false
}));
// MySQL Connection Configuration
const db = mysql.createConnection({
    host: 'localhost', // MySQL server host
    user: 'root', // MySQL username
    password: '', // MySQL password
    database: 'cleanmasterz' // MySQL database name
});

// Connect to MySQL
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
app.get('/', function (req, res) {
    res.render('index');
});

app.get('/userdashboard', function (req, res) {
    res.render('userdashboard');
});


// Handle login form submission
app.post('/login', [
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Password must be at least 8 characters').isLength({ min: 8 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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
                // User found, set session
                req.session.userId = results[0].id;
                req.session.userName = results[0].name;
                res.redirect('/userdashboard'); // Redirect to dashboard upon successful login
            } else {
                // User not found or password incorrect
                res.render('index', { errors: [{ msg: 'Invalid email or password' }] });
            }
        });
    } catch (error) {
        console.error('Error processing login:', error);
        res.status(500).send('Error processing request');
    }
});

// Handle form submission to save user data
app.post('/saveuserdata', [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Please enter valid email address').isEmail(),
    check('password', 'Password must be at least 8 characters').isLength({ min: 8 })
], function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Display Error Messages on the signup form
        return res.render('index', { errors: errors.array(), errorsLocation: 'signup' });
    }

    const { name, email, password } = req.body;
    console.log('Received form data:', { name, email, password });

    try {
        const hashedPassword = hashPassword(password); // Hash password using SHA-256
    
        // Insert user data into MySQL
        const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        db.query(sql, [name, email, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).send('Error inserting user');
            }
            console.log('User registered successfully!');
            res.redirect('/'); // Redirect to home page or success page
        });
    } catch (error) {
        console.error('Error processing registration:', error);
        res.status(500).send('Error processing request');
    }
});



// Execute Website Using Port Number for Localhost
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Website Executed Successfully....Open Using http://localhost:${PORT}/`);
});
