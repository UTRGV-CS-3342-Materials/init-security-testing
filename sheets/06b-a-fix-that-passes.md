# 6b. A fix that passes

For sheet 6: A password hash never leaves the server (orders)

`index.js`: take the hash out before sending.

```js
	const { password_hash, ...shown } = purchase;
	res.json({ purchase: shown });
```

Your test passes. Now add an `email` column to `user`. What does an order send now? What would naming the columns send?
