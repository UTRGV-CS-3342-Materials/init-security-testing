# 7b. Broken fix

For sheet 7: Only admins can edit items

`index.js`: check, after saving.

```js
app.put('/api/items/:item_id', requireUser, (req, res) => {
	const item = updateItem(parseInt(req.params.item_id), req.body ?? {});
	if (!req.user.admin) return res.status(403).json({ errors: ['Admins only.'] });
	if (!item) return res.status(404).json({ errors: ['No such item.'] });
	res.json({ item });
});
```
