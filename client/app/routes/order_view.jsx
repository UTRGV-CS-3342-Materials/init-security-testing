import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { apiFetch } from '../api.js';

export default function OrderViewRoute() {
	const { purchase_id } = useParams();
	const [purchase, setPurchase] = useState(null);
	const [error, setError] = useState(null);

	useEffect(() => {
		let ignore = false;

		(async function load() {
			try {
				const response = await apiFetch(`/api/purchases/${purchase_id}`);
				if (!response.ok) {
					if (!ignore) setError(response.status === 404 ? 'No such order.' : 'Could not load the order.');
					return;
				}
				const body = await response.json();
				if (!ignore) setPurchase(body.purchase);
			} catch {
				if (!ignore) setError('Could not load the order.');
			}
		})();

		return () => {
			ignore = true;
		};
	}, [purchase_id]);

	if (error) {
		return (
			<p className="mt-4">
				{error} (<Link to="/orders">back</Link>)
			</p>
		);
	}
	if (!purchase) return <p className="mt-4">Loading...</p>;

	return (
		<>
			<div className="pb-2 mt-4 mb-2 border-bottom">
				<h1>Order #{purchase.id}</h1>
				<p>
					(<Link to="/orders">back</Link>)
				</p>
			</div>
			<div className="row">
				<div className="col-2">
					<img className="img-fluid" src={purchase.image_url} />
				</div>
				<div className="col-6">
					<div>
						<Link to={`/item_view/${purchase.item_id}`}>{purchase.name}</Link> &times; {purchase.quantity}
					</div>
					<div>
						<em>${purchase.total}</em>
					</div>
					<div>
						Placed by {purchase.username} on {purchase.created_at}
					</div>
				</div>
			</div>
		</>
	);
}
