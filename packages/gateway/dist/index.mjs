// src/server.ts
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";
import http from "http";
dotenv.config();
var app = express();
var PORT = process.env.GATEWAY_PORT ? parseInt(process.env.GATEWAY_PORT, 10) : 8080;
console.log(`[Gateway] Attempting to start on PORT: ${PORT}`);
var GAME_PORTS = {
  proviva: process.env.PROVIVA_PORT ? parseInt(process.env.PROVIVA_PORT, 10) : 3001,
  doritos: process.env.DORITOS_PORT ? parseInt(process.env.DORITOS_PORT, 10) : 3002
};
console.log("[Gateway] Game Ports:", GAME_PORTS);
app.use((req, res, next) => {
  console.log(`[Gateway] Incoming request: ${req.method} ${req.url}`);
  next();
});
Object.entries(GAME_PORTS).forEach(([game, port]) => {
  console.log(`[Gateway] Setting up proxy for /${game} to localhost:${port}`);
  app.use(`/${game}`, createProxyMiddleware({
    target: `http://localhost:${port}`,
    changeOrigin: true,
    pathRewrite: {
      [`^/${game}`]: "/"
      // Ta bort /proviva prefix
    },
    onError: (err, req, res) => {
      console.error(`[Gateway] Proxy error for /${game}:`, err);
      res.status(500).send("Proxy error");
    }
  }));
});
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Rabble Games Gateway</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding-top: 50px; }
          h1 { color: #333; }
          .games { display: flex; justify-content: center; gap: 20px; margin-top: 30px; }
          .game-link { 
            text-decoration: none; 
            padding: 10px 20px; 
            background-color: #4CAF50; 
            color: white; 
            border-radius: 5px; 
          }
        </style>
      </head>
      <body>
        <h1>Rabble Games Gateway</h1>
        <div class="games">
          ${Object.keys(GAME_PORTS).map(
    (game) => `<a href="/${game}" class="game-link">${game.charAt(0).toUpperCase() + game.slice(1)}</a>`
  ).join("")}
        </div>
      </body>
    </html>
  `);
});
var server = http.createServer(app);
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[Gateway] Server SUCCESSFULLY running on http://localhost:${PORT}`);
  Object.entries(GAME_PORTS).forEach(([game, port]) => {
    console.log(`[Gateway] ${game.toUpperCase()} accessible at http://localhost:${PORT}/${game}`);
  });
});
//# sourceMappingURL=index.mjs.map