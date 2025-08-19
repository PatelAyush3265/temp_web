export default function AuthLayout({ title, children, footer }) {
	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-slate-100 font-[Poppins]">
			<main className="container mx-auto px-4 py-10">
				<section className="max-w-md mx-auto">
					<div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
						<h1 className="text-3xl font-bold mb-6">{title}</h1>
						{children}
						{footer}
					</div>
				</section>
			</main>
			<footer className="text-center text-slate-400 text-sm py-8">Made with ❤ Dreamy UI</footer>
		</div>
	);
}
