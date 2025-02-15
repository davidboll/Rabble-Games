import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 10000;

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

console.log(`[Gateway] Starting in ${isProduction ? 'production' : 'development'} mode`);
console.log(`[Gateway] Attempting to start on PORT: ${PORT}`);

// Enable CORS
app.use(cors());

// Setup paths for static files
let provivaPath: string;
let doritosPath: string;

if (isProduction) {
  // In production, serve from the root of the project
  provivaPath = path.join(process.cwd(), 'packages', 'rabble-proviva', 'public');
  doritosPath = path.join(process.cwd(), 'packages', 'doritos', 'public');
} else {
  // In development, serve from relative paths
  provivaPath = path.join(__dirname, '../../rabble-proviva/public');
  doritosPath = path.join(__dirname, '../../doritos/public');
}

console.log(`[Gateway] Serving Proviva from: ${provivaPath}`);
console.log(`[Gateway] Serving Doritos from: ${doritosPath}`);

// Serve static files
app.use('/rabble-proviva', express.static(provivaPath));
app.use('/doritos', express.static(doritosPath));

// Setup Socket.IO
const io = new Server(server, {
  path: '/socket.io',
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Namespace for Proviva
const provivaIo = io.of('/rabble-proviva');
provivaIo.on('connection', (socket) => {
  console.log('[Proviva] Client connected');
  
  socket.on('disconnect', () => {
    console.log('[Proviva] Client disconnected');
  });
});

// Namespace for Doritos
const doritosIo = io.of('/doritos');
doritosIo.on('connection', (socket) => {
  console.log('[Doritos] Client connected');
  
  socket.on('disconnect', () => {
    console.log('[Doritos] Client disconnected');
  });
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
          <a href="/rabble-proviva" class="game-link">Proviva</a>
          <a href="/doritos" class="game-link">Doritos</a>
        </div>
      </body>
    </html>
  `);
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Gateway] Error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Starta servern
server.listen(PORT, () => {
  console.log(`[Gateway] Server SUCCESSFULLY running on http://localhost:${PORT}`);
  console.log(`[Gateway] PROVIVA accessible at http://localhost:${PORT}/rabble-proviva`);
  console.log(`[Gateway] DORITOS accessible at http://localhost:${PORT}/doritos`);
});
