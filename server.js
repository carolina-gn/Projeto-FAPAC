const express = require('express');
const session = require('cookie-session');
const path = require('path');
const mongoose = require('mongoose');
const { PORT, SERVER_SESSION_SECRET, MONGO_URI } = require('./config.js');
const User = require('./src/models/user.js'); // import the User model

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

app.post('/login', async (req, res) => {
    const { username, password } = req.body; // now using username

    try {
        // Find user by username
        const user = await User.findOne({ username });
        if (user && await user.validatePassword(password)) {
            req.session.user = { id: user._id, name: user.name, username: user.username, role: user.role };
            return res.redirect('/login-validation?status=success');
        }

        // Optional: fallback admin
        if (username === "admin" && password === "admin") {
            req.session.user = { id: "admin", name: "Administrator", username: "admin", role: "owner" };
            return res.redirect('/login-validation?status=success');
        }

        res.redirect('/login-validation?status=fail');

    } catch (err) {
        console.error(err);
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
app.use(require('./src/routes/projects.js'));
app.use(express.json()); // IMPORTANTE: para ler JSON do fetch

const issuesRoutes = require("./src/routes/issuesRoutes");
app.use("/api/issues", issuesRoutes);

// --- Connect to MongoDB and start server ---
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, () => console.log(`DTGE server listening on port ${PORT}...`));
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });
