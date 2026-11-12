# 11b. Broken fix

For sheet 11: You pay the price in the database

`index.js`: use the server's price when the client doesn't send one.

```js
	const purchase = addPurchase(req.user.id, item.id, quantity, (cost ?? item.cost) * quantity);
```
