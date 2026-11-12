# 6. A password hash never leaves the server (orders)

## Find it

Look at everything `GET /api/purchases/:id` sends back.

Paste the requests you sent, and what came back:

```

```

## Your test (`attacks.test.js`)

```js
test('an order includes no password hash', async () => {
	// set up: a customer buys something, and their hash from the database
	// the request: they ask for their own order
	// what proves the rule held: search the whole response
	// control: it's still their order
});
```

Run it before fixing anything. It has to fail. If it passes, it isn't testing the rule.

## The AI's test

Ask your AI for a test of the same rule, and paste it:

```js

```

What does it check that yours doesn't, or the other way around?

## The fix

Ask for a fix. You can ask more than one AI, or ask for two different fixes. Paste the one you used:

```js

```

If you got more than one, how are they different, and why did you pick this one?

Run both tests again. They should pass now.

## A fix that passes

In [`06b-a-fix-that-passes.md`](06b-a-fix-that-passes.md). It passes your test. Read it, and answer the question there.

## After

Send the same requests again, and paste what came back:

```

```
