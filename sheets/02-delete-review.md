# 2. You can delete your own reviews, and admins can delete anyone's

**Failure:** `deleteReview` deletes by id alone.

## Check

As Bob, on Amy's review:

```
curl -i -b .ck/bob.txt -X DELETE http://localhost:3000/api/reviews/ID
curl -s http://localhost:3000/api/item_view/6
```

204, and Amy's review is gone.

## Test (`attacks.test.js`)

```js
test("you can't delete someone else's review, but an admin can", async () => {
	const amy = await register('amy');
	const bob = await register('bob');
	const review = await postReview(amy);
	const path = `/api/reviews/${review.id}`;

	assert.equal((await bob.delete(path)).status, 404);
	assert.ok(row('review', review.id));

	const admin = await logInAsAdmin();
	assert.equal((await admin.delete(path)).status, 204);
	assert.equal(row('review', review.id), undefined);
});
```

## Fix

`db.js`: whether you're an admin is already known, so that's plain JavaScript. Whose review it is isn't known until the database looks, so that's in the `WHERE`, as in #1.

```js
// true if there was a review this user may delete: their own, or any if they're an admin
export function deleteReview(reviewId, user) {
	if (user.admin) return db.prepare('DELETE FROM review WHERE id = ?').run(reviewId).changes > 0;
	return db.prepare('DELETE FROM review WHERE id = ? AND user_id = ?').run(reviewId, user.id).changes > 0;
}
```

`index.js`:

```js
	if (!deleteReview(reviewId, req.user)) return res.status(404).json({ errors: ['No such review.'] });
```

## Broken fix

In [`02b-broken-fix.md`](02b-broken-fix.md). Swap it in for the fix, and run the test. Which line catches it? Then put the fix back.
