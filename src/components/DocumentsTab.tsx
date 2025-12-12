import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Search, Loader, Brain, Sparkles, Filter, X } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, getUserId } from '../types';

interface Doc {
    fileId: string;
    name: string;
    size: number;
    uploadDate: string;
    summary?: string;
    mimeType?: string;
}

export default function DocumentsTab() {
    const [docs, setDocs] = useState<Doc[]>([]);
    const [query, setQuery] = useState(''); // For RAG/Global Search
    const [localFilter, setLocalFilter] = useState(''); // For filtering the list
    const [searchResult, setSearchResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Selected Document State
    const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
    const [docQuestion, setDocQuestion] = useState('');
    const [docQaHistory, setDocQaHistory] = useState<Array<{ q: string, a: string }>>([]);
    const [docContent, setDocContent] = useState<string>('');
    const [loadingContent, setLoadingContent] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, []);

    // Filter docs locally
    const filteredDocs = docs.filter(d =>
        d.name.toLowerCase().includes(localFilter.toLowerCase())
    );

    const fetchDocuments = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/documents/list?userId=${getUserId()}`);
            setDocs(res.data);
            localStorage.setItem(`memoai_docs_${getUserId()}`, JSON.stringify(res.data));
        } catch (e) {
            console.warn("Backend list endpoint unavailable, falling back to local cache.");
            const cached = localStorage.getItem(`memoai_docs_${getUserId()}`);
            if (cached) setDocs(JSON.parse(cached));
        }
    }

    const loadDocumentContent = async (doc: Doc) => {
        const isPdf = doc.mimeType === 'application/pdf' || doc.name.toLowerCase().endsWith('.pdf');

        if (isPdf) {
            setDocContent("Note: PDF content cannot be viewed directly as text.\nYou can still ask questions about it or extract facts using the AI tools above.");
            return;
        }

        setLoadingContent(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/documents/content`, {
                params: { userId: getUserId(), fileId: doc.fileId }
            });
            setDocContent(res.data.content || "No content returned.");
        } catch (e) {
            console.error(e);
            setDocContent("Failed to load document content.");
        } finally {
            setLoadingContent(false);
        }
    };

    const handleSelectDoc = (doc: Doc) => {
        if (selectedDoc?.fileId === doc.fileId) {
            setSelectedDoc(null);
            setDocContent("");
            return;
        }
        setSelectedDoc(doc);
        setDocQaHistory([]);
        setDocQuestion('');
        setDocContent(''); // Clear previous content
    };

    const handleSummarize = async () => {
        if (!selectedDoc) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/documents/summarize`, {
                userId: getUserId(),
                docIdentifier: selectedDoc.fileId
            });
            // Show summary in Q&A history style or specialized block
            setDocQaHistory(prev => [...prev, { q: "Summarize this document", a: res.data.summary }]);
        } catch (e) {
            console.error(e);
            alert("Failed to summarize.");
        } finally {
            setLoading(false);
        }
    };

    const handleAskQuestion = async () => {
        if (!query.trim()) return;
        setSearchResult(null);
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/ask-bucket`, {
                params: { userId: getUserId(), q: query }
            });
            setSearchResult(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAskDocQuestion = async () => {
        if (!docQuestion.trim() || !selectedDoc) return;
        const currentQ = docQuestion;
        setDocQuestion('');
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/documents/ask`, {
                userId: getUserId(),
                documentId: selectedDoc.fileId,
                question: currentQ
            });
            setDocQaHistory(prev => [...prev, { q: currentQ, a: res.data.answer }]);
        } catch (e) {
            console.error(e);
            alert("Failed to get answer.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyzeDocument = async () => {
        if (!selectedDoc) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/documents/analyze`, {
                userId: getUserId(),
                documentId: selectedDoc.fileId
            });
            alert(`Analysis complete! ${res.data.factsExtracted} facts saved.`);
        } catch (e) {
            console.error(e);
            alert("Analysis failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', getUserId());
        try {
            await axios.post(`${API_BASE_URL}/upload`, formData);
            await fetchDocuments();
        } catch (error) {
            console.error(error);
            alert('Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Header / Search Area */}
            <div className="glass-panel p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold gradient-text">Knowledge Base</h2>
                        <p className="text-sm text-gray-400">{docs.length} documents indexed</p>
                    </div>
                    <label className="btn-primary flex items-center gap-2 cursor-pointer bg-indigo-600 hover:bg-indigo-700">
                        {uploading ? <Loader className="animate-spin" size={18} /> : <Upload size={18} />}
                        Upload
                        <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>

                <div className="flex gap-4">
                    {/* Global AI Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 text-gray-500" size={20} />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAskQuestion()}
                            placeholder="Ask AI across all documents..."
                            className="pl-10 input-field w-full"
                        />
                        <button
                            onClick={handleAskQuestion}
                            disabled={loading}
                            className="absolute right-2 top-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white"
                        >
                            Ask AI
                        </button>
                    </div>

                    {/* Local Filter */}
                    <div className="w-1/3 relative">
                        <Filter className="absolute left-3 top-3 text-gray-500" size={20} />
                        <input
                            value={localFilter}
                            onChange={e => setLocalFilter(e.target.value)}
                            placeholder="Filter by name..."
                            className="pl-10 input-field w-full"
                        />
                    </div>
                </div>

                {/* AI Global Search Result */}
                <AnimatePresence>
                    {searchResult && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-indigo-900/30 rounded-lg p-4 border border-indigo-500/30 relative"
                        >
                            <button onClick={() => setSearchResult(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white"><X size={16} /></button>
                            <h3 className="text-sm font-bold text-indigo-300 mb-2 flex items-center gap-2"><Sparkles size={16} /> AI Answer</h3>
                            <p className="text-gray-200">{searchResult.answer}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4">

                {/* Documents Grid */}
                <div className={`flex-1 overflow-y-auto ${selectedDoc ? 'md:w-1/2' : 'w-full'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                        {filteredDocs.length === 0 ? (
                            <div className="col-span-full text-center p-8 text-gray-500">No matching documents.</div>
                        ) : (
                            filteredDocs.map((doc) => (
                                <motion.div
                                    key={doc.fileId}
                                    layout
                                    onClick={() => handleSelectDoc(doc)}
                                    className={`glass-panel p-5 cursor-pointer transition-all hover:bg-white/5 border ${selectedDoc?.fileId === doc.fileId ? 'border-indigo-500 bg-indigo-900/10' : 'border-transparent'}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-lg ${(doc.mimeType === 'application/pdf' || doc.name.endsWith('.pdf')) ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            <FileText size={24} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <h3 className="font-semibold text-white truncate" title={doc.name}>{doc.name}</h3>
                                            <p className="text-xs text-gray-400 mt-1">{(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploadDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Selected Document Details Panel (Visible when selected) */}
                <AnimatePresence>
                    {selectedDoc && (
                        <motion.div
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            className="w-full md:w-[450px] glass-panel p-0 flex flex-col overflow-hidden border-l border-white/10"
                        >
                            {/* Panel Header */}
                            <div className="p-4 border-b border-white/10 bg-indigo-900/20 flex justify-between items-center">
                                <h3 className="font-bold text-white truncate flex-1" title={selectedDoc.name}>{selectedDoc.name}</h3>
                                <button onClick={() => setSelectedDoc(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                            </div>

                            {/* Actions */}
                            <div className="p-4 grid grid-cols-2 gap-2 border-b border-white/10">
                                <button onClick={handleSummarize} disabled={loading} className="btn-secondary text-xs py-2 flex items-center justify-center gap-2">
                                    <Sparkles size={14} /> Summarize
                                </button>
                                <button onClick={handleAnalyzeDocument} disabled={loading} className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded py-2 text-xs font-medium flex items-center justify-center gap-2 transition-colors">
                                    <Brain size={14} /> Extract Facts
                                </button>
                                <button
                                    onClick={() => !docContent ? loadDocumentContent(selectedDoc) : setDocContent('')}
                                    className={`col-span-2 py-2 text-xs rounded font-medium border transition-colors flex items-center justify-center gap-2 ${docContent ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'}`}
                                >
                                    <FileText size={14} /> {docContent ? 'Hide Content' : 'View Content / Notes'}
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {loading ? <div className="text-center py-4"><Loader className="animate-spin mx-auto text-gray-400" /></div> : null}

                                {/* Q&A History (Includes Summary Results) */}
                                {docQaHistory.length > 0 && (
                                    <div className="space-y-4">
                                        {docQaHistory.map((qa, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <div className="text-xs font-medium text-gray-400 uppercase">{qa.q}</div>
                                                <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-200 leading-relaxed border border-white/5">{qa.a}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Raw Content View */}
                                {docContent && (
                                    <div className="space-y-2">
                                        <div className="text-xs font-bold text-gray-500 uppercase">Document Content</div>
                                        {loadingContent ? (
                                            <div className="flex items-center gap-2 text-sm text-gray-400"><Loader className="animate-spin" size={14} /> Loading...</div>
                                        ) : (
                                            <div className="bg-black/30 rounded border border-white/10 p-3 text-xs font-mono text-gray-400 whitespace-pre-wrap max-h-96 overflow-auto">
                                                {docContent}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Q&A Input */}
                            <div className="p-4 border-t border-white/10 bg-gray-900/50">
                                <div className="relative">
                                    <input
                                        value={docQuestion}
                                        onChange={e => setDocQuestion(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAskDocQuestion()}
                                        placeholder="Ask about this doc..."
                                        className="input-field w-full pr-12"
                                        disabled={loading}
                                    />
                                    <button
                                        onClick={handleAskDocQuestion}
                                        disabled={!docQuestion.trim() || loading}
                                        className="absolute right-1 top-1 bottom-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold disabled:opacity-50"
                                    >
                                        Ask
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
