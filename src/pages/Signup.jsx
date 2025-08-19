import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';

export default function Signup() {
	const navigate = useNavigate();
	const [form, setForm] = useState({ email: '', username: '', password: '', confirmPassword: '' });
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	async function onSubmit(e) {
		e.preventDefault();
		setError('');
		setLoading(true);
		try {
			if (form.password !== form.confirmPassword) {
				setError('Passwords do not match');
				return;
			}
			const res = await fetch('/api/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: form.email, username: form.username, password: form.password })
			});
			if (!res.ok) {
				const j = await res.json().catch(() => ({}));
				throw new Error(j.error || 'Failed to sign up');
			}
			navigate('/login');
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<AuthLayout
			title="Create your account"
			footer={<p className="mt-6 text-sm text-slate-300">Already have an account? <Link to="/login" className="text-indigo-300 hover:text-indigo-200 underline">Log in</Link></p>}
		>
			{error && <div className="mb-4 p-3 rounded-lg bg-rose-500/20 text-rose-100 border border-rose-500/30">{error}</div>}
			<form className="space-y-4" onSubmit={onSubmit}>
				<div>
					<label className="block mb-1 text-sm text-slate-300">Email</label>
					<input className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="you@example.com" />
				</div>
				<div>
					<label className="block mb-1 text-sm text-slate-300">Username</label>
					<input className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" value={form.username} onChange={(e)=>setForm({...form,username:e.target.value})} placeholder="yourname" />
				</div>
				<div>
					<label className="block mb-1 text-sm text-slate-300">Password</label>
					<input type="password" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} placeholder="••••••••" />
				</div>
				<div>
					<label className="block mb-1 text-sm text-slate-300">Confirm password</label>
					<input type="password" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" value={form.confirmPassword} onChange={(e)=>setForm({...form,confirmPassword:e.target.value})} placeholder="••••••••" />
				</div>
				<button disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500 hover:opacity-90 transition font-semibold">{loading?'Creating...':'Create account'}</button>
			</form>
		</AuthLayout>
	);
}
