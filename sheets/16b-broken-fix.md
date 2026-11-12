# 16b. Broken fix

For sheet 16: One click of Buy is one purchase

Look for the key first, and save it once the card is charged. With a key column:

```js
db.exec(`
	ALTER TABLE purchase ADD COLUMN idempotency_key TEXT;
	CREATE UNIQUE INDEX purchase_key ON purchase (user_id, idempotency_key);
`);
```

`index.js` (with `db` imported from `db.js`):

```js
	const key = req.get('Idempotency-Key') ?? null;
	const done = key && db.prepare('SELECT * FROM purchase WHERE user_id = ? AND idempotency_key = ?').get(req.user.id, key);
	if (done) return res.json({ purchase: done });

	const purchase = buyItem(req.user.id, item.id, quantity);
	if (!purchase) return res.status(409).json({ errors: ['Not enough in stock.'] });

	try {
		await chargeCard(req.user.id, purchase.total);
	} catch (err) {
		cancelPurchase(purchase.id);
		if (err instanceof PaymentError) return res.status(402).json({ errors: [err.message] });
		throw err;
	}
	db.prepare('UPDATE purchase SET idempotency_key = ? WHERE id = ?').run(key, purchase.id);
	res.status(201).json({ purchase });
```
