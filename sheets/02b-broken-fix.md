# 2b. Broken fix

For sheet 2: You can delete your own reviews, and admins can delete anyone's

`db.js`: owners only, and the admin rule is forgotten.

```js
export function deleteReview(reviewId, user) {
	return db.prepare('DELETE FROM review WHERE id = ? AND user_id = ?').run(reviewId, user.id).changes > 0;
}
```

**Caught by:** the admin control. A test that only tries Bob passes.
