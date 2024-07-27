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
    cookie: {
        maxAge: 10 * 60 * 1000
    }
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

////////////////////////////////////////////////////////////
//                  Home/Index                            //
///////////////////////////////////////////////////////////



app.get('/', (req, res) => {
    res.render('index', { errorsLocation: undefined });
});



////////////////////////////////////////////////////////////
//           Authentication/Registration/Logut           //
///////////////////////////////////////////////////////////




app.post('/login', [
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Password must be at least 8 characters long').isLength({ min: 8 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.render('index', { errors: errors.array(), errorsLocation: 'login' });
    }

    const { email, password } = req.body;

    try {
        if (email.endsWith('@cleanmasterz.com')) {
            // Admin login (without password hashing)
            const sql = 'SELECT * FROM Admins WHERE email = ? AND password = ?';
            db.query(sql, [email, password], (err, results) => {
                if (err) {
                    console.error('Error querying database:', err);
                    return res.status(500).send('Error querying database');
                }

                if (results.length === 1) {
                    req.session.adminId = results[0].admin_id;
                    req.session.adminUsername = results[0].username;
                    console.log('Admin login successful:', results[0].username);
                    req.session.save((err) => {
                        if (err) {
                            console.error('Session save error:', err);
                            return res.status(500).send('Error saving session');
                        }
                        res.redirect('/admin');
                    });
                } else {
                    console.log('Invalid email or password for admin');
                    res.render('index', { errors: [{ msg: 'Invalid email or password' }], errorsLocation: 'login' });
                }
            });
        } else if (email.endsWith('@cmp.com')) {
            // Professional login (with password hashing)
            const hashedPassword = hashPassword(password); // Hash entered password
            const sql = 'SELECT * FROM Professionals WHERE email = ? AND password = ?';
            db.query(sql, [email, hashedPassword], (err, results) => {
                if (err) {
                    console.error('Error querying database:', err);
                    return res.status(500).send('Error querying database');
                }

                if (results.length === 1) {
                    req.session.professionalId = results[0].professional_id;
                    req.session.professionalName = results[0].name;
                    console.log('Professional login successful:', results[0].name);
                    req.session.save((err) => {
                        if (err) {
                            console.error('Session save error:', err);
                            return res.status(500).send('Error saving session');
                        }
                        res.redirect('/professionaldashboard');
                    });
                } else {
                    console.log('Invalid email or password for professional');
                    res.render('index', { errors: [{ msg: 'Invalid email or password' }], errorsLocation: 'login' });
                }
            });
        } else {
            // User login (with password hashing)
            const hashedPassword = hashPassword(password); // Hash entered password
            const sql = 'SELECT * FROM Users WHERE email = ? AND password = ?';
            db.query(sql, [email, hashedPassword], (err, results) => {
                if (err) {
                    console.error('Error querying database:', err);
                    return res.status(500).send('Error querying database');
                }

                if (results.length === 1) {
                    req.session.userId = results[0].user_id;
                    req.session.userName = results[0].name;
                    console.log('User login successful:', results[0].name);
                    req.session.save((err) => {
                        if (err) {
                            console.error('Session save error:', err);
                            return res.status(500).send('Error saving session');
                        }
                        res.redirect('/userdashboard');
                    });
                } else {
                    console.log('Invalid email or password for user');
                    res.render('index', { errors: [{ msg: 'Invalid email or password' }], errorsLocation: 'login' });
                }
            });
        }
    } catch (error) {
        console.error('Error processing login:', error);
        res.status(500).send('Error processing request');
    }
});

function fsubmit() {
    var password = document.getElementById("password").value;
    var confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return false;
    }
    return true;
}

