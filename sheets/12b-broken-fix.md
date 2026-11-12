# 12b. Broken fix

For sheet 12: Bad input gets a 422 in JSON, and errors don't show how the server is built

`index.js`, in both review routes: make it a string first.

```js
	const content = String(req.body?.content ?? '').trim();
	if (!content) return res.status(422).json({ errors: ['Review is required.'] });
```
