// Adds stock and purchases. Run once: node migrate-shop.js
import { db } from './db.js';

db.exec(`
	ALTER TABLE item ADD COLUMN stock INTEGER NOT NULL DEFAULT 5;
	CREATE TABLE purchase (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL REFERENCES user(id),
		item_id INTEGER NOT NULL REFERENCES item(id),
		quantity INTEGER NOT NULL,
		total NUMERIC NOT NULL,
		created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
	);
`);
