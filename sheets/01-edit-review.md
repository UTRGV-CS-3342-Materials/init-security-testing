# 1. You can edit your own reviews, and nobody else's

**Failure:** the route checks that you're logged in, and `updateReview` finds the review by id alone. The edit button is hidden on other people's reviews, and that's all.

## Check

First, the people. Each one keeps their session cookie in their own file in `.ck/`: `-c` saves it there, `-b` sends it. Amy also posts a review, and every sheet uses these. Run them from the top of your repo (`.ck/` is in `.gitignore`).

```
mkdir -p .ck
curl -c .ck/amy.txt -X POST http://localhost:3000/api/register -H 'Content-Type: application/json' -d '{"username":"amy","password":"correct-horse"}'
curl -c .ck/bob.txt -X POST http://localhost:3000/api/register -H 'Content-Type: application/json' -d '{"username":"bob","password":"correct-horse"}'
curl -c .ck/admin.txt -X POST http://localhost:3000/api/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin-password"}'
curl -b .ck/amy.txt -X POST http://localhost:3000/api/item_view/6/reviews -H 'Content-Type: application/json' -d '{"content":"Amy wrote this."}'
```

Where a check says `ID`, use the `id` that last command returns.

The server keeps sessions in memory, and `npm run dev` restarts it whenever you save a change. After that, the cookie files are no good. Log in again (registering again won't work: the names are taken):

```
curl -c .ck/amy.txt -X POST http://localhost:3000/api/login -H 'Content-Type: application/json' -d '{"username":"amy","password":"correct-horse"}'
curl -c .ck/bob.txt -X POST http://localhost:3000/api/login -H 'Content-Type: application/json' -d '{"username":"bob","password":"correct-horse"}'
curl -c .ck/admin.txt -X POST http://localhost:3000/api/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin-password"}'
```

Now, as Bob, on Amy's review:

```
curl -i -b .ck/bob.txt -X PUT http://localhost:3000/api/reviews/ID -H 'Content-Type: application/json' -d '{"content":"Bob wrote this."}'
```

200, and Amy's review says "Bob wrote this."

## Test (`attacks.test.js`)

```js
test("you can't edit someone else's review", async () => {
	const amy = await register('amy');
	const bob = await register('bob');
	const review = await postReview(amy);
	const path = `/api/reviews/${review.id}`;

	assert.equal((await bob.put(path, { content: 'Hacked.' })).status, 404);
	assert.equal(row('review', review.id).content, 'Original.');

	assert.equal((await amy.put(path, { content: 'Edited.' })).status, 200);
	assert.equal(row('review', review.id).content, 'Edited.');
});
```

## Fix

`db.js`: the check is part of the query, so the update can't happen without it, and nothing can change in between.

```js
export function updateReview(reviewId, userId, fields) {
	const columns = Object.keys(fields);
	const { changes } = db
		.prepare(`UPDATE review SET ${columns.map((c) => `${c} = ?`).join(', ')} WHERE id = ? AND user_id = ?`)
		.run(...Object.values(fields), reviewId, userId);
	if (changes === 0) return undefined;
	return db.prepare('SELECT * FROM review WHERE id = ?').get(reviewId);
}
```

`index.js`: someone else's review gets the same 404 as one that doesn't exist.

```js
	const review = updateReview(parseInt(req.params.review_id), req.user.id, { ...req.body, content: content.trim() });
```

The helper still sets every field it's sent. That's #9 and #10.

## Broken fix

In [`01b-broken-fix.md`](01b-broken-fix.md). Swap it in for the fix, and run the test. Which line catches it? Then put the fix back.
