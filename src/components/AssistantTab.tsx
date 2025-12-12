import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, getUserId } from '../types';
import type { ChatMessage } from '../types';

export default function AssistantTab() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: "Hello! I'm your Second Brain. I recall your past tasks, documents, and meetings. How can I help you today?", timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    // Load chat history on mount
    useEffect(() => {
        const loadHistory = async () => {
            try {
                // We use the general memory endpoint which returns episodic memory (chat history)
                // Filter for current session if possible, but 'getMemory' returns all session data sorted.
                // In a real app we might have a specific /chat/history endpoint, but this works given our backend structure.
                const res = await axios.get(`${API_BASE_URL}/memory?userId=${getUserId()}`);

                if (res.data && res.data.episodic) {
                    const history: ChatMessage[] = res.data.episodic
                        .filter((m: any) => m.content.startsWith('User: ') || m.content.startsWith('AI: '))
                        .map((m: any) => {
                            const isUser = m.content.startsWith('User: ');
                            return {
                                role: isUser ? 'user' : 'assistant',
                                content: m.content.replace(/^(User|AI): /, ''),
                                timestamp: new Date(m.timestamp)
                            };
                        });

                    if (history.length > 0) {
                        setMessages(history);
                    }
                }
            } catch (e) {
                console.error("Failed to load history", e);
            }
        };
        loadHistory();
    }, []);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: ChatMessage = { role: 'user', content: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Use dynamic userId
            const response = await axios.post(`${API_BASE_URL}/chat`, {
                userId: getUserId(),
                sessionId: 'session-1',
                message: userMsg.content
            });

            const aiMsg: ChatMessage = {
                role: 'assistant',
                content: response.data.response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error connecting to my brain.", timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisplayBriefing = async () => {
        try {
            setIsLoading(true);
            const res = await axios.get(`${API_BASE_URL}/assistant/briefing?userId=${getUserId()}`);
            const data = res.data;

            const briefingMsg = `
**${data.greeting}**
${data.focus}
*Top Priority:* ${data.topPriority}
_${data.wisdom}_
(${data.weather})
         `;

            setMessages(prev => [...prev, { role: 'assistant', content: briefingMsg, timestamp: new Date() }]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Header Area */}
            <div className="flex items-center justify-between p-4 glass-panel mb-2">
                <div>
                    <h2 className="text-xl font-bold gradient-text">AI Assistant</h2>
                    <p className="text-sm text-gray-400">Powered by Episodic & Semantic Memory</p>
                </div>
                <button
                    onClick={handleDisplayBriefing}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-colors"
                >
                    <Sparkles size={16} />
                    Daily Briefing
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto glass-panel p-4 space-y-4">
                <AnimatePresence>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] p-4 rounded-xl ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-none'
                                    : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none'
                                    }`}
                            >
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                                <div className="text-[10px] opacity-50 mt-1 text-right">
                                    {msg.timestamp.toLocaleTimeString()}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 px-4 py-2 rounded-xl rounded-tl-none border border-gray-700 flex gap-2 items-center">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="glass-panel p-4 flex gap-4 items-end">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Ask me anything..."
                    className="flex-1 min-h-[50px] max-h-[150px] resize-none bg-transparent border-gray-700 focus:border-indigo-500"
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
}
