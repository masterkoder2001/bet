
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Health check server running on port 3000');
});

module.exports = app;
