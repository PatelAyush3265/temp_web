import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';

function isAuthed() {
	return Boolean(localStorage.getItem('token'));
}

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Navigate to={isAuthed() ? '/dashboard' : '/login'} replace />} />
				<Route path="/signup" element={<Signup />} />
				<Route path="/login" element={<Login />} />
				<Route path="/dashboard" element={<Dashboard />} />
			</Routes>
		</BrowserRouter>
	);
}

createRoot(document.getElementById('root')).render(<App />);
