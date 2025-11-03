const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'development',
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'Café Colombia API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(Server ready on port );
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
