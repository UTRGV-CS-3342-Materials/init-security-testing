# 8. Admins can delete reviews, but not edit them

## Find it

Try it as the admin, on the starter.

Paste the requests you sent, and what came back:

```

```

## Your test (`attacks.test.js`)

```js
test("an admin can't edit someone else's review", async () => {
	// set up: a customer's review
	// the attack: the admin edits it
	// what proves the rule held: the status, and the row
	// control: the customer edits it
});
```

Run it before fixing anything. It has to fail. If it passes, it isn't testing the rule.

## The AI's test

Ask your AI for a test of the same rule, and paste it:

```js

```

What does it check that yours doesn't, or the other way around?

## The fix

Your code may already pass. If it does, which line of which fix makes it pass?

## The broken fix

In [`08b-broken-fix.md`](08b-broken-fix.md). Swap it in for your fix, and run both tests. A good test fails here. Which ones did? Then put your fix back.

## After

Send the same requests again, and paste what came back:

```

```
