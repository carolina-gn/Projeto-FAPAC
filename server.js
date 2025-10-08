const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
 res.send('Hello World!');
});

app.get('/Health', (req, res) => {
 res.send('DEU!');
});

app.listen(PORT, () => {
 console.log(`Server listening on port ${PORT}`);
});
