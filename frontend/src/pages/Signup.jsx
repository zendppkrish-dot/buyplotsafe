import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Building } from 'lucide-react';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'buyer' // Default role
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        setError('');

        try {
            console.log('[DEBUG] Attempting signup for:', formData.email);

            // Register with FastAPI
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.name
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Save JWT and proceed
                localStorage.setItem('token', data.access_token);
                console.log('[DEBUG] Signup successful, token saved');
                navigate('/marketplace');
            } else {
                setError(data.detail || 'Registration failed');
            }
        } catch (err) {
            console.error('[SIGNUP ERROR]', err);
            setError('Connection failed. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-full h-full">
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-xl w-full max-w-md z-10">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">Create Account</h2>

                {error && <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            className="w-full bg-slate-800/50 border border-slate-600 text-white py-3 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            className="w-full bg-slate-800/50 border border-slate-600 text-white py-3 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            className="w-full bg-slate-800/50 border border-slate-600 text-white py-3 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-slate-300 text-sm mb-2 font-medium">I am a:</label>
                        <div className="flex gap-4">
                            <label className={`flex-1 cursor-pointer p-3 rounded-lg border text-center transition-all ${formData.role === 'buyer' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:bg-slate-800'}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="buyer"
                                    checked={formData.role === 'buyer'}
                                    onChange={handleChange}
                                    className="hidden"
                                />
                                Buyer
                            </label>
                            <label className={`flex-1 cursor-pointer p-3 rounded-lg border text-center transition-all ${formData.role === 'seller' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:bg-slate-800'}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="seller"
                                    checked={formData.role === 'seller'}
                                    onChange={handleChange}
                                    className="hidden"
                                />
                                Seller
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors mt-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 text-center text-slate-400">
                    Already have an account? <Link to="/login" className="text-emerald-400 hover:underline">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
