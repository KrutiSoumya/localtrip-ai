const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

// routes
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trip');
const aiRoutes = require('./routes/aiRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/trip', tripRoutes);
app.use('/api/ai', aiRoutes);

// test route
app.get('/', (req, res) => {
    res.send("API is running...");
});

app.listen(5000, () => console.log('Server running on port 5000'));