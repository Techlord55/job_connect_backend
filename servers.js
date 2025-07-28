

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Route imports
const authRoutes = require('./routes/authRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const otpRoutes = require('./routes/otp');
const socialAuthRoutes = require('./routes/socialAuthRoutes');
const { errorHandler } = require('./middlewares/errorMiddleware');
require('./config/passport');
const employerRoutes = require('./routes/Employer');
const jobseekerRoutes = require('./routes/Jobseekers');
const saveUserRoute = require('./routes/saveUser');
const applicationRoutes = require('./routes/applications');
const jobsRouter = require('./routes/jobs');
const marketRouter = require('./routes/item');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();
const server = http.createServer(app);

// Permissive CORS for development
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: true, // Changed for development
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/jobconnect',
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: false // Disabled for development
  }
}));


// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Socket.IO setup



const io = new Server(server, {
  cors: {
    origin: '*', // or your frontend URL
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);

  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`👥 User joined chat room: ${chatId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
  });
});

app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/socialAuth', socialAuthRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/jobseekers', jobseekerRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', saveUserRoute);
app.use('/api/applications', applicationRoutes);
app.use('/api', jobsRouter);
app.use('/api/marketplace', marketRouter);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

// Simple health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Error handler
app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jobconnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || '0.0.0.0';
  server.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});

module.exports = { app, server, io };