const express = require('express');
const session = require('cookie-session');
const path = require('path');
const { PORT, SERVER_SESSION_SECRET } = require('./config.js');

let app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({ secret: SERVER_SESSION_SECRET, maxAge: 24 * 60 * 60 * 1000 }));
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'login.html'));
});
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const VALID_USER = "admin";
    const VALID_PASS = "admin";

    if (username === VALID_USER && password === VALID_PASS) {
        req.session.user = username;  // save user in session
        res.redirect('/login-validation?status=success');
    } else {
        res.redirect('/login-validation?status=fail');
    }
});

app.get('/login-validation', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'loginValidation.html'));
});
function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
}
app.use(require('./src/routes/auth.js'));
app.use(require('./src/routes/data-management.js'));

app.get('/', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/login');
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));
