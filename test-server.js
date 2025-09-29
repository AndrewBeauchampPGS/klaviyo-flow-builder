const express = require('express');
const cors = require('cors');
const path = require('path');

const lambda = require('./amplify/functions/api/index');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/*', async (req, res) => {
    const event = {
        path: req.path.replace('/api', ''),
        httpMethod: 'POST',
        headers: req.headers,
        body: JSON.stringify(req.body)
    };

    try {
        const result = await lambda.handler(event);
        res.status(result.statusCode).set(result.headers).send(result.body);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');
    res.send();
});

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║     Klaviyo Flow Builder - Test Server      ║
╚══════════════════════════════════════════════╝

  🚀 Server running at: http://localhost:${PORT}
  📝 Open your browser to test the app

  Testing instructions:
  1. Open http://localhost:${PORT} in your browser
  2. Enter your Klaviyo API key
  3. Select a flow template to deploy
  4. Click to deploy to your account

  Note: This is for local testing only.
  Deploy with Amplify for production use.
    `);
});