require('dotenv').config();

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'replace-jwt-secret';
const DB_NAME = process.env.DB_NAME || 'temp_web';

if (!MONGO_URI) {
	console.error('Missing MONGO_URI in environment.');
	process.exit(1);
}

if (mongoose.connection.readyState === 0) {
	mongoose
		.connect(MONGO_URI, { dbName: DB_NAME })
		.then(() => console.log(`Connected to MongoDB (db: ${DB_NAME})`))
		.catch((err) => {
			console.error('Mongo connection error:', err);
			process.exit(1);
		});
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static: public (CSS), plus Vite build if exists
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));

const User = require('./models/User');

function issueToken(user) {
	return jwt.sign({ sub: user._id.toString(), username: user.username }, JWT_SECRET, { expiresIn: '1d' });
}

function requireJwt(req, res, next) {
	const auth = req.headers.authorization || '';
	const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
	if (!token) return res.status(401).json({ error: 'Missing token' });
	try {
		const payload = jwt.verify(token, JWT_SECRET);
		req.jwt = payload;
		return next();
	} catch (err) {
		return res.status(401).json({ error: 'Invalid token' });
	}
}

// API routes (JWT-based)
app.get('/api/health', (req, res) => {
	res.json({ status: 'ok' });
});

app.post('/api/signup', async (req, res) => {
	const { email, username, password } = req.body;
	try {
		if (!email || !username || !password) return res.status(400).json({ error: 'All fields are required' });
		const existing = await User.findOne({ $or: [{ email }, { username }] });
		if (existing) return res.status(400).json({ error: 'Email or username exists' });
		const user = new User({ email, username });
		await user.setPassword(password);
		await user.save();
		return res.status(201).json({ message: 'User created' });
	} catch (err) {
		return res.status(500).json({ error: 'Server error' });
	}
});

app.post('/api/login', async (req, res) => {
	const { username, password } = req.body;
	try {
		const user = await User.findOne({ username });
		if (!user) return res.status(400).json({ error: 'Invalid credentials' });
		const ok = await user.verifyPassword(password);
		if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
		const token = issueToken(user);
		return res.json({ token });
	} catch (err) {
		return res.status(500).json({ error: 'Server error' });
	}
});

app.get('/api/me', requireJwt, async (req, res) => {
	const user = await User.findById(req.jwt.sub).lean();
	if (!user) return res.status(404).json({ error: 'Not found' });
	res.json({ _id: user._id, email: user.email, username: user.username, createdAt: user.createdAt });
});

// React SPA fallback (Express 5 compatible)
app.get(/^\/(?!api|assets).*/, (req, res) => {
	const indexPath = path.join(__dirname, 'dist', 'index.html');
	res.sendFile(indexPath);
});

module.exports = app;
