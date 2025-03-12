"use strict";
const express = require('express');
const next = require('next');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const chatRouter = require('app/api/chat.ts');
dotenv.config();
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;
app.prepare().then(() => {
    const server = express();
    // Middleware
    server.use(cors());
    server.use(bodyParser.json());
    // Health check endpoint
    server.get('/api/health', (_req, res) => {
        res.status(200).json({ status: 'ok' });
    });
    // API routes
    server.use('/api/chat', chatRouter);
    // Default handler for all other routes (Next.js pages)
    server.all('*', (req, res) => {
        return handle(req, res);
    });
    server.listen(PORT, (err) => {
        if (err)
            throw err;
        console.log(`> Ready on http://localhost:${PORT}`);
    });
}).catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
});
