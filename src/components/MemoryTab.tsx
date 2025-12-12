
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Calendar, Clock, Activity } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, getUserId } from '../types';

interface MemoryItem {
    id?: string;
    timestamp: string;
    content: string;
    type: 'episodic' | 'semantic' | 'procedural';
}

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MemoryTab() {
    const [activeTab, setActiveTab] = useState<'episodic' | 'semantic' | 'procedural'>('episodic');
    const [memories, setMemories] = useState<MemoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMemories();
    }, []);

    const fetchMemories = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/memory?userId=${getUserId()}`);
            const data = res.data;

            const episodic = (data.episodic || []).map((m: any) => ({ ...m, type: 'episodic' }));
            const semantic = (data.semantic || []).map((m: any) => ({ ...m, type: 'semantic' }));
            const procedural = (data.procedural || []).map((m: any) => ({ ...m, type: 'procedural' }));

            const all = [...episodic, ...semantic, ...procedural];
            setMemories(all);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredMemories = memories.filter(m => m.type === activeTab);

    // Analytics Calculation
    const episodicItems = memories.filter(m => m.type === 'episodic');
    const semanticItems = memories.filter(m => m.type === 'semantic');

    const chartData = episodicItems
        .filter(m => m.timestamp)
        .map(m => ({ date: new Date(m.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), timestamp: new Date(m.timestamp).getTime() }))
        .sort((a, b) => a.timestamp - b.timestamp)
        .reduce((acc: any[], curr) => {
            const last = acc[acc.length - 1];
            if (last && last.date === curr.date) {
                last.interactions += 1;
            } else {
                acc.push({
                    date: curr.date,
                    interactions: 1,
                    knowledge: semanticItems.length // Constant for now as we lack semantic history
                });
            }
            return acc;
        }, []);

    // Add cumulative growth (simulated for visual)
    let cumulative = 0;
    const growthData = chartData.map(d => {
        cumulative += d.interactions;
        return { ...d, growth: cumulative + semanticItems.length };
    });

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Header */}
            <div className="p-4 glass-panel">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-bold gradient-text flex items-center gap-2">
                            <Brain className="text-purple-400" />
                            Neural Memory Bank
                        </h2>
                        <p className="text-gray-400 text-xs mt-1">
                            Tracking {memories.length} neural pathways
                        </p>
                    </div>
                </div>

                {/* Memory Analytics Graph */}
                <div className="h-48 w-full mb-4 bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800 relative">
                    <p className="absolute top-2 left-4 text-xs font-bold text-gray-500 z-10">Memory Growth (Knowledge + Activity)</p>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={growthData}>
                            <defs>
                                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="growth" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorGrowth)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex gap-2 mt-2">

                    {[
                        { id: 'episodic', label: 'Timeline', icon: Clock },
                        { id: 'semantic', label: 'Facts', icon: Activity },
                        { id: 'procedural', label: 'Habits', icon: Calendar },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-gray-400 hover:bg-gray-800'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto space-y-4">
                {loading ? (
                    <div className="text-center p-8 text-gray-400">Loading neural pathways...</div>
                ) : filteredMemories.length === 0 ? (
                    <div className="text-center p-8 text-gray-400">No memories found in this sector.</div>
                ) : (
                    filteredMemories.map((mem, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass-panel p-4 border-l-4 border-l-indigo-500 flex flex-col gap-2"
                        >
                            <div className="flex justify-between items-start">
                                <span className="text-sm font-medium text-purple-400 uppercase tracking-wider">
                                    {mem.type}
                                </span>
                                {mem.timestamp && typeof mem.timestamp === 'string' && (
                                    <span className="text-xs text-gray-500">
                                        {new Date(mem.timestamp).toLocaleString()}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-200 whitespace-pre-wrap">
                                {(() => {
                                    const val = mem.content || (mem as any).value;
                                    if (typeof val === 'object') return JSON.stringify(val);
                                    return String(val || '');
                                })()}
                            </p>
                            {(mem as any).key && (
                                <span className="text-xs bg-gray-800 px-2 py-1 rounded w-fit text-gray-400">
                                    Key: {String((mem as any).key)}
                                </span>
                            )}
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
