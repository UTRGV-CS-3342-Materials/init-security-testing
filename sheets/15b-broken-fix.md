# 15b. Broken fix

For sheet 15: If Buy fails, nothing was bought

`index.js`: answer the decline properly.

```js
	try {
		await chargeCard(req.user.id, purchase.total);
	} catch (err) {
		if (err instanceof PaymentError) return res.status(402).json({ errors: [err.message] });
		throw err;
	}
```
