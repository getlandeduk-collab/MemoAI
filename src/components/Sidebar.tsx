import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';

interface SidebarProps {
    tabs: any[];
    activeTab: string;
    setActiveTab: (id: string) => void;
    currentUser: { name: string; id: string } | null;
    onLogout: () => void;
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
}

export default function Sidebar({
    tabs, activeTab, setActiveTab, currentUser, onLogout, isOpen, setIsOpen
}: SidebarProps) {
    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <motion.div
                className={`fixed md:relative z-50 h-full bg-[#0a0a0c]/90 backdrop-blur-xl border-r border-white/5 flex flex-col transition-all duration-300 ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20 lg:w-64'
                    }`}
                initial={false}
            >
                {/* Logo Area */}
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                        <span className="font-bold text-white text-lg">M</span>
                    </div>
                    <span className="font-outfit font-bold text-xl tracking-tight text-white md:hidden lg:block">
                        Memo<span className="text-indigo-400">AI</span>
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-4">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    if (window.innerWidth < 768) setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                                    ? 'bg-white/10 text-white shadow-inner'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={`shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'group-hover:text-indigo-300'}`} />
                                <span className="font-medium truncate md:hidden lg:block">{tab.label}</span>

                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 border border-indigo-500/30 rounded-xl"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-white/5 bg-black/20">
                    {currentUser ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-inner shrink-0">
                                {currentUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden md:hidden lg:block flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                                <p className="text-xs text-green-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Online
                                </p>
                            </div>
                            <button
                                onClick={onLogout}
                                title="Log out"
                                className="p-2 text-gray-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors md:hidden lg:block"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="animate-pulse h-10 w-full bg-white/5 rounded-lg" />
                    )}

                    {/* Mobile Logout (condensed) */}
                    {currentUser && (
                        <button
                            onClick={onLogout}
                            className="mt-2 w-full flex items-center justify-center p-2 text-gray-400 hover:text-white md:flex lg:hidden hidden"
                        >
                            <LogOut size={20} />
                        </button>
                    )}
                </div>
            </motion.div>
        </>
    );
}
