import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle, Circle, Clock, Plus, X } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, getUserId } from '../types';
import type { Task } from '../types';

export default function CalendarTab() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(false);

    // New Task State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [isAdding, setIsAdding] = useState(false);

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

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const getTasksForDate = (date: Date) => {
        return tasks.filter(task => {
            const targetDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
            return targetDate.toDateString() === date.toDateString();
        });
    };

    const handleAddTask = async () => {
        if (!selectedDate || !newTaskTitle.trim()) return;

        try {
            const res = await axios.post(`${API_BASE_URL}/task`, {
                userId: getUserId(),
                title: newTaskTitle,
                description: newTaskDesc,
                status: 'todo',
                dueDate: selectedDate.toISOString()
            });

            setTasks(prev => [...prev, res.data]);
            setNewTaskTitle('');
            setNewTaskDesc('');
            setIsAdding(false);
        } catch (e) {
            console.error(e);
            alert("Failed to create task");
        }
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    };

    // Generate calendar days
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const calendarDays: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    }

    const selectedDayTasks = selectedDate ? getTasksForDate(selectedDate) : [];
    const today = new Date();

    return (
        <div className="flex flex-col h-full gap-4 p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <CalendarIcon className="text-indigo-400" size={28} />
                    <h2 className="text-2xl font-bold text-white">Calendar View</h2>
                </div>
                <button
                    onClick={goToToday}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    Today
                </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Calendar Grid */}
                <div className="lg:col-span-2 glass-panel p-6">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={previousMonth}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="text-white" size={24} />
                        </button>
                        <h3 className="text-xl font-bold text-white">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h3>
                        <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <ChevronRight className="text-white" size={24} />
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((date, index) => {
                            if (!date) {
                                return <div key={`empty-${index}`} className="aspect-square" />;
                            }

                            const dayTasks = getTasksForDate(date);
                            const isToday = date.toDateString() === today.toDateString();
                            const isSelected = selectedDate?.toDateString() === date.toDateString();
                            const hasTasks = dayTasks.length > 0;

                            return (
                                <motion.button
                                    key={date.toISOString()}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { setSelectedDate(date); setIsAdding(false); }}
                                    className={`
                                        aspect-square p-2 rounded-lg transition-all relative
                                        ${isToday ? 'ring-2 ring-indigo-500' : ''}
                                        ${isSelected ? 'bg-indigo-600' : 'bg-white/5 hover:bg-white/10'}
                                    `}
                                >
                                    <div className="text-sm font-medium text-white">
                                        {date.getDate()}
                                    </div>
                                    {hasTasks && (
                                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                                            {dayTasks.slice(0, 3).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-1 h-1 rounded-full bg-indigo-400"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Day Tasks */}
                <div className="glass-panel p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Clock size={20} className="text-indigo-400" />
                            {selectedDate ? selectedDate.toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric'
                            }) : 'Select a date'}
                        </h3>
                        {selectedDate && !isAdding && (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded flex items-center gap-1"
                            >
                                <Plus size={16} /> Add Task
                            </button>
                        )}
                    </div>

                    {/* Add Task Form */}
                    {isAdding && selectedDate && (
                        <div className="bg-gray-800/50 p-4 rounded-lg mb-4 border border-indigo-500/30 animate-enter">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-indigo-400 uppercase">New Task</span>
                                <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-white"><X size={14} /></button>
                            </div>
                            <input
                                autoFocus
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                placeholder="Task title..."
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white mb-2"
                            />
                            <textarea
                                value={newTaskDesc}
                                onChange={e => setNewTaskDesc(e.target.value)}
                                placeholder="Description (optional)..."
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white mb-2 h-20 resize-none"
                            />
                            <button
                                onClick={handleAddTask}
                                disabled={!newTaskTitle.trim()}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded text-sm font-bold disabled:opacity-50"
                            >
                                Save Task
                            </button>
                        </div>
                    )}

                    <div className="space-y-2 max-h-[600px] overflow-y-auto flex-1">
                        {loading ? (
                            <div className="text-center text-gray-400 py-8">Loading...</div>
                        ) : selectedDayTasks.length === 0 && !isAdding ? (
                            <div className="text-center text-gray-400 py-8">
                                {selectedDate ? 'No tasks for this day' : 'Click a date to see tasks'}
                            </div>
                        ) : (
                            selectedDayTasks.map((task) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        {task.status === 'done' ? (
                                            <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={18} />
                                        ) : (
                                            <Circle className="text-gray-400 flex-shrink-0 mt-0.5" size={18} />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-medium ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-white'}`}>
                                                {task.title}
                                            </div>
                                            {task.description && (
                                                <div className="text-sm text-gray-400 mt-1">
                                                    {task.description}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`
                                                    text-xs px-2 py-1 rounded-full font-medium
                                                    ${task.status === 'todo' ? 'bg-gray-700 text-gray-300' : ''}
                                                    ${task.status === 'in_progress' ? 'bg-blue-900/50 text-blue-300' : ''}
                                                    ${task.status === 'done' ? 'bg-green-900/50 text-green-300' : ''}
                                                `}>
                                                    {task.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Task Summary */}
                    {selectedDate && selectedDayTasks.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-gray-400">
                                        {selectedDayTasks.filter(t => t.status === 'todo').length}
                                    </div>
                                    <div className="text-xs text-gray-500">Todo</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-blue-400">
                                        {selectedDayTasks.filter(t => t.status === 'in_progress').length}
                                    </div>
                                    <div className="text-xs text-gray-500">In Progress</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-400">
                                        {selectedDayTasks.filter(t => t.status === 'done').length}
                                    </div>
                                    <div className="text-xs text-gray-500">Done</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
