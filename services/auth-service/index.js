const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const knex = require('../../common/lib/db')('auth_db');
const redis = require('../../common/lib/redis');
const logger = require('../../common/lib/logger');

const app = express();
app.use(express.json());

// Schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  deviceId: Joi.string().required()
});

// Register endpoint
app.post('/register', async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { email, password, deviceId } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const [userId] = await knex('users').insert({
      email,
      password: hashedPassword,
      created_at: knex.fn.now()
    }).returning('id');

    // Generate tokens
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_SECRET, { expiresIn: '7d' });

    // Store refresh token
    await redis.setex(`refresh:${userId}:${deviceId}`, 7 * 24 * 3600, refreshToken);

    res.json({ 
      accessToken, 
      refreshToken,
      userId,
      expiresIn: 900 
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password, deviceId } = req.body;
  
  try {
    const user = await knex('users').where({ email }).first();
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });

    await redis.setex(`refresh:${user.id}:${deviceId}`, 7 * 24 * 3600, refreshToken);
    
    res.json({ accessToken, refreshToken, userId: user.id });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

const PORT = process.env.AUTH_PORT || 3001;
app.listen(PORT, () => console.log(`Auth service on ${PORT}`));

