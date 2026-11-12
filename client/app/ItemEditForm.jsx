import { useState } from 'react';
import { apiFetch } from './api.js';

// Only shown to admins (hiding it is a courtesy -- the API is what actually says no).
// Sends every field, as loaded, with whatever the admin changed.
export function ItemEditForm({ item, onSaved }) {
	const [fields, setFields] = useState(item);
	const [pending, setPending] = useState(false);
	const [errors, setErrors] = useState([]);
	const [saved, setSaved] = useState(false);

	function change(event) {
		const { name, value } = event.target;
		setFields({ ...fields, [name]: value });
		setSaved(false);
	}

	async function save(event) {
		event.preventDefault();
		setPending(true);
		setErrors([]);
		try {
			const response = await apiFetch(`/api/items/${item.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...fields, cost: Number(fields.cost), stock: Number(fields.stock) }),
			});
			const body = await response.json();
			if (!response.ok) {
				setErrors(body.errors);
				return;
			}
			setFields(body.item);
			onSaved(body.item);
			setSaved(true);
		} catch {
			setErrors(['Could not save the item. Please try again.']);
		} finally {
			setPending(false);
		}
	}

	return (
		<form className="card card-body my-4" onSubmit={save}>
			<h5>Edit item</h5>
			{errors.length > 0 && <div className="alert alert-danger">{errors.join(' ')}</div>}
			<div className="form-group">
				<label>Name</label>
				<input className="form-control" name="name" value={fields.name} onChange={change} />
			</div>
			<div className="form-group">
				<label>Description</label>
				<textarea className="form-control" name="description" value={fields.description ?? ''} onChange={change} />
			</div>
			<div className="form-row">
				<div className="form-group col">
					<label>Cost</label>
					<input type="number" step="0.01" className="form-control" name="cost" value={fields.cost} onChange={change} />
				</div>
				<div className="form-group col">
					<label>Stock</label>
					<input type="number" className="form-control" name="stock" value={fields.stock} onChange={change} />
				</div>
			</div>
			<div>
				<button type="submit" className="btn btn-primary" disabled={pending}>
					{pending ? 'Saving...' : 'Save'}
				</button>
				{saved && <span className="ml-2">Saved.</span>}
			</div>
		</form>
	);
}
