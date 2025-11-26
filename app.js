require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./backend/config/db");
const pokemonRoutes = require("./backend/routes/pokemonRoutes");

const app = express();
const fs = require('fs');

try {
  const compression = require('compression');
  app.use(compression());
  console.log('✓ Compression enabled');
} catch (err) {
  console.warn('Compression middleware not installed (optional). Run: npm install compression');
}
// ---- MIDDLEWARE ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Connect to DB but don't block server startup
connectDB().catch(err => console.error('[App] DB connection error handled:', err.message));

app.use("/api", pokemonRoutes);

const frontendPath = path.join(__dirname, 'frontend');
const frontendIndex = path.join(frontendPath, 'index.html');

if (fs.existsSync(frontendPath) && fs.existsSync(frontendIndex)) {
  app.use(express.static(frontendPath, { maxAge: '1d' }));

  app.get(['/', '/index.html'], (req, res) => {
    res.sendFile(frontendIndex);
  });

  
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    if (req.method !== 'GET') return next();
    res.sendFile(frontendIndex);
  });
} else {
  app.get(['/', '/index.html'], (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Pokédex API running. Frontend not found on server.'
    });
  });
}

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n✓ Pokédex API Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`✓ API Base URL: ${url}\n`);

  
  if (String(process.env.AUTO_OPEN_BROWSER).toLowerCase() === 'true') {
    try {
      const { exec } = require('child_process');
      let startCmd = '';
      if (process.platform === 'win32') {
        startCmd = `start "" "${url}"`;
      } else if (process.platform === 'darwin') {
        startCmd = `open "${url}"`;
      } else {
        startCmd = `xdg-open "${url}"`;
      }
      exec(startCmd, (err) => { if (err) console.warn('Unable to open browser automatically:', err.message); });
    } catch (err) {
      console.warn('Auto-open browser failed:', err && err.message);
    }
  }
});
