const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const config = require('./config/config');
const { validateApiKey } = require('./middlewares/apiKey.middleware');
const { sendMessage } = require('./controllers/message.controller');
const { errorHandler } = require('./middlewares/error.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const clinicRoutes = require('./routes/clinic.routes');
const messageRoutes = require('./routes/message.routes');
const logRoutes = require('./routes/log.routes');
const whatsappRoutes = require('./routes/whatsapp.routes');

// Connect Database
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // For development, allow all. Can narrow down to frontend domain in production.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));
app.use(express.json());

// 1. PUBLIC REST API FOR HOSPITAL MANAGEMENT SYSTEM
// Endpoint: POST /api/send-message
app.post('/api/send-message', validateApiKey, sendMessage);

// 2. PRIVATE ADMIN DASHBOARD APIS
app.use('/api/auth', authRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Global Error Handler
app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});
