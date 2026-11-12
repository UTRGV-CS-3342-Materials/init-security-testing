# 13b. Broken fix

For sheet 13: Stock never goes below 0, and every sale took one from stock

`index.js` (with `db` imported from `db.js`): a guarded update, but after the wait.

```js
	const purchase = addPurchase(req.user.id, item.id, quantity, item.cost * quantity);
	await chargeCard(req.user.id, purchase.total);

	const { changes } = db.prepare('UPDATE item SET stock = stock - ? WHERE id = ? AND stock >= ?').run(quantity, item.id, quantity);
	if (!changes) return res.status(409).json({ errors: ['Not enough in stock.'] });
	res.status(201).json({ purchase });
```
