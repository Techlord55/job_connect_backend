// // app.js
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const authRoutes = require('./routes/authRoutes');
// const socialAuthRoutes = require('./routes/socialAuthRoutes');
// const profileRoutes = require('./routes/application');




// dotenv.config();
// const app = express();
// app.use(cors());
// app.use(express.json());



// app.use(session({
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: true,
// }));


// app.use('/api/auth', authRoutes);
// app.use('/api/auth', socialAuthRoutes);
// app.use('/uploads', express.static('uploads'));
// app.use('/api/profile', profileRoutes);
// app.use('/api/employers', employerRoutes);
// app.use('api/applications', applicationRoutes);
// app.use('/api', saveUserRoute); // now /api/save-user works



// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => console.error(err));

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
