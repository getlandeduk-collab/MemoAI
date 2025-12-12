import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Brain } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../types';

interface AuthScreenProps {
    onLogin: (userId: string, userName: string) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const endpoint = isLogin ? '/login' : '/signup';
            const payload = isLogin
                ? { email, password }
                : { email, password, name };

            const res = await axios.post(`${API_BASE_URL}${endpoint}`, payload);

            if (res.data.userId) {
                // Save to local storage for persistence
                if (typeof window !== 'undefined') {
                    localStorage.setItem('memoai_user_id', res.data.userId);
                    localStorage.setItem('memoai_user_name', res.data.name);
                    localStorage.setItem('memoai_user_email', res.data.email);
                }
                onLogin(res.data.userId, res.data.name);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-deep)] p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md glass-panel p-8 relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-indigo-500/30">
                        <Brain size={32} />
                    </div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        {isLogin ? 'Welcome Back' : 'Join Second Brain'}
                    </h1>
                    <p className="text-gray-400 mt-2">
                        {isLogin ? 'Access your digital memory' : 'Start organizing your life with AI'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                placeholder="Your Name"
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                {isLogin ? 'Sign In' : 'Create Account'}
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-400 text-sm">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                        >
                            {isLogin ? 'Sign up' : 'Log in'}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