app.post('/saveuserdata', [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Please enter a valid email address').isEmail(),
    check('password', 'Password must be at least 8 characters long').isLength({ min: 8 }),
    check('confirmPassword', 'Passwords do not match').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.render('index', { errors: errors.array(), errorsLocation: 'signup' });
    }

    const { name, email, password } = req.body;
    console.log('Received form data:', { name, email, password });

    try {
        // Check if email already exists
        const emailCheckSql = 'SELECT * FROM Users WHERE email = ?';
        db.query(emailCheckSql, [email], (err, results) => {
            if (err) {
                console.error('Error checking email existence:', err);
                return res.status(500).send('Error checking email existence');
            }

            if (results.length > 0) {
                console.log('Email already exists');
                return res.render('index', { errors: [{ msg: 'Email already exists' }], errorsLocation: 'signup' });
            }

            // Proceed with user registration
            const hashedPassword = hashPassword(password);
            const sql = 'INSERT INTO Users (name, email, password) VALUES (?, ?, ?)';
            db.query(sql, [name, email, hashedPassword], (err, result) => {
                if (err) {
                    console.error('Error inserting user:', err);
                    return res.status(500).send('Error inserting user');
                }
                console.log('User registered successfully!');
                res.redirect('/');
            });
        });
    } catch (error) {
        console.error('Error processing registration:', error);
        res.status(500).send('Error processing request');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/userdashboard');
        }
        res.redirect('/');
    });
});


////////////////////////////////////////////////////////////
//                     User                              //
///////////////////////////////////////////////////////////


// Update the existing route for user dashboard
app.get('/userdashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }

    // Fetch services available for scheduling
    const servicesSql = 'SELECT * FROM Services WHERE service_status = "active"';
    db.query(servicesSql, (err, services) => {
        if (err) {
            console.error('Error querying services:', err);
            return res.status(500).send('Error fetching services');
        }
        // Fetch all scheduled services for the user
        const scheduledSql = `
        SELECT s.schedule_id, se.service_name, s.scheduled_date, s.status, s.otp
        FROM Schedules s
        JOIN Services se ON s.service_id = se.service_id
        WHERE s.user_id = ?
        ORDER BY s.scheduled_date ASC
        `;
        db.query(scheduledSql, [req.session.userId], (err, scheduledServices) => {
            if (err) {
                console.error('Error querying scheduled services:', err);
                return res.status(500).send('Error fetching scheduled services');
            }

            // Render userdashboard.ejs with fetched services and scheduledServices
            res.render('userdashboard', {
                userName: req.session.userName,
                services,
                scheduledServices
            });
        });
    });
});




app.get('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }

    // Fetch user data from database based on req.session.userId
    const userSql = 'SELECT * FROM users WHERE user_id = ?';
    db.query(userSql, [req.session.userId], (err, userResults) => {
        if (err) {
            console.error('Error fetching user data:', err);
            return res.status(500).send('Error fetching user data');
        }
        if (userResults.length !== 1) {
            return res.status(404).send('User not found');
        }
        const user = userResults[0];

        // Fetch address from Address table based on user_id
        const addressSql = 'SELECT * FROM Address WHERE user_id = ?';
        db.query(addressSql, [req.session.userId], (err, addressResults) => {
            if (err) {
                console.error('Error fetching address:', err);
                return res.status(500).send('Error fetching address');
            }

            let address = null;
            if (addressResults.length === 1) {
                address = addressResults[0];
            }

            res.render('userprofile', {
                userName: req.session.userName,
                user,
                address 
            });
        });
    });
});

app.post('/schedules', (req, res) => {

    if (!req.session.userId) {
        return res.redirect('/');
    }
        const { service_id, scheduled_date, price } = req.body;

    
    const sql = 'INSERT INTO Schedules (user_id, service_id, scheduled_date, status, created_at) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [req.session.userId, service_id, scheduled_date, 'Pending', new Date()], (err, result) => {
        if (err) {
            console.error('Error scheduling service:', err);
            return res.status(500).send('Error scheduling service');
        }
        console.log('Service scheduled successfully!');

        res.redirect('/userdashboard');
    });
});

// Reschedule a service
app.post('/reschedule/:id', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }
    
    const scheduleId = req.params.id;
    const { new_date } = req.body;

    const sql = 'UPDATE Schedules SET scheduled_date = ? WHERE schedule_id = ? AND user_id = ?';
    db.query(sql, [new_date, scheduleId, req.session.userId], (err, result) => {
        if (err) {
            console.error('Error rescheduling service:', err);
            return res.status(500).send('Error rescheduling service');
        }
        console.log('Service rescheduled successfully!');
        res.redirect('/userdashboard');
    });
});



