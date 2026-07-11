require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const { initSocket } = require('./utils/socket');
const { startDailyMonitoringJob } = require('./jobs/dailyMonitoringJob');

const authRoutes = require('./routes/authRoutes');
const animalRoutes = require('./routes/animalRoutes');
const alertRoutes = require('./routes/alertRoutes');
const dailyCareRoutes = require('./routes/dailyCareRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const dietRoutes = require('./routes/dietRoutes');
const testRoutes = require('./routes/testRoutes');
const reportRoutes = require('./routes/reportRoutes');
const rescueRoutes = require('./routes/rescueRoutes');

const app = express();
const server = http.createServer(app);

connectDB();
initSocket(server);
startDailyMonitoringJob();

app.use(cors({
  origin: 'https://vantara-frontend.vercel.app',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dailycare', dailyCareRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/test', testRoutes);
app.use('/api/reports', reportRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/rescue', rescueRoutes);

app.get('/', (req, res) => {
  res.send('🐘 Vantara AI Guardian Platform API is running!');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});