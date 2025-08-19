require('dotenv').config();

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const jwt = require('jsonwebtoken');

const app = express();

const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET || 'replace-me';
const JWT_SECRET = process.env.JWT_SECRET || 'replace-jwt-secret';
const DB_NAME = process.env.DB_NAME || 'temp_web';

if (!MONGO_URI) {
	console.error('Missing MONGO_URI in environment.');
	process.exit(1);
}

// Avoid creating multiple connections in serverless by checking existing connection
if (mongoose.connection.readyState === 0) {
	mongoose
		.connect(MONGO_URI, { dbName: DB_NAME })
		.then(() => console.log(`Connected to MongoDB (db: ${DB_NAME})`))
		.catch((err) => {
			console.error('Mongo connection error:', err);
			process.exit(1);
		});
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
	session({
		secret: SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		cookie: { maxAge: 1000 * 60 * 60 * 24 },
		store: MongoStore.create({ mongoUrl: MONGO_URI, dbName: DB_NAME })
	})
);

const User = require('./models/User');

function requireAuth(req, res, next) {
	if (req.session && req.session.userId) return next();
	return res.redirect('/login');
}

// JWT helpers
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

app.get('/', (req, res) => {
	if (req.session && req.session.userId) return res.redirect('/dashboard');
	res.redirect('/login');
});

app.get('/signup', (req, res) => {
	if (req.session && req.session.userId) return res.redirect('/dashboard');
	res.render('signup', { error: null, values: { email: '', username: '' } });
});

app.post('/signup', async (req, res) => {
	const { email, username, password, confirmPassword } = req.body;
	try {
		if (!email || !username || !password || !confirmPassword) {
			return res.status(400).render('signup', { error: 'All fields are required.', values: { email, username } });
		}
		if (password !== confirmPassword) {
			return res.status(400).render('signup', { error: 'Passwords do not match.', values: { email, username } });
		}
		const existing = await User.findOne({ $or: [{ email }, { username }] });
		if (existing) {
			return res.status(400).render('signup', { error: 'Email or username already exists.', values: { email, username } });
		}
		const user = new User({ email, username });
		await user.setPassword(password);
		await user.save();
		return res.redirect('/login');
	} catch (err) {
		console.error(err);
		return res.status(500).render('signup', { error: 'Something went wrong. Please try again.', values: { email, username } });
	}
});

app.get('/login', (req, res) => {
	if (req.session && req.session.userId) return res.redirect('/dashboard');
	res.render('login', { error: null, values: { username: '' } });
});

app.post('/login', async (req, res) => {
	const { username, password } = req.body;
	try {
		if (!username || !password) {
			return res.status(400).render('login', { error: 'Username and password are required.', values: { username } });
		}
		const user = await User.findOne({ username });
		if (!user) {
			return res.status(400).render('login', { error: 'Invalid credentials.', values: { username } });
		}
		const ok = await user.verifyPassword(password);
		if (!ok) {
			return res.status(400).render('login', { error: 'Invalid credentials.', values: { username } });
		}
		req.session.userId = user._id.toString();
		req.session.username = user.username;
		return res.redirect('/dashboard');
	} catch (err) {
		console.error(err);
		return res.status(500).render('login', { error: 'Something went wrong. Please try again.', values: { username } });
	}
});

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

app.get('/dashboard', requireAuth, async (req, res) => {
	const user = await User.findById(req.session.userId).lean();
	res.render('dashboard', { user });
});

app.post('/logout', (req, res) => {
	req.session.destroy(() => {
		res.clearCookie('connect.sid');
		res.redirect('/login');
	});
});

module.exports = app;