// Cancel a service
app.post('/cancel/:id', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }

    const scheduleId = req.params.id;

    const sql = 'UPDATE Schedules SET status = "Cancelled" WHERE schedule_id = ? AND user_id = ?';
    db.query(sql, [scheduleId, req.session.userId], (err, result) => {
        if (err) {
            console.error('Error canceling service:', err);
            return res.status(500).send('Error canceling service');
        }
        console.log('Service canceled successfully!');
        res.redirect('/userdashboard');
    });
});


// Add address route
app.post('/addaddress', [
    check('street_address', 'Street Address is required').notEmpty(),
    check('city', 'City is required').notEmpty(),
    check('state', 'State is required').notEmpty(),
    check('zip_code', 'Zip Code is required').notEmpty(),
    check('country', 'Country is required').notEmpty()
], (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).send('Invalid data');
    }

    const { street_address, city, state, zip_code, country } = req.body;
    const userId = req.session.userId;

    console.log('Received data:', { userId, street_address, city, state, zip_code, country });

    const sql = 'INSERT INTO Address (user_id, street_address, city, state, zip_code, country) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [userId, street_address, city, state, zip_code, country], (err, result) => {
        if (err) {
            console.error('Error adding address:', err);
            return res.status(500).send('Error adding address');
        }
        console.log('Address added successfully, Result:', result);
        res.redirect('/profile');
    });
});



// Route to handle updating user address
app.post('/updateaddress/:id', [
    check('street_address', 'Street Address is required').notEmpty(),
    check('city', 'City is required').notEmpty(),
    check('state', 'State is required').notEmpty(),
    check('zip_code', 'Zip Code is required').notEmpty(),
    check('country', 'Country is required').notEmpty()
], (req, res) => {
    
    if (!req.session.userId) {
        return res.redirect('/');
    }

    // Validate form data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).send('Invalid data');
    }

    // Extract data from request body
    const { street_address, city, state, zip_code, country } = req.body;
    const userId = req.session.userId;
    const addressId = req.params.id;

    // Update the address in the database
    const sql = `
        UPDATE Address 
        SET street_address = ?, city = ?, state = ?, zip_code = ?, country = ?
        WHERE address_id = ? AND user_id = ?
    `;
    db.query(sql, [street_address, city, state, zip_code, country, addressId, userId], (err, result) => {
        if (err) {
            console.error('Error updating address:', err);
            return res.status(500).send('Error updating address');
        }
        console.log('Address updated successfully!');
        res.redirect('/profile'); 
    });
});



////////////////////////////////////////////////////////////
//                     Admin                              //
///////////////////////////////////////////////////////////


app.get('/admin', (req, res) => 
    {
    if (!req.session.adminId) {
        return res.redirect('/');
    }
    res.render('admindashboard');
});

app.get('/manageservices', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/');
    }

    // Query active services from the database
    const sql = 'SELECT * FROM Services WHERE service_status = "active"';
    db.query(sql, (err, services) => {
        if (err) {
            console.error('Error querying services:', err);
            return res.status(500).send('Error fetching services');
        }

        res.render('manageservices', { services });
    });
});


// Route to handle adding a new service
app.post('/addservice', [
    check('service_name', 'Service Name is required').notEmpty(),
    check('description', 'Description is required').notEmpty(),
    check('category', 'Category is required').notEmpty(),
    check('price', 'Price must be a valid number').isFloat({ min: 0 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).send('Invalid data');
    }

    const { service_name, description, category, price } = req.body;

    // Insert new service into database
    const sql = 'INSERT INTO Services (service_name, description, category, price) VALUES (?, ?, ?, ?)';
    db.query(sql, [service_name, description, category, price], (err, result) => {
        if (err) {
            console.error('Error adding service:', err);
            return res.status(500).send('Error adding service');
        }
        console.log('Service added successfully!');
        res.redirect('/manageservices'); 
    });
});


