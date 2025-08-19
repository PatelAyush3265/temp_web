import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [error, setError] = useState('');

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (!token) {
			navigate('/login');
			return;
		}
		(async () => {
			try {
				const res = await fetch('/api/me', {
					headers: { Authorization: `Bearer ${token}` }
				});
				const j = await res.json();
				if (!res.ok) throw new Error(j.error || 'Failed to load user');
				setUser(j);
			} catch (err) {
				setError(err.message);
			}
		})();
	}, [navigate]);

	function logout() {
		localStorage.removeItem('token');
		navigate('/login');
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-slate-100 font-[Poppins]">
			<main className="container mx-auto px-4 py-10">
				<section className="max-w-2xl mx-auto">
					<div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
						<h1 className="text-3xl font-bold mb-2">Dashboard ✨</h1>
						{error && <div className="mb-4 p-3 rounded-lg bg-rose-500/20 text-rose-100 border border-rose-500/30">{error}</div>}
						{!user ? (
							<p className="text-slate-300">Loading...</p>
						) : (
							<div>
								<p className="text-slate-300 mb-6">Welcome to your dreamy dashboard.</p>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="rounded-xl bg-white/5 border border-white/10 p-4">
										<h2 className="font-semibold text-slate-200">Your details</h2>
										<ul className="mt-2 text-slate-300 text-sm">
											<li><span className="text-slate-400">Username:</span> {user.username}</li>
											<li><span className="text-slate-400">Email:</span> {user.email}</li>
											<li><span className="text-slate-400">User ID:</span> {user._id}</li>
										</ul>
									</div>
									<div className="rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-indigo-500/30 border border-white/10 p-4">
										<h2 className="font-semibold text-slate-200">Status</h2>
										<p className="mt-2 text-slate-100">Logged in and secure. Enjoy the vibes 🌙</p>
									</div>
								</div>
								<button onClick={logout} className="mt-8 px-5 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition">Log out</button>
							</div>
						)}
					</div>
				</section>
			</main>
			<footer className="text-center text-slate-400 text-sm py-8">Made with ❤ Dreamy UI</footer>
		</div>
	);
}
