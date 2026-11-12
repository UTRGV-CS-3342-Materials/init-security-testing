# 14b. Broken fix

For sheet 14: Saving the item form changes only what the admin changed

Check a version when saving, and leave buying as it is. With a version column:

```js
db.exec('ALTER TABLE item ADD COLUMN version INTEGER NOT NULL DEFAULT 1');
```

`db.js`:

```js
export function updateItem(itemId, { name, description, cost, stock, version }) {
	return db.prepare(`
		UPDATE item SET name = ?, description = ?, cost = ?, stock = ?, version = version + 1
		WHERE id = ? AND version = ? RETURNING *
	`).get(name, description, cost, stock, itemId, version);
}
```

In `index.js`, a 409 when that returns nothing:

```js
	if (!item) return res.status(409).json({ errors: ['Someone changed this item while you were editing.'] });
```