// Add your update service route here
app.post('/updateservice', (req, res) => {
    const { service_id, service_name, description, category, price } = req.body;
    const sql = 'UPDATE services SET service_name = ?, description = ?, category = ?, price = ? WHERE service_id = ?';
    db.query(sql, [service_name, description, category, price, service_id], (err, result) => {
        if (err) {
            console.error('Error updating service:', err);
            return res.status(500).send('Error updating service');
        }
        res.redirect('/manageservices');
    });
});


app.post('/inactivateservice/:id', (req, res) => {
    const serviceId = req.params.id;

    // Update service status to inactive
    const sql = 'UPDATE Services SET service_status = "inactive" WHERE service_id = ?';
    db.query(sql, [serviceId], (err, result) => {
        if (err) {
            console.error('Error updating service status:', err);
            return res.status(500).send('Error updating service status');
        }
        console.log('Service status updated to inactive successfully!');
        res.redirect('/manageservices'); // Redirect back to manage services page
    });
});



app.get('/manageprofessionals', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/');
    }

    // Query all professionals from the database
    const sql = 'SELECT * FROM Professionals';
    db.query(sql, (err, professionals) => {
        if (err) {
            console.error('Error querying professionals:', err);
            return res.status(500).send('Error fetching professionals');
        }

        res.render('manageprofessionals', { professionals });
    });
});


app.post('/addprofessional', [
    check('name', 'Name is required').notEmpty(),
    check('profession', 'Profession is required').notEmpty(),
    check('email', 'Email is required').isEmail(),
    check('password', 'Password is required').isLength({ min: 8 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).send('Invalid data');
    }

    const { name, profession, email, password } = req.body;
    const hashedPassword = hashPassword(password);

    // Insert new professional into the database
    const sql = 'INSERT INTO Professionals (name, profession, email, password) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, profession, email, hashedPassword], (err, result) => {
        if (err) {
            console.error('Error adding professional:', err);
            return res.status(500).send('Error adding professional');
        }
        console.log('Professional added successfully!');
        res.redirect('/manageprofessionals'); 
    });
});


app.post('/updateprofessional', (req, res) => {
    const { professional_id, name, profession, email, password } = req.body;
    const hashedPassword = password ? hashPassword(password) : null;

    const sql = hashedPassword
        ? 'UPDATE Professionals SET name = ?, profession = ?, email = ?, password = ? WHERE professional_id = ?'
        : 'UPDATE Professionals SET name = ?, profession = ?, email = ? WHERE professional_id = ?';
    const params = hashedPassword
        ? [name, profession, email, hashedPassword, professional_id]
        : [name, profession, email, professional_id];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Error updating professional:', err);
            return res.status(500).send('Error updating professional');
        }
        res.redirect('/manageprofessionals');
    });
});


app.post('/deleteprofessional/:id', (req, res) => {
    const professionalId = req.params.id;

    const sql = 'DELETE FROM Professionals WHERE professional_id = ?';
    db.query(sql, [professionalId], (err, result) => {
        if (err) {
            console.error('Error deleting professional:', err);
            return res.status(500).send('Error deleting professional');
        }
        console.log('Professional deleted successfully!');
        res.redirect('/manageprofessionals'); 
    });
});


// Route to manage pending service requests
app.get('/managerequest', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/');
    }

    // Query to fetch pending service requests
    const sql = `
        SELECT s.schedule_id, u.name AS user_name, se.service_name, s.scheduled_date, s.status
        FROM Schedules s
        JOIN Users u ON s.user_id = u.user_id
        JOIN Services se ON s.service_id = se.service_id
        WHERE s.status = 'Pending'
    `;
    db.query(sql, (err, requests) => {
        if (err) {
            console.error('Error fetching pending requests:', err);
            return res.status(500).send('Error fetching pending requests');
        }

        res.render('managerequest', { requests });
    });
});



// Endpoint to approve a request
app.post('/admin/approve/:scheduleId', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/');
    }
    const { scheduleId } = req.params;

    getRandomProfessionalId()
        .then(randomProfessionalId => {
            const sql = `
                UPDATE Schedules 
                SET status = 'Approved', professional_id = ?
                WHERE schedule_id = ? AND status = 'Pending'
            `;
            db.query(sql, [randomProfessionalId, scheduleId], (err, result) => {
                if (err) {
                    console.error('Error approving request:', err);
                    return res.status(500).send('Error approving request');
                }
                console.log(`Request ${scheduleId} approved successfully`);
                res.redirect('/managerequest'); 
            });
        })
        .catch(err => {
            console.error('Error fetching random professional ID:', err); 
            res.status(500).send('Error approving request');
        });
});


