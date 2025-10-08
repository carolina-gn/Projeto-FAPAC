// app.js
const express = require('express'); // Import the express package
const app = express(); // Initialize the Express application
// Define a simple route
app.get('/Health', (req, res) => {
 res.send('Hello from app.js!');
});
module.exports = app; // Export the app instance