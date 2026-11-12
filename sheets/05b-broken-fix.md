# 5b. Broken fix

For sheet 5: You can see your own orders, and nobody else's

`db.js`: the check is in the query, with the arguments in the wrong order.

```js
export function getPurchase(purchaseId, userId) {
	return db.prepare(`
		SELECT item.*, user.*, purchase.*
		FROM purchase JOIN item ON item.id = purchase.item_id JOIN user ON user.id = purchase.user_id
		WHERE purchase.id = ? AND purchase.user_id = ?
	`).get(userId, purchaseId);
}
```
