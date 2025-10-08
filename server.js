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

app.get('/echo', async (req, res, next) => {
    const {category, color } = req.query;

    if (!category && !color) {
        return res.status(400).json({
        ok: false,
        error: 'missing required query parameter: category, color'
        });
    }

    res.json({ ok: true, category: category, color: color });
});

app.get('/error-route', (req, res) => {
    throw new Error('something went wrong!');
});

app.use((err, req, res, next) => {
    res.status(400).json({
    ok: false,
    error: err.message || 'internal server error',
    });
});




    


