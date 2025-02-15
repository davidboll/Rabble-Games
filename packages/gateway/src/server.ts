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

// Determine the root directory for the monorepo
const MONOREPO_ROOT = path.join(__dirname, '..', '..', '..');

console.log(`[Gateway] Attempting to start on PORT: ${PORT}`);
console.log(`[Gateway] Monorepo root: ${MONOREPO_ROOT}`);
console.log(`[Gateway] Current directory: ${__dirname}`);

// Enable CORS
app.use(cors());

// Serve Proviva directly
const provivaPath = path.join(MONOREPO_ROOT, 'packages', 'rabble-proviva', 'public');
console.log(`[Gateway] Serving Proviva from: ${provivaPath}`);
app.use('/rabble-proviva', express.static(provivaPath));

// Serve Doritos directly
const doritosPath = path.join(MONOREPO_ROOT, 'packages', 'doritos', 'public');
console.log(`[Gateway] Serving Doritos from: ${doritosPath}`);
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
  
  // Add your Proviva-specific socket handlers here
});

// Namespace for Doritos
const doritosIo = io.of('/doritos');
doritosIo.on('connection', (socket) => {
  console.log('[Doritos] Client connected');
  
  socket.on('disconnect', () => {
    console.log('[Doritos] Client disconnected');
  });
  
  // Add your Doritos-specific socket handlers here
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
