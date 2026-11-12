# 1b. Broken fix

For sheet 1: You can edit your own reviews, and nobody else's

`index.js`: check whose it is, after updating it.

```js
	const review = updateReview(parseInt(req.params.review_id), { ...req.body, content: content.trim() });
	if (!review || review.user_id !== req.user.id) return res.status(404).json({ errors: ['No such review.'] });
```

**Caught by:** the row check after Bob's request. A test that only checks the 404 passes.
