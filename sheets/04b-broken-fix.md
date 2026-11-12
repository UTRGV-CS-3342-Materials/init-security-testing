# 4b. Broken fix

For sheet 4: You buy 1 to 10 of something

`index.js`: check the range.

```js
	const { quantity, cost } = req.body ?? {};
	if (quantity < 1 || quantity > 10) return res.status(422).json({ errors: ['Quantity must be from 1 to 10.'] });
```
