import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';

export default function Login() {
	const navigate = useNavigate();
	const [form, setForm] = useState({ username: '', password: '' });
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	async function onSubmit(e) {
		e.preventDefault();
		setError('');
		setLoading(true);
		try {
			const res = await fetch('/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});
			const j = await res.json();
			if (!res.ok) throw new Error(j.error || 'Failed to login');
			localStorage.setItem('token', j.token);
			navigate('/dashboard');
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<AuthLayout
			title="Welcome back"
			footer={<p className="mt-6 text-sm text-slate-300">New here? <Link to="/signup" className="text-indigo-300 hover:text-indigo-200 underline">Create an account</Link></p>}
		>
			{error && <div className="mb-4 p-3 rounded-lg bg-rose-500/20 text-rose-100 border border-rose-500/30">{error}</div>}
			<form className="space-y-4" onSubmit={onSubmit}>
				<div>
					<label className="block mb-1 text-sm text-slate-300">Username</label>
					<input className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" value={form.username} onChange={(e)=>setForm({...form,username:e.target.value})} placeholder="yourname" />
				</div>
				<div>
					<label className="block mb-1 text-sm text-slate-300">Password</label>
					<input type="password" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} placeholder="••••••••" />
				</div>
				<button disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500 hover:opacity-90 transition font-semibold">{loading?'Logging in...':'Log in'}</button>
			</form>
		</AuthLayout>
	);
}
