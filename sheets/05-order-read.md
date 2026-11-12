# 5. You can see your own orders, and nobody else's

## Find it

Look at `GET /api/purchases/:id`.

Paste the requests you sent, and what came back:

```

```

## Your test (`attacks.test.js`)

```js
test("you can't see someone else's order", async () => {
	// set up: two customers, and one buys something
	// the attack: the other one asks for that order
	// what proves the rule held
	// control: the one who bought it asks
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

## The broken fix

In [`05b-broken-fix.md`](05b-broken-fix.md). Swap it in for your fix, and run both tests. A good test fails here. Which ones did? Then put your fix back.

## After

Send the same requests again, and paste what came back:

```

```
