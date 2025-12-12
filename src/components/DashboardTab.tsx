import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Activity, Zap, Target,
    TrendingUp, Plus
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { API_BASE_URL, getUserId } from '../types';
import MemoryGraph from './MemoryGraph';

export default function DashboardTab() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [briefing, setBriefing] = useState<any>(null);
    const [quickInput, setQuickInput] = useState('');
    const [capturing, setCapturing] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const userId = getUserId();
            const [insightsRes, briefingRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/assistant/insights?userId=${userId}`),
                axios.get(`${API_BASE_URL}/assistant/briefing?userId=${userId}`)
            ]);
            setStats(insightsRes.data);
            setBriefing(briefingRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickCapture = async () => {
        if (!quickInput.trim()) return;
        setCapturing(true);
        try {
            await axios.post(`${API_BASE_URL}/assistant/quick-capture`, {
                userId: getUserId(),
                input: quickInput
            });
            setQuickInput('');
            fetchDashboardData(); // Refresh stats
            alert("Captured to your Second Brain!");
        } catch (e) {
            console.error(e);
        } finally {
            setCapturing(false);
        }
    };

    // Mock chart data if not enough real data exists
    const chartData = [
        { name: 'Mon', tasks: 3, focus: 45 },
        { name: 'Tue', tasks: 5, focus: 55 },
        { name: 'Wed', tasks: 8, focus: 75 },
        { name: 'Thu', tasks: 6, focus: 60 },
        { name: 'Fri', tasks: 9, focus: 85 },
        { name: 'Sat', tasks: 4, focus: 40 },
        { name: 'Sun', tasks: 2, focus: 30 },
    ];

    if (loading) return <div className="flex h-full items-center justify-center text-white">Loading Command Center...</div>;

    return (
        <div className="flex flex-col h-full gap-6 overflow-y-auto pr-2">
            {/* Welcome Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
                    </h1>
                    <p className="text-gray-400 mt-1">Here is your productivity overview</p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-2xl font-bold text-white">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-sm text-gray-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            {/* Hero Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Daily Focus Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="col-span-1 md:col-span-2 glass-panel p-6 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Target size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-indigo-400 mb-2 font-medium">
                            <Zap size={18} /> Daily Focus
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4 leading-snug">
                            {briefing?.focus || "Focus on clearing your backlog and setting specific goals."}
                        </h3>
                        <div className="flex gap-4 mt-6">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                                <p className="text-xs text-gray-400">Top Priority</p>
                                <p className="font-semibold text-white">{briefing?.topPriority || "Review Tasks"}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 hidden sm:block">
                                <p className="text-xs text-gray-400">Atmosphere</p>
                                <p className="font-semibold text-white">{briefing?.weather || "Clear Skies"}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Capture */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel p-6 flex flex-col justify-between bg-gradient-to-br from-indigo-600/20 to-purple-600/20"
                >
                    <div>
                        <div className="flex items-center gap-2 text-white mb-2 font-medium">
                            <Plus size={18} /> Quick Capture
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                            Dump raw thoughts. AI will sort them into Tasks or Memories.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <textarea
                            value={quickInput}
                            onChange={e => setQuickInput(e.target.value)}
                            placeholder="Buy milk, Remember that..."
                            className="w-full bg-black/20 border-0 rounded-lg p-3 text-sm focus:ring-1 focus:ring-indigo-400 resize-none h-24"
                        />
                        <button
                            onClick={handleQuickCapture}
                            disabled={capturing || !quickInput}
                            className="w-full py-2 bg-white text-indigo-900 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            {capturing ? 'Sorting...' : 'Save to Brain'}
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Analytics & Stats */}
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-2">
                <Activity className="text-pink-500" /> Performance Analytics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Stats Cards */}
                {[
                    { label: "Velocity", value: stats?.velocity || 12, sub: "+15%", icon: <TrendingUp size={12} className="mr-1" />, color: "text-green-400" },
                    { label: "Tasks Done", value: stats?.completedCount || 42, sub: "This Week", color: "text-gray-500" },
                    { label: "Memory Size", value: stats?.memorySize || 151, sub: "synapses", color: "text-purple-400" },
                    { label: "Rank", value: stats?.badges?.[0] || "Rising Star", sub: "", isGradient: true }
                ].map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + (idx * 0.1) }}
                        whileHover={{ scale: 1.05 }}
                        className="glass-panel p-4 flex flex-col justify-center items-center cursor-default bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <p className="text-gray-400 text-sm">{stat.label}</p>
                        <p className={`text-xl md:text-3xl font-bold mt-1 ${stat.isGradient ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500' : 'text-white'}`}>
                            {stat.value}
                        </p>
                        {stat.sub && (
                            <span className={`text-xs flex items-center mt-1 ${stat.color}`}>
                                {stat.icon} {stat.sub}
                            </span>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Charts & Graph */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                {/* 2D Trend */}
                <div className="glass-panel p-6 flex flex-col">
                    <h3 className="text-lg font-medium text-white mb-4">Productivity Trend</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="tasks" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3D Knowledge Graph */}
                <div className="glass-panel p-6 flex flex-col">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                        <Activity className="text-blue-400" /> Neural Nexus (3D)
                    </h3>
                    <div className="flex-1 min-h-0 relative">
                        <MemoryGraph />
                    </div>
                </div>
            </div>

        </div>
    );
}
