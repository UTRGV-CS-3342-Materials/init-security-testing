import { useState } from 'react';
import { Link } from 'react-router';
import { apiPost } from './api.js';

// Not optimistic: a purchase waits for the server, so the page never says "bought" when it wasn't.
// onBought gets the new stock, so the page can show it without a reload.
export function Buy({ item, user, onBought }) {
	const [quantity, setQuantity] = useState(1);
	const [pending, setPending] = useState(false);
	const [message, setMessage] = useState(null);
	const [errors, setErrors] = useState([]);

	if (!user) {
		return (
			<p>
				<Link to="/login">Log in</Link> to buy.
			</p>
		);
	}

	async function buy(event) {
		event.preventDefault();
		setPending(true);
		setMessage(null);
		setErrors([]);
		try {
			// the price we showed, so the customer pays what they saw
			const response = await apiPost(`/api/item_view/${item.id}/buy`, { quantity: Number(quantity), cost: item.cost });
			const body = await response.json();
			if (!response.ok) {
				setErrors(body.errors);
				return;
			}
			onBought(item.stock - body.purchase.quantity);
			setMessage(body.purchase);
		} catch {
			setErrors(['Could not complete your purchase. Please try again.']);
		} finally {
			setPending(false);
		}
	}

	return (
		<form className="form-inline my-2" onSubmit={buy}>
			<input
				type="number"
				className="form-control mr-2"
				style={{ width: '5em' }}
				min="1"
				max="10"
				value={quantity}
				onChange={(event) => setQuantity(event.target.value)}
			/>
			<button type="submit" className="btn btn-success" disabled={pending}>
				{pending ? 'Buying...' : 'Buy'}
			</button>
			{message && (
				<span className="ml-2">
					Bought! <Link to={`/orders/${message.id}`}>Order #{message.id}</Link>
				</span>
			)}
			{errors.length > 0 && <span className="ml-2 text-danger">{errors.join(' ')}</span>}
		</form>
	);
}
