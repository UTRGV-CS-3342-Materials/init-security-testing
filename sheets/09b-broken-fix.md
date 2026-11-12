# 9b. Broken fix

For sheet 9: Nothing in a request becomes SQL code

`db.js`: take out anything that could end the statement.

```js
	const columns = Object.keys(fields).map((c) => c.replaceAll(';', ''));
```
