import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Users, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, getUserId } from '../types';

interface MeetingNote {
    fileId: string;
    name: string;
    uploadDate: string;
    content?: string;
    summary?: string;
    keyDecisions?: string[];
    actionItems?: string[];
}

export default function MeetingNotesTab() {
    const [meetings, setMeetings] = useState<MeetingNote[]>([]);
    const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            // Reverted to Document Files API
            const res = await axios.get(`${API_BASE_URL}/documents/list?userId=${getUserId()}`);
            console.log('Documents API response:', res.data);

            // API returns array directly or nested in .documents
            const allDocs = Array.isArray(res.data) ? res.data : (res.data.documents || []);

            // Filter to only show meeting notes (those with 'Meeting' in the name)
            const meetingDocs = allDocs.filter((doc: any) =>
                doc.name.toLowerCase().includes('meeting')
            );

            console.log('Meeting documents found:', meetingDocs.length);

            // Transform to MeetingNote format
            // Content needs to be loaded separately for files usually, but we'll init with what we have
            const mappedMeetings = meetingDocs.map((doc: any) => ({
                fileId: doc.fileId || doc.id,
                name: doc.name,
                // Use currentDate if uploadDate missing
                uploadDate: doc.uploadDate || new Date().toISOString(),
                content: '', // Will load on demand or effectively
                summary: '', // Will parse from content
            }));

            setMeetings(mappedMeetings);

            // Background load content for these meetings
            mappedMeetings.forEach((m: MeetingNote) => loadMeetingContent(m));

        } catch (e) {
            console.error('Error fetching meetings:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadMeetingContent = async (meeting: MeetingNote) => {
        try {
            const contentRes = await axios.get(`${API_BASE_URL}/documents/content?userId=${getUserId()}&fileId=${meeting.fileId}`);
            const textContent = contentRes.data.content || contentRes.data;

            if (typeof textContent === 'string') {
                // Parse the markdown content to extract Summary, Decisions, Actions
                const summaryMatch = textContent.match(/## Summary\n([\s\S]*?)(?=\n##|$)/);
                const decisionsMatch = textContent.match(/## Key Decisions\n([\s\S]*?)(?=\n##|$)/);
                const actionsMatch = textContent.match(/## Action Items\n([\s\S]*?)(?=\n##|$)/);

                const summary = summaryMatch ? summaryMatch[1].trim() : '';

                const keyDecisions = decisionsMatch
                    ? decisionsMatch[1].split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*/, '').trim())
                    : [];

                const actionItems = actionsMatch
                    ? actionsMatch[1].split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*\[.*?\]\s*/, '').trim())
                    : [];

                setMeetings(prev => prev.map(m =>
                    m.fileId === meeting.fileId ? {
                        ...m,
                        content: textContent,
                        summary,
                        keyDecisions,
                        actionItems
                    } : m
                ));
            }
        } catch (e) {
            console.error('Error loading meeting content:', e);
        }
    };

    const toggleExpand = (meetingId: string) => {
        setExpandedMeeting(expandedMeeting === meetingId ? null : meetingId);
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="flex flex-col h-full gap-4 p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileText className="text-indigo-400" size={28} />
                    <h2 className="text-2xl font-bold text-white">Meeting Notes</h2>
                </div>
                <div className="text-sm text-gray-400">
                    {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} recorded
                </div>
            </div>

            {/* Meeting List */}
            <div className="flex-1 overflow-y-auto space-y-3">
                {loading && meetings.length === 0 ? (
                    <div className="text-center p-8 text-gray-400">Loading meetings...</div>
                ) : meetings.length === 0 ? (
                    <div className="glass-panel p-8 text-center">
                        <FileText className="mx-auto mb-4 text-gray-600" size={48} />
                        <p className="text-gray-400 mb-2">No meeting notes found</p>
                        <p className="text-sm text-gray-500">
                            Processed meetings will appear here as files
                        </p>
                    </div>
                ) : (
                    meetings.map((meeting) => {
                        const isExpanded = expandedMeeting === meeting.fileId;

                        return (
                            <motion.div
                                key={meeting.fileId}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-panel overflow-hidden"
                            >
                                {/* Meeting Header */}
                                <button
                                    onClick={() => toggleExpand(meeting.fileId)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-start gap-3 flex-1 text-left">
                                        <Users className="text-indigo-400 flex-shrink-0 mt-1" size={20} />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-white mb-1">
                                                {meeting.name.replace('.md', '').replace(/^Meeting-/, '').replace(/-\d+$/, '').replace(/-/g, ' ')}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Calendar size={14} />
                                                {formatDate(meeting.uploadDate)}
                                            </div>
                                        </div>
                                    </div>
                                    {isExpanded ? (
                                        <ChevronUp className="text-gray-400" size={20} />
                                    ) : (
                                        <ChevronDown className="text-gray-400" size={20} />
                                    )}
                                </button>

                                {/* Meeting Content */}
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-white/10"
                                    >
                                        <div className="p-4 space-y-4">
                                            {/* Summary */}
                                            {meeting.summary && (
                                                <div className="bg-white/5 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Sparkles className="text-yellow-400" size={16} />
                                                        <span className="text-sm font-semibold text-gray-300">
                                                            Summary
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-300 leading-relaxed">
                                                        {meeting.summary}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Key Decisions */}
                                            {meeting.keyDecisions && meeting.keyDecisions.length > 0 && (
                                                <div className="bg-white/5 rounded-lg p-4">
                                                    <h4 className="text-sm font-semibold text-gray-300 mb-2">
                                                        Key Decisions
                                                    </h4>
                                                    <ul className="text-sm text-gray-300 space-y-1">
                                                        {meeting.keyDecisions.map((decision, i) => (
                                                            <li key={i}>• {decision}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Action Items */}
                                            {meeting.actionItems && meeting.actionItems.length > 0 && (
                                                <div className="bg-white/5 rounded-lg p-4">
                                                    <h4 className="text-sm font-semibold text-gray-300 mb-2">
                                                        Action Items
                                                    </h4>
                                                    <ul className="text-sm text-gray-300 space-y-1">
                                                        {meeting.actionItems.map((item, i) => (
                                                            <li key={i}>• {item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Full Content */}
                                            <div className="bg-white/5 rounded-lg p-4">
                                                <h4 className="text-sm font-semibold text-gray-300 mb-2">
                                                    Full Transcript / Notes
                                                </h4>
                                                <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                                                    {meeting.content || 'Loading content...'}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
