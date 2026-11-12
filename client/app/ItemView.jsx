import { useState } from 'react';
import { Link } from 'react-router';
import { apiFetch, apiPost } from './api.js';
import { Buy } from './Buy.jsx';
import { ItemEditForm } from './ItemEditForm.jsx';

// onEdit and onDelete are only passed for reviews you may change, so only then do the buttons show
function Review({ review, onEdit, onDelete }) {
	return (
		// faded until the server confirms it
		<div className="card w-100 mt-3" style={{ opacity: review.pending ? 0.5 : 1 }}>
			<div className="card-header">
				<em>{review.username ?? review.author}</em>
				{onEdit && !review.pending && (
					<button type="button" className="btn btn-link btn-sm py-0" onClick={() => onEdit(review)}>
						edit
					</button>
				)}
				{onDelete && !review.pending && (
					<button type="button" className="close" aria-label="Delete review" onClick={() => onDelete(review)}>
						&times;
					</button>
				)}
			</div>
			<div className="card-body">
				<p>{review.content}</p>
			</div>
		</div>
	);
}

export function ItemView({ item: loadedItem, reviews, user }) {
	// the item can change on this page: buying takes stock, and admins can edit it
	const [item, setItem] = useState(loadedItem);

	const [blank, setBlank] = useState({ content: false });

	function checkBlank(event) {
		const { name, value } = event.target;
		setBlank({ ...blank, [name]: value.trim() === '' });
	}

	// the list lives in client state now, so reviews can be added (and removed) without a reload
	const [list, setList] = useState(reviews);
	const [saveErrors, setSaveErrors] = useState([]);

	async function submitReview(event) {
		event.preventDefault();
		const form = event.currentTarget;
		const content = form.elements.content.value;

		// no point optimistically adding something we already know the server will reject
		const nowBlank = { content: content.trim() === '' };
		setBlank(nowBlank);
		if (nowBlank.content) return;

		// optimistic update: show the review right away with a temporary id, clear the form
		// (the name shown is a guess until the server confirms; the server decides the real author)
		const tempId = `temp-${Date.now()}`;
		setList((current) => [{ id: tempId, author: user.username, content, pending: true }, ...current]);
		setSaveErrors([]);
		form.reset();

		// rollback: take the review back out and give the user their text back
		// (functional setList because other submits may have changed the list meanwhile)
		function rollback(errors) {
			setList((current) => current.filter((review) => review.id !== tempId));
			form.elements.content.value = content;
			setSaveErrors(errors);
		}

		try {
			// no author sent: the session cookie says who we are
			const response = await apiPost(`/api/item_view/${item.id}/reviews`, { content });
			const body = await response.json();

			// a third kind of failure: the page thinks we're logged in, but the session
			// expired or was logged out in another tab
			if (response.status === 401) {
				rollback(['Your login has expired. Log in again to post your review.']);
				return;
			}
			if (!response.ok) {
				rollback(body.errors);
				return;
			}

			// confirmed: swap the temporary review for the real one (real id, trimmed text)
			setList((current) => current.map((review) => (review.id === tempId ? body.review : review)));
		} catch {
			// network down, or the response wasn't JSON (e.g. a 500 error page)
			rollback(['Could not save your review. Please try again.']);
		}
	}

	// not optimistic: deleting is rare, and putting a review back after it vanished would be confusing
	async function deleteReview(review) {
		setList((current) => current.map((r) => (r.id === review.id ? { ...r, pending: true } : r)));
		setSaveErrors([]);

		function restore(errors) {
			setList((current) => current.map((r) => (r.id === review.id ? review : r)));
			setSaveErrors(errors);
		}

		try {
			const response = await apiFetch(`/api/reviews/${review.id}`, { method: 'DELETE' });
			// 404: someone else already deleted it, which is what we wanted anyway
			if (!response.ok && response.status !== 404) {
				const body = await response.json();
				restore(body.errors);
				return;
			}
			setList((current) => current.filter((r) => r.id !== review.id));
		} catch {
			restore(['Could not delete the review. Please try again.']);
		}
	}

	async function editReview(review) {
		const content = window.prompt('Edit your review', review.content);
		if (!content?.trim()) return;

		setSaveErrors([]);
		try {
			const response = await apiFetch(`/api/reviews/${review.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ author: review.author, content }),
			});
			const body = await response.json();
			if (!response.ok) {
				setSaveErrors(body.errors);
				return;
			}
			setList((current) => current.map((r) => (r.id === review.id ? { ...r, ...body.review } : r)));
		} catch {
			setSaveErrors(['Could not save your review. Please try again.']);
		}
	}

	const messages = [...saveErrors];
	if (blank.content) messages.push('Review is required.');

	return (
		<>
			<div className="pb-2 mt-4 mb-2 border-bottom">
				<h1>{item.name}</h1>
				<p>
					(<Link to="/items">back</Link>)
				</p>
			</div>

			<div className="row">
				<div className="col-4">
					<img className="img-fluid" src={item.image_url} />
				</div>
				<div className="col-4">
					<div>{item.description}</div>
					<div>
						<em>${item.cost}</em>
					</div>
					<div>{item.stock} in stock</div>
					<Buy item={item} user={user} onBought={(stock) => setItem((current) => ({ ...current, stock }))} />
				</div>
			</div>

			{user?.admin && <ItemEditForm item={item} onSaved={setItem} />}

			<div className="row my-4">
				<div className="col-8">
					<h3>Reviews</h3>
	
					<div className="card w-100 mt-3">
						<div className="card-body">
							{/* No method: there's no page route to POST to anymore. Without JavaScript,
							    nothing on this site works at all. */}
							{user ? (
								<form onSubmit={submitReview}>
									{messages.length > 0 && (
										<div className="alert alert-danger">
											<ul className="mb-0">
												{messages.map((message) => (
													<li key={message}>{message}</li>
												))}
											</ul>
										</div>
									)}
									<div className="form-group">
										<label>Add your review, {user.username}!</label>
										<textarea
											className="form-control mb-1"
											placeholder="Review"
											name="content"
											onBlur={checkBlank}
										/>
									</div>
									<div className="form-group">
										<button type="submit" className="btn btn-primary">
											Submit
										</button>
									</div>
								</form>
							) : (
								<p className="mb-0">
									<Link to="/login">Log in</Link> to write a review.
								</p>
							)}
						</div>
					</div>
					
					{list.map((review) => (
						<Review
							key={review.id}
							review={review}
							onEdit={user && review.user_id === user.id ? editReview : null}
							onDelete={user && (review.user_id === user.id || user.admin) ? deleteReview : null}
						/>
					))}
				</div>
			</div>
		</>
	);
}
