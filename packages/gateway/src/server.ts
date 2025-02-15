import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.GATEWAY_PORT ? parseInt(process.env.GATEWAY_PORT, 10) : 8080;

console.log(`[Gateway] Attempting to start on PORT: ${PORT}`);

// Enable CORS
app.use(cors());

// Definiera portar för olika spel
interface GamePorts {
  [key: string]: number;
}

const GAME_PORTS: GamePorts = {
  'rabble-proviva': process.env.PROVIVA_PORT ? parseInt(process.env.PROVIVA_PORT, 10) : 3001,
  doritos: process.env.DORITOS_PORT ? parseInt(process.env.DORITOS_PORT, 10) : 3002
};

// Middleware för loggning
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[Gateway] Incoming request: ${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Gateway] Error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Endpoint för att registrera portar dynamiskt
interface PortRegistration {
  service: string;
  port: number;
}

app.post('/register-port', express.json(), (req: Request<{}, {}, PortRegistration>, res: Response) => {
  const { service, port } = req.body;
  console.log(`[Gateway] Received port registration request for ${service} on port ${port}`);
  
  if (service && port && GAME_PORTS[service]) {
    console.log(`[Gateway] Updating ${service} port from ${GAME_PORTS[service]} to ${port}`);
    GAME_PORTS[service] = port;
    
    // Uppdatera proxy för denna service
    setupProxy(service, port);
    
    res.status(200).json({ message: 'Port registered successfully' });
  } else {
    console.error(`[Gateway] Invalid port registration request:`, { service, port });
    res.status(400).json({ error: 'Invalid service or port' });
  }
});

// Function to setup proxy for a game
function setupProxy(game: string, port: number): void {
  console.log(`[Gateway] Setting up proxy for /${game} to http://127.0.0.1:${port}`);
  
  const proxy = createProxyMiddleware({
    target: `http://127.0.0.1:${port}`,
    changeOrigin: true,
    ws: true,
    pathRewrite: {
      [`^/${game}`]: ''  // Remove the game prefix completely
    },
    onError: (err: Error, req: Request, res: Response) => {
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
app.get('/', (_req: Request, res: Response) => {
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
          ${Object.keys(GAME_PORTS).map(game => 
            `<a href="/${game}" class="game-link">${game.charAt(0).toUpperCase() + game.slice(1).replace('-', ' ')}</a>`
          ).join('')}
        </div>
      </body>
    </html>
  `);
});

// Skapa HTTP-server
const server = createServer(app);

// Starta servern
server.listen(PORT, () => {
  console.log(`[Gateway] Server SUCCESSFULLY running on http://localhost:${PORT}`);
  Object.entries(GAME_PORTS).forEach(([game, port]) => {
    console.log(`[Gateway] ${game.toUpperCase().replace('-', ' ')} accessible at http://localhost:${PORT}/${game}`);
  });
});
