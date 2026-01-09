const express = require('express');
const session = require('cookie-session');
const path = require('path');
const mongoose = require('mongoose');
const { PORT, SERVER_SESSION_SECRET, MONGO_URI } = require('./config.js');

// Create Express app
const app = express();

// --- Middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(session({ 
    secret: SERVER_SESSION_SECRET, 
    maxAge: 24 * 60 * 60 * 1000 // 1 day
}));

// --- Login Routes ---
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'login.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const VALID_USER = "admin";
    const VALID_PASS = "admin";

    if (username === VALID_USER && password === VALID_PASS) {
        req.session.user = username;
        res.redirect('/login-validation?status=success');
    } else {
        res.redirect('/login-validation?status=fail');
    }
});

app.get('/login-validation', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'loginValidation.html'));
});

// --- Require Login Middleware ---
function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
}

// --- Protected Route Example ---
app.get('/', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/login');
});

// --- Your Routes ---
app.use(require('./src/routes/auth.js'));
app.use(require('./src/routes/data-management.js'));

// --- Connect to MongoDB and start server ---
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`DTGE server listening on port ${PORT}...`));
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Stop server if DB connection fails
});