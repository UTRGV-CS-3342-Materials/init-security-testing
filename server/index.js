// The API server: JSON in, JSON out, no pages. The site itself is the react-router
// app in ../client, served separately on port 8080.
// Run this in its own terminal: `cd server`, then `npm run dev`.

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import {
	getItems, getItem, getReviews, addReview, updateReview, deleteReview,
	setStock, addPurchase, getPurchases, getPurchase, updateItem,
} from './db.js';
import { chargeCard } from './payment.js';
import { User } from './user.js';

const PORT = process.env.PORT ?? 3000;

// simulate a slow network/server so loading states are visible during development
const FAKE_LATENCY_MS = process.env.FAKE_LATENCY_MS ?? 500;

const app = express();

// The browser app comes from a different origin (port 8080), so the browser won't let it
// read our replies unless we say it may. A JSON POST also sends a "preflight" OPTIONS request
// first to ask permission; cors() answers that here, before the fake latency below.
// credentials: the browser only sends cookies cross-origin (and only lets the page see the reply)
// if we say so here AND the fetch asks with credentials: 'include'.
app.use(cors({ origin: 'http://localhost:8080', credentials: true }));
app.use(express.json());
app.use((req, res, next) => setTimeout(next, FAKE_LATENCY_MS));

// The cookie holds only a random id, signed so it can't be changed. The session itself is kept in
// this server's memory, which is simple, but it means a restart logs everyone out.
// HttpOnly: page scripts can't read it. SameSite=Lax: other sites can't make the browser send it with their POSTs.
const SESSION_COOKIE = 'session';
const SESSION_COOKIE_OPTIONS = { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 };

app.use(session({
	name: SESSION_COOKIE,
	secret: process.env.SESSION_SECRET ?? 'development-only-secret',
	resave: false,
	saveUninitialized: false,
	cookie: SESSION_COOKIE_OPTIONS,
}));

//////////////////////////////////////////////////////////////////
// middleware: functions that run before a route handler, and either
// pass the request along (next) or answer it themselves

// every request: who is this? (req.user is a User, or null)
app.use((req, res, next) => {
	req.user = req.session.userId ? User.findById(req.session.userId) : null;
	next();
});

// per route: must be logged in. 401 means "we don't know who you are".
// (an API answers with a status, never a redirect: the client decides what to show)
function requireUser(req, res, next) {
	if (!req.user) return res.status(401).json({ errors: ['You need to log in.'] });
	next();
}

// per route: must be an admin. 403 means "we know who you are, and the answer is no".
function requireAdmin(req, res, next) {
	if (!req.user) return res.status(401).json({ errors: ['You need to log in.'] });
	if (!req.user.admin) return res.status(403).json({ errors: ['Admins only.'] });
	next();
}

//////////////////////////////////////////////////////////////////
// users and sessions

// who am I? not logged in is a normal answer here, not an error
app.get('/api/me', (req, res) => {
	res.json({ user: req.user });
});

app.post('/api/register', async (req, res) => {
	const { username, password } = req.body ?? {};
	const { user, errors } = await User.signup(username, password);
	if (!user) return res.status(422).json({ errors });

	req.session.userId = user.id;
	res.status(201).json({ user });
});

app.post('/api/login', async (req, res) => {
	const { username, password } = req.body ?? {};
	const user = await User.login(username, password);
	if (!user) return res.status(401).json({ errors: ['Wrong username or password.'] });

	req.session.userId = user.id;
	res.json({ user });
});

app.post('/api/logout', (req, res, next) => {
	req.session.destroy((err) => {
		if (err) return next(err);
		// clearing needs the same path/sameSite as setting, or the browser keeps the old one
		const { maxAge, ...clearOptions } = SESSION_COOKIE_OPTIONS;
		res.clearCookie(SESSION_COOKIE, clearOptions);
		res.json({ user: null });
	});
});

//////////////////////////////////////////////////////////////////
// shopping

app.get('/api/items', (req, res) => {
	res.json({ items: getItems() });
});

app.get('/api/item_view/:item_id', (req, res) => {
	const itemId = parseInt(req.params.item_id);
	const item = getItem(itemId);
	if (!item) return res.status(404).json({ errors: ['No such item.'] });

	res.json({ item, reviews: getReviews(itemId) });
});

app.post('/api/item_view/:item_id/reviews', requireUser, (req, res) => {
	const itemId = parseInt(req.params.item_id);
	if (!getItem(itemId)) return res.status(404).json({ errors: ['No such item.'] });

	// only the content comes from the client: who wrote it comes from the session
	const { content } = req.body ?? {};

	// never trust the client's checks
	const errors = [];
	if (!content?.trim()) errors.push('Review is required.');

	if (errors.length > 0) return res.status(422).json({ errors });

	const review = addReview(itemId, req.user.id, req.user.username, content.trim());
	res.status(201).json({ review });
});

// you have to be logged in to edit or delete, and the buttons only show on your own reviews
app.put('/api/reviews/:review_id', requireUser, (req, res) => {
	const { content } = req.body ?? {};
	if (!content?.trim()) return res.status(422).json({ errors: ['Review is required.'] });

	// whatever fields the form sends, so the form can grow without changing the server
	const review = updateReview(parseInt(req.params.review_id), { ...req.body, content: content.trim() });
	if (!review) return res.status(404).json({ errors: ['No such review.'] });

	res.json({ review });
});

app.delete('/api/reviews/:review_id', requireUser, (req, res) => {
	const reviewId = parseInt(req.params.review_id);
	if (!deleteReview(reviewId)) return res.status(404).json({ errors: ['No such review.'] });

	res.status(204).end();
});

//////////////////////////////////////////////////////////////////
// buying

app.post('/api/item_view/:item_id/buy', requireUser, async (req, res) => {
	const item = getItem(parseInt(req.params.item_id));
	if (!item) return res.status(404).json({ errors: ['No such item.'] });

	// the page sends the price it showed, so the customer pays what they saw
	const { quantity, cost } = req.body ?? {};
	if (item.stock < quantity) return res.status(409).json({ errors: ['Not enough in stock.'] });

	// record the order, charge the card, then take it out of stock
	const purchase = addPurchase(req.user.id, item.id, quantity, cost * quantity);
	await chargeCard(req.user.id, purchase.total);
	setStock(item.id, item.stock - quantity);

	res.status(201).json({ purchase });
});

app.get('/api/purchases', requireUser, (req, res) => {
	res.json({ purchases: getPurchases(req.user.id) });
});

app.get('/api/purchases/:purchase_id', requireUser, (req, res) => {
	const purchase = getPurchase(parseInt(req.params.purchase_id));
	if (!purchase) return res.status(404).json({ errors: ['No such order.'] });
	res.json({ purchase });
});

// the edit form only shows for admins
app.put('/api/items/:item_id', requireUser, (req, res) => {
	const item = updateItem(parseInt(req.params.item_id), req.body ?? {});
	if (!item) return res.status(404).json({ errors: ['No such item.'] });
	res.json({ item });
});

app.listen(PORT, () => console.log(`API server on http://localhost:${PORT}`));
