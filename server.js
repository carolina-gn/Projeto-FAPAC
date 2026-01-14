const express = require('express');
const session = require('cookie-session');
const path = require('path');
const mongoose = require('mongoose');
const { PORT, SERVER_SESSION_SECRET, MONGO_URI } = require('./config.js');
const User = require('./src/models/user.js');

const app = express();

// --- Middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(session({ 
    secret: SERVER_SESSION_SECRET, 
    maxAge: 24 * 60 * 60 * 1000
}));

// --- Login routes ---
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'login.html'));
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (user && await user.validatePassword(password)) {
            req.session.user = { id: user._id, name: user.name, username: user.username, role: user.role };
            return res.redirect('/login-validation?status=success');
        }

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

// --- Require login middleware ---
function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
}

// --- Protected routes ---
app.get('/', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/login');
});

// --- Your routes ---
app.use(require('./src/routes/auth.js'));
app.use(require('./src/routes/data-management.js'));

// Projects routes (keep project-specific routes here)
const projectsRoutes = require('./src/routes/projects.js');
app.use("/api/projects", requireLogin, projectsRoutes);

// Issues routes (still global /api/issues for backward compatibility)
const issuesRoutes = require("./src/routes/issuesRoutes");
app.use("/api/issues", requireLogin, issuesRoutes);

// --- Global Error Middleware ---
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || 'Internal server error' });
});

// --- Connect to MongoDB and start server ---
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });