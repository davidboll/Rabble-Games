"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.GATEWAY_PORT ? parseInt(process.env.GATEWAY_PORT, 10) : 8080;
console.log(`[Gateway] Attempting to start on PORT: ${PORT}`);
// Enable CORS
app.use((0, cors_1.default)());
const GAME_PORTS = {
    'rabble-proviva': process.env.PROVIVA_PORT ? parseInt(process.env.PROVIVA_PORT, 10) : 3001,
    doritos: process.env.DORITOS_PORT ? parseInt(process.env.DORITOS_PORT, 10) : 3002
};
// Middleware för loggning
app.use((req, res, next) => {
    console.log(`[Gateway] Incoming request: ${req.method} ${req.url}`);
    next();
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[Gateway] Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});
app.post('/register-port', express_1.default.json(), (req, res) => {
    const { service, port } = req.body;
    console.log(`[Gateway] Received port registration request for ${service} on port ${port}`);
    if (service && port && GAME_PORTS[service]) {
        console.log(`[Gateway] Updating ${service} port from ${GAME_PORTS[service]} to ${port}`);
        GAME_PORTS[service] = port;
        // Uppdatera proxy för denna service
        setupProxy(service, port);
        res.status(200).json({ message: 'Port registered successfully' });
    }
    else {
        console.error(`[Gateway] Invalid port registration request:`, { service, port });
        res.status(400).json({ error: 'Invalid service or port' });
    }
});
// Function to setup proxy for a game
function setupProxy(game, port) {
    console.log(`[Gateway] Setting up proxy for /${game} to http://127.0.0.1:${port}`);
    const proxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: `http://127.0.0.1:${port}`,
        changeOrigin: true,
        ws: true,
        pathRewrite: {
            [`^/${game}`]: '' // Remove the game prefix completely
        },
        onError: (err, req, res) => {
            console.error(`[Gateway] Proxy error for /${game}:`, err);
            res.status(500).send(`Proxy error: ${err.message}`);
        },
        onProxyReq: (proxyReq, req) => {
            // Log the original URL and the URL after rewrite
            console.log(`[Gateway] Proxying ${req.method} ${req.url} to ${game} (port ${port})`);
            console.log(`[Gateway] Rewritten URL: ${proxyReq.path}`);
        },
        onProxyRes: (proxyRes, req) => {
            console.log(`[Gateway] Received response from ${game} for ${req.method} ${req.url}: ${proxyRes.statusCode}`);
        }
    });
    // Setup proxy for the game's main routes
    app.use(`/${game}`, proxy);
    // Setup proxy for Socket.IO
    app.use(`/socket.io`, proxy);
}
// Initial proxy setup for each game
Object.entries(GAME_PORTS).forEach(([game, port]) => {
    setupProxy(game, port);
});
// Landningssida
app.get('/', (_req, res) => {
    res.send(`
    <html>
      <head>
        <title>Rabble Games Gateway</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding-top: 50px; 
            background-color: #f0f2f5;
          }
          h1 { 
            color: #1a237e; 
            margin-bottom: 30px;
          }
          .games { 
            display: flex; 
            justify-content: center; 
            gap: 20px; 
            margin-top: 30px; 
          }
          .game-link { 
            text-decoration: none; 
            padding: 15px 30px; 
            background-color: #3f51b5; 
            color: white; 
            border-radius: 8px;
            transition: background-color 0.3s ease;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .game-link:hover {
            background-color: #283593;
          }
        </style>
      </head>
      <body>
        <h1>Rabble Games Gateway</h1>
        <div class="games">
          ${Object.keys(GAME_PORTS).map(game => `<a href="/${game}" class="game-link">${game.charAt(0).toUpperCase() + game.slice(1).replace('-', ' ')}</a>`).join('')}
        </div>
      </body>
    </html>
  `);
});
// Skapa HTTP-server
const server = (0, http_1.createServer)(app);
// Starta servern
server.listen(PORT, () => {
    console.log(`[Gateway] Server SUCCESSFULLY running on http://localhost:${PORT}`);
    Object.entries(GAME_PORTS).forEach(([game, port]) => {
        console.log(`[Gateway] ${game.toUpperCase().replace('-', ' ')} accessible at http://localhost:${PORT}/${game}`);
    });
});
//# sourceMappingURL=server.js.map