function getRandomProfessionalId() {
    const sql = `
        SELECT professional_id FROM Professionals
        ORDER BY RAND() LIMIT 1
    `;
    return new Promise((resolve, reject) => {
        db.query(sql, (err, results) => {
            if (err) {
                reject(err);
            } else {
                if (results.length > 0) {
                    resolve(results[0].professional_id);
                } else {
                    reject(new Error('No professionals found'));
                }
            }
        });
    });
}


// Endpoint to reject a request
app.post('/admin/reject/:scheduleId', (req, res) => {
    if (!req.session.adminId) {
        return res.redirect('/');
    }
    const { scheduleId } = req.params;

    const sql = `
        UPDATE Schedules 
        SET status = 'Rejected', professional_id = NULL
        WHERE schedule_id = ? AND status = 'Pending'
    `;
    db.query(sql, [scheduleId], (err, result) => {
        if (err) {
            console.error('Error rejecting request:', err); 
            return res.status(500).send('Error rejecting request');
        }
        console.log(`Request ${scheduleId} rejected successfully`);
        res.redirect('/managerequest'); 
    });
});


////////////////////////////////////////////////////////////
//                     Professional                       //
///////////////////////////////////////////////////////////


app.get('/professionaldashboard', (req, res) => {
    if (!req.session.professionalId) {
        return res.redirect('/');
    }

    const sql = `
    SELECT s.schedule_id, u.name AS user_name, se.service_name, s.scheduled_date, s.status
    FROM Schedules s
    JOIN Users u ON s.user_id = u.user_id
    JOIN Services se ON s.service_id = se.service_id
    WHERE s.professional_id = ? AND s.status = 'Approved'
    ORDER BY s.scheduled_date ASC
`;

    db.query(sql, [req.session.professionalId], (err, scheduledServices) => {
        if (err) {
            console.error('Error querying scheduled services:', err);
            return res.status(500).send('Error fetching scheduled services');
        }

        console.log('Scheduled services:', scheduledServices);

        res.render('professionaldashboard', {
            professionalName: req.session.professionalName,
            scheduledServices
        });
    });
});


function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000); // Generate a random number between 1000 and 9999
}

// Route for generating OTP and storing it in the database
app.post('/generate-otp/:scheduleId', (req, res) => {
    const scheduleId = req.params.scheduleId;

    
    const generatedOTP = Math.floor(1000 + Math.random() * 9000);

    // Update OTP in the database
    const sql = 'UPDATE Schedules SET otp = ? WHERE schedule_id = ?';
    db.query(sql, [generatedOTP, scheduleId], (err, result) => {
        if (err) {
            console.error('Error updating OTP in database:', err);
            return res.status(500).json({ error: 'Failed to generate and store OTP' });
        }

        console.log('OTP generated and stored in database');
        res.status(200).json({ otp: generatedOTP });
    });
});


// POST route to verify OTP and update status to 'completed'
app.post('/verify-otp/:scheduleId', (req, res) => {
    const { scheduleId } = req.params;
    const { otp } = req.body;

    console.log(`Verifying OTP ${otp} for schedule ID ${scheduleId}`);

    // Query to verify OTP and update status
    const updateQuery = `
        UPDATE Schedules
        SET status = 'completed'
        WHERE schedule_id = ? AND otp = ?
    `;

    // Execute the update query
    db.query(updateQuery, [scheduleId, otp], (err, result) => {
        if (err) {
            console.error('Error updating status:', err);
            return res.status(500).json({ error: 'Failed to update status' });
        }

        if (result.changedRows === 0) {
            console.log('Invalid OTP or schedule ID');
            return res.status(400).json({ error: 'Invalid OTP or schedule ID' });
        }

        console.log('Status updated to completed');
        res.json({ message: 'OTP verified successfully and status updated to completed' });
    });
});


// Ensure your server is listening
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/`);
});