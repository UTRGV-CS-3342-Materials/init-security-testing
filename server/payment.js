// A pretend card processor: slow, like a real one, and it declines anything over the limit.
// Nothing here is a bug. PAYMENT_DELAY_MS sets how long a charge takes.

export class PaymentError extends Error {}

const CARD_LIMIT = 1000;

export async function chargeCard(userId, amount) {
	await new Promise((resolve) => setTimeout(resolve, Number(process.env.PAYMENT_DELAY_MS ?? 300)));
	if (amount > CARD_LIMIT) throw new PaymentError('Card declined.');
	return { chargeId: crypto.randomUUID() };
}
