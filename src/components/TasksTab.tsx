import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Plus, List, BarChart, Calendar } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, getUserId } from '../types';
import type { Task } from '../types';

export default function TasksTab() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [newTask, setNewTask] = useState('');
    const [newDesc, setNewDesc] = useState('');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/task-summary?userId=${getUserId()}&weekStart=2025-01-01&weekEnd=2025-12-31`);
            setTasks(res.data.tasks || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleExportToCalendar = () => {
        const url = `${API_BASE_URL}/calendar/export?userId=${getUserId()}`;
        window.open(url, '_blank');
    };

    const handleCreateTask = async () => {
        if (!newTask.trim()) return;
        try {
            await axios.post(`${API_BASE_URL}/task`, {
                userId: getUserId(),
                title: newTask,
                description: newDesc,
                status: 'todo'
            });
            setNewTask('');
            setNewDesc('');
            fetchTasks();
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateStatus = async (task: Task) => {
        // Cycle: todo -> in_progress -> done -> todo
        const nextStatusMap: Record<string, string> = {
            'todo': 'in_progress',
            'in_progress': 'done',
            'done': 'todo'
        };
        const nextStatus = nextStatusMap[task.status] || 'todo';

        // Optimistic Update
        const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: nextStatus as any } : t);
        setTasks(updatedTasks);

        try {
            // We'll trust the backend has/will have a PUT endpoint or we use POST with ID to upsert
            // For now, let's assume we need to add this capability. 
            // Calling the generic /task endpoint might work if it supports upsert, otherwise we need a new one.
            // We'll call a specific update endpoint we plan to make.
            await axios.put(`${API_BASE_URL}/task/${task.id}`, {
                status: nextStatus,
                userId: getUserId()
            });
        } catch (e) {
            console.error("Failed to update task", e);
            // Revert
            fetchTasks();
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Header */}
            <div className="glass-panel p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold gradient-text flex items-center gap-2">
                    <List className="text-pink-400" />
                    Task Command Center
                </h2>
                <div className="text-sm text-gray-400 flex items-center gap-2">
                    <BarChart size={16} />
                    {tasks.filter(t => t.status === 'done').length} / {tasks.length} Completed
                </div>
            </div>

            {/* Input */}
            <div className="glass-panel p-4 flex flex-col gap-3">
                <input
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    placeholder="Task Title (e.g. 'Review quarterly report')"
                    className="bg-black/20 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-indigo-500 transition-colors"
                />
                <div className="flex gap-2">
                    <input
                        value={newDesc}
                        onChange={e => setNewDesc(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateTask()}
                        placeholder="Description (optional)"
                        className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:border-indigo-500 transition-colors"
                    />
                    <button
                        onClick={handleCreateTask}
                        disabled={!newTask.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} /> Add Task
                    </button>
                    <button
                        onClick={handleExportToCalendar}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        title="Export all tasks to calendar (ICS file)"
                    >
                        <Calendar size={18} /> Export
                    </button>
                </div>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto space-y-2">
                {loading ? (
                    <div className="text-center p-8 text-gray-400">Syncing tasks...</div>
                ) : tasks.length === 0 ? (
                    <div className="text-center p-8 text-gray-400">All caught up! Enjoy your day.</div>
                ) : (
                    tasks.map((task, idx) => (
                        <motion.div
                            key={task.id || idx}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass-panel p-3 flex items-center gap-3 hover:bg-white/5 transition-colors group"
                        >
                            <button
                                onClick={() => handleUpdateStatus(task)}
                                className="text-gray-500 hover:text-indigo-400 transition-colors mt-1"
                                title="Click to cycle status"
                            >
                                {task.status === 'done' ? (
                                    <CheckCircle className="text-green-500" />
                                ) : task.status === 'in_progress' ? (
                                    <div className="w-5 h-5 rounded-full border-2 border-yellow-500 flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse" />
                                    </div>
                                ) : (
                                    <Circle />
                                )}
                            </button>
                            <div className="flex-1">
                                <p className={`${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                                    {task.title}
                                </p>
                                {task.description && (
                                    <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                                )}
                            </div>
                            <button
                                onClick={() => handleUpdateStatus(task)}
                                className={`text-xs px-2 py-1 rounded uppercase font-bold tracking-wider transition-colors border ${task.status === 'done' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                    task.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                        'bg-gray-800 text-gray-500 border-gray-700'
                                    }`}
                            >
                                {task.status.replace('_', ' ')}
                            </button>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
