import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            const response = await fetch('/api/auth/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('isAdmin', 'true');
                localStorage.setItem('token', data.access_token);
                navigate('/admin');
            } else {
                setError(data.detail || 'Invalid Admin Credentials');
            }
        } catch (err) {
            setError('Backend connection failed. Is the server running?');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md bg-slate-900 rounded-[32px] border border-white/10 p-10 shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 blur-3xl -ml-16 -mt-16 rounded-full" />
                
                <div className="flex flex-col items-center mb-10 relative">
                    <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                        <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight text-center">Admin Portal</h1>
                    <p className="text-slate-500 text-sm mt-2 font-bold uppercase tracking-widest text-center">BuyPlot Safe</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6 relative">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-4 rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Admin Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-800 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-600"
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-600"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-white hover:bg-slate-200 text-slate-950 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xl shadow-white/5 mt-4"
                    >
                        Enter Dashboard <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <div className="mt-10 text-center relative">
                    <button 
                        onClick={() => navigate('/marketplace')}
                        className="text-xs text-slate-600 hover:text-white font-bold transition-colors uppercase tracking-widest"
                    >
                        ← Back to Marketplace
                    </button>
                </div>
            </div>
            
            <p className="mt-8 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                Protected by Kerala Land Intelligence Protocols
            </p>
        </div>
    );
};

export default AdminLogin;
