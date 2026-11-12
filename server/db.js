// The database lives with the API server now: the browser app never touches it.

import Database from 'better-sqlite3';

// exported so the User model and sessions can run their own queries
export const db = new Database(process.env.DB_FILE ?? 'shopping.sqlite');

export function getItems() {
	return db.prepare('SELECT * FROM item').all();
}

export function getItem(itemId) {
	return db.prepare('SELECT * FROM item WHERE id = ?').get(itemId);
}

export function getReviews(itemId) {
	// join to user so a review shows the reviewer's current username
	return db.prepare('SELECT user.*, review.* FROM review LEFT JOIN user ON user.id = review.user_id WHERE item_id = ?').all(itemId);
}

// author is a copy of the username, so older reviews (written before there were accounts) still show a name
// returns the saved row so the API can hand the real id back to the client
export function addReview(itemId, userId, author, content) {
	const { lastInsertRowid } = db
		.prepare('INSERT INTO review (item_id, user_id, author, content) VALUES (?, ?, ?, ?)')
		.run(itemId, userId, author, content);
	return { id: lastInsertRowid, item_id: itemId, user_id: userId, author, content };
}

// sets each field it's given, and returns the updated row (undefined if there's no such review)
export function updateReview(reviewId, fields) {
	const columns = Object.keys(fields);
	db.prepare(`UPDATE review SET ${columns.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`)
		.run(...Object.values(fields), reviewId);
	return db.prepare('SELECT * FROM review WHERE id = ?').get(reviewId);
}

// true if there was a review to delete
export function deleteReview(reviewId) {
	return db.prepare('DELETE FROM review WHERE id = ?').run(reviewId).changes > 0;
}

//////////////////////////////////////////////////////////////////
// buying

export function setStock(itemId, stock) {
	db.prepare('UPDATE item SET stock = ? WHERE id = ?').run(stock, itemId);
}

export function addPurchase(userId, itemId, quantity, total) {
	const { lastInsertRowid } = db
		.prepare('INSERT INTO purchase (user_id, item_id, quantity, total) VALUES (?, ?, ?, ?)')
		.run(userId, itemId, quantity, total);
	return db.prepare('SELECT * FROM purchase WHERE id = ?').get(lastInsertRowid);
}

// your orders, newest first
export function getPurchases(userId) {
	return db.prepare(`
		SELECT purchase.id, purchase.quantity, purchase.total, purchase.created_at, item.name
		FROM purchase JOIN item ON item.id = purchase.item_id
		WHERE purchase.user_id = ? ORDER BY purchase.id DESC
	`).all(userId);
}

// one order, with its item and who placed it
// (purchase.* last, so its id wins over item.id and user.id)
export function getPurchase(purchaseId) {
	return db.prepare(`
		SELECT item.*, user.*, purchase.*
		FROM purchase JOIN item ON item.id = purchase.item_id JOIN user ON user.id = purchase.user_id
		WHERE purchase.id = ?
	`).get(purchaseId);
}

// returns the saved item, or undefined if there's no such item
export function updateItem(itemId, { name, description, cost, stock }) {
	return db
		.prepare('UPDATE item SET name = ?, description = ?, cost = ?, stock = ? WHERE id = ? RETURNING *')
		.get(name, description, cost, stock, itemId);
}
