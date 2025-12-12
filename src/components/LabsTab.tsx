import { useState } from 'react';
import { Lightbulb, Mic, FileText, ArrowRight, MessageCircle, Brain, Loader, Sparkles } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, getUserId } from '../types';

export default function LabsTab() {
    const [meetingText, setMeetingText] = useState('');
    const [meetingTitle, setMeetingTitle] = useState('');
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

    const [question, setQuestion] = useState('');
    const [qaHistory, setQaHistory] = useState<Array<{ q: string, a: string }>>([]);

    const [activeTool, setActiveTool] = useState<'meeting' | 'incubator'>('meeting');
    const [ideaInput, setIdeaInput] = useState('');
    const [incubatorResult, setIncubatorResult] = useState<any>(null);
    const [incubating, setIncubating] = useState(false);

    const toggleRecording = async () => {
        // ... (existing toggleRecording logic) ...
        if (isRecording && mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            setMediaRecorder(null);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            let chunks: Blob[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                chunks = []; // clear

                // Transcribe
                setProcessing(true);
                try {
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'recording.webm');

                    const res = await axios.post(`${API_BASE_URL}/transcribe`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    if (res.data.text) {
                        setMeetingText(prev => prev + (prev ? '\n\n' : '') + res.data.text);
                    }
                } catch (e: any) {
                    console.error('Transcription failed', e);
                    alert(`Failed to transcribe audio: ${e.response?.data?.error || e.message}`);
                } finally {
                    setProcessing(false);
                }
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (e) {
            console.error('Could not start recording', e);
            alert('Could not access microphone.');
        }
    };

    const handleProcessMeeting = async () => {
        if (!meetingTitle.trim()) {
            alert("Please enter a meeting title first.");
            return;
        }
        if (!meetingText.trim()) {
            alert("Please provide a transcript (record or paste).");
            return;
        }

        setProcessing(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/assistant/process-meeting`, {
                userId: getUserId(),
                title: meetingTitle,
                transcript: meetingText
            });
            setResult(res.data);
        } catch (e: any) {
            console.error(e);
            alert(`Error processing meeting: ${e.response?.data?.error || e.message}`);
        } finally {
            setProcessing(false);
        }
    };

    const handleAskQuestion = async () => {
        if (!question.trim()) return;
        if (!meetingText.trim()) {
            alert("Please transcribe or paste a meeting first.");
            return;
        }

        setProcessing(true);
        const currentQuestion = question;
        setQuestion('');

        try {
            const res = await axios.post(`${API_BASE_URL}/assistant/ask-meeting`, {
                userId: getUserId(),
                transcript: meetingText,
                question: currentQuestion
            });

            setQaHistory(prev => [...prev, { q: currentQuestion, a: res.data.answer }]);
        } catch (e: any) {
            console.error(e);
            alert(`Error: ${e.response?.data?.error || e.message}`);
        } finally {
            setProcessing(false);
        }
    };

    const handleIncubate = async () => {
        if (!ideaInput.trim()) return;
        setIncubating(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/assistant/brainstorm`, {
                userId: getUserId(),
                idea: ideaInput
            });
            setIncubatorResult(res.data);
        } catch (e: any) {
            console.error(e);
            alert(`Error: ${e.message}`);
        } finally {
            setIncubating(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold gradient-text flex items-center gap-2">
                            <Lightbulb className="text-yellow-400" />
                            AI Labs
                        </h2>
                        <p className="text-gray-400 text-sm">Experimental features for high-velocity productivity.</p>
                    </div>
                </div>

                <div className="flex gap-2 bg-gray-900/50 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTool('meeting')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTool === 'meeting' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <div className="flex items-center gap-2"><Mic size={16} /> Meeting Assistant</div>
                    </button>
                    <button
                        onClick={() => setActiveTool('incubator')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTool === 'incubator' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <div className="flex items-center gap-2"><Brain size={16} /> Idea Incubator</div>
                    </button>
                </div>
            </div>

            <div className="glass-panel p-6 flex flex-col gap-4 flex-1 overflow-y-auto">
                {activeTool === 'meeting' ? (
                    <>
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                            <Mic className={isRecording ? "text-red-500 animate-pulse" : "text-gray-400"} />
                            Meeting Processor
                        </h3>

                        <div className="grid grid-cols-1 gap-4">
                            <input
                                value={meetingTitle}
                                onChange={e => setMeetingTitle(e.target.value)}
                                placeholder="Meeting Title (e.g. Weekly Sync)"
                                className="bg-gray-800 border border-gray-700 rounded p-2 text-white"
                            />

                            {/* Recording Controls */}
                            <div className="flex gap-2">
                                <button
                                    onClick={toggleRecording}
                                    className={`flex-1 py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${isRecording
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                        }`}
                                >
                                    <Mic size={20} />
                                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                                </button>
                            </div>

                            <textarea
                                value={meetingText}
                                onChange={e => setMeetingText(e.target.value)}
                                placeholder="Transcript will appear here... (or paste it)"
                                className="min-h-[200px] bg-gray-900 border border-gray-700 rounded p-4 font-mono text-sm text-gray-300"
                            />

                            <button
                                onClick={handleProcessMeeting}
                                disabled={processing}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Processing Notes...' : <>Analyze & Save Notes <ArrowRight size={18} /></>}
                            </button>
                        </div>

                        {result && (
                            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mt-4 animate-enter">
                                <div className="flex items-center gap-2 text-green-400 mb-2 font-bold">
                                    <FileText size={18} />
                                    Processing Complete!
                                </div>
                                <div className="space-y-2 text-sm text-gray-300">
                                    <p>📄 Document Created ID: <span className="text-indigo-400 font-mono">{result.documentId.split('/').pop()}</span></p>
                                    <p>✅ Tasks Extracted: {result.tasksCreated}</p>
                                    <div className="p-3 bg-gray-800 rounded border border-gray-700 italic">
                                        "{result.summarySnippet}"
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Q&A Section */}
                        {meetingText && (
                            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mt-4">
                                <div className="flex items-center gap-2 text-blue-400 mb-3 font-bold">
                                    <MessageCircle size={18} />
                                    Ask Questions About This Meeting
                                </div>

                                {/* Q&A History */}
                                {qaHistory.length > 0 && (
                                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                                        {qaHistory.map((qa, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <div className="bg-indigo-900/30 border border-indigo-700/50 rounded p-2">
                                                    <p className="text-xs text-indigo-400 font-semibold">Q:</p>
                                                    <p className="text-sm text-gray-200">{qa.q}</p>
                                                </div>
                                                <div className="bg-gray-800 border border-gray-700 rounded p-2 ml-4">
                                                    <p className="text-xs text-green-400 font-semibold">A:</p>
                                                    <p className="text-sm text-gray-300">{qa.a}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Question Input */}
                                <div className="flex gap-2">
                                    <input
                                        value={question}
                                        onChange={e => setQuestion(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAskQuestion()}
                                        placeholder="e.g., What was discussed at the start? When is the deadline?"
                                        className="flex-1 bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white placeholder-gray-500"
                                        disabled={processing}
                                    />
                                    <button
                                        onClick={handleAskQuestion}
                                        disabled={processing || !question.trim()}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Ask
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                            <Brain className="text-pink-500" />
                            Idea Incubator
                        </h3>
                        <p className="text-gray-400 text-sm">Turn a raw thought into a project plan, leveraging your existing knowledge base.</p>

                        <div className="flex gap-2 mt-4">
                            <input
                                value={ideaInput}
                                onChange={e => setIdeaInput(e.target.value)}
                                placeholder="e.g. Launch a personal finance blog..."
                                className="flex-1 bg-gray-800 border border-gray-700 rounded p-3 text-white focus:ring-2 focus:ring-pink-500 outline-none"
                            />
                            <button
                                onClick={handleIncubate}
                                disabled={incubating || !ideaInput.trim()}
                                className="bg-pink-600 hover:bg-pink-500 text-white font-bold px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {incubating ? <Loader className="animate-spin" /> : <Sparkles />}
                                Incubate
                            </button>
                        </div>

                        {incubatorResult && (
                            <div className="mt-6 space-y-6 animate-enter">
                                <div className="bg-gray-900 border border-pink-500/30 rounded-xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-purple-600"></div>
                                    <h2 className="text-2xl font-bold text-white mb-2">{incubatorResult.project}</h2>
                                    <p className="text-pink-300 italic mb-4">{incubatorResult.strategy}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Execution Plan</h4>
                                            <div className="space-y-3">
                                                {incubatorResult.plan.map((phase: string, i: number) => (
                                                    <div key={i} className="flex gap-3 items-start">
                                                        <div className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs font-bold shrink-0">
                                                            {i + 1}
                                                        </div>
                                                        <p className="text-gray-300 text-sm">{phase}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Suggested Tasks</h4>
                                            <div className="space-y-2">
                                                {incubatorResult.suggestedTasks.map((task: string, i: number) => (
                                                    <div key={i} className="flex gap-2 items-center p-2 bg-gray-800 rounded border border-gray-700 group cursor-pointer hover:border-pink-500/50 transition-colors">
                                                        <div className="w-2 h-2 rounded-full ring-2 ring-gray-600 group-hover:ring-pink-500 transition-all"></div>
                                                        <p className="text-gray-300 text-sm flex-1">{task}</p>
                                                        <button className="text-xs bg-gray-700 hover:bg-pink-600 px-2 py-1 rounded text-white transition-colors"
                                                            onClick={() => alert(`Ideally this adds "${task}" to your task list!`)}
                                                        >Add</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {incubatorResult.relatedResources && incubatorResult.relatedResources.length > 0 && (
                                        <div className="mt-6 pt-4 border-t border-gray-800">
                                            <p className="text-xs text-gray-500 mb-2">Connected Knowledge:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {incubatorResult.relatedResources.map((res: string, i: number) => (
                                                    <span key={i} className="px-2 py-1 bg-indigo-900/30 text-indigo-300 text-xs rounded border border-indigo-500/20">
                                                        📄 {res}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
