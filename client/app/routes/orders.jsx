import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import { apiFetch } from '../api.js';

export default function OrdersRoute() {
	const { user } = useOutletContext();
	const [purchases, setPurchases] = useState(null);
	const [error, setError] = useState(null);

	useEffect(() => {
		let ignore = false;

		(async function load() {
			try {
				const response = await apiFetch('/api/purchases');
				if (!response.ok) {
					if (!ignore) setError(response.status === 401 ? 'Log in to see your orders.' : 'Could not load your orders.');
					return;
				}
				const body = await response.json();
				if (!ignore) setPurchases(body.purchases);
			} catch {
				if (!ignore) setError('Could not load your orders.');
			}
		})();

		return () => {
			ignore = true;
		};
		// a different user is a different list
	}, [user?.id]);

	if (error) return <p className="mt-4">{error}</p>;
	if (!purchases) return <p className="mt-4">Loading...</p>;

	return (
		<>
			<div className="pb-2 mt-4 mb-2 border-bottom">
				<h1>Your orders</h1>
				<p>
					(<Link to="/items">back</Link>)
				</p>
			</div>
			{purchases.length === 0 ? (
				<p>No orders yet.</p>
			) : (
				<table className="table">
					<tbody>
						{purchases.map((purchase) => (
							<tr key={purchase.id}>
								<td>
									<Link to={`/orders/${purchase.id}`}>#{purchase.id}</Link>
								</td>
								<td>{purchase.name}</td>
								<td>{purchase.quantity}</td>
								<td className="price">${purchase.total}</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</>
	);
}
