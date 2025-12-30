import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Upload, CheckCircle, AlertCircle, Link as LinkIcon, Download } from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';

function AssessmentPage() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [assignmentData, setAssignmentData] = useState({});
    const [submitting, setSubmitting] = useState({});

    const user = getUser();

    useEffect(() => {
        fetchSession();
    }, [sessionId]);

    const fetchSession = async () => {
        try {
            const response = await api.get(`/student/session/${sessionId}`);
            setSession(response.data);
        } catch (error) {
            console.error('Error fetching session:', error);
            toast.error('Failed to load assessment details');
            navigate('/student');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignmentChange = (assignmentTitle, value) => {
        setAssignmentData({ ...assignmentData, [assignmentTitle]: value });
    };

    const handleFileChange = (assignmentTitle, file) => {
        setAssignmentData({ ...assignmentData, [assignmentTitle]: file });
    };

    const handleSubmit = async (assignment) => {
        const data = assignmentData[assignment.title];

        if (!data) {
            toast.error('Please provide a response before submitting');
            return;
        }

        setSubmitting({ ...submitting, [assignment.title]: true });

        try {
            const formData = new FormData();
            formData.append('sessionId', sessionId);
            formData.append('assignmentTitle', assignment.title);
            formData.append('assignmentType', assignment.type);

            if (assignment.type === 'file') {
                if (data instanceof FileList || Array.isArray(data)) {
                    // Handle multiple files
                    const files = Array.from(data);
                    if (files.length === 0) {
                        toast.error('Please select at least one file');
                        return;
                    }
                    files.forEach(file => {
                        formData.append('assignment', file);
                    });
                    formData.append('response', 'files');
                } else if (data instanceof File) {
                    formData.append('assignment', data);
                    formData.append('response', 'file');
                }
            } else {
                formData.append('response', data);
            }

            await api.post('/student/assignment', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Submitted successfully!');
            fetchSession();
            setAssignmentData({ ...assignmentData, [assignment.title]: null }); // Clear input
        } catch (error) {
            toast.error('Error submitting assignment: ' + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting({ ...submitting, [assignment.title]: false });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen w-full bg-black relative overflow-hidden flex flex-col text-white">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-soft-light"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Header */}
            <header className="relative z-10 backdrop-blur-xl border-b border-white/5 bg-black/20 p-4 md:p-6 sticky top-0">
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                    <button
                        onClick={() => navigate('/student')}
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Dashboard</span>
                    </button>
                    <div className="text-sm text-white/40">
                        {user.registerNumber}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full p-6 space-y-8 pb-20">

                {/* Overview Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider">
                        Day {session.dayId?.dayNumber} Assessment
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        {session.title}
                    </h1>
                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
                        <h2 className="text-lg font-semibold text-white/90 mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-400" />
                            Session Overview
                        </h2>
                        <p className="text-white/60 leading-relaxed">
                            {session.description || "No description provided for this session."}
                        </p>
                    </div>
                </motion.section>

                {/* Assignments Section */}
                <section className="space-y-6">
                    <h2 className="text-xl font-semibold text-white/90 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-blue-400" />
                        Submission Tasks
                    </h2>

                    <div className="grid gap-6">
                        {session.assignments && session.assignments.length > 0 ? (
                            session.assignments.map((assignment, idx) => {
                                const isSubmitted = session.assignmentsSubmitted?.includes(assignment.title);
                                const inputKey = assignment.title;

                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={cn(
                                            "p-6 rounded-2xl border transition-all relative overflow-hidden",
                                            isSubmitted
                                                ? "bg-green-500/5 border-green-500/20"
                                                : "bg-white/[0.03] border-white/10 hover:border-white/20"
                                        )}
                                    >
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-medium text-white/90 mb-1">
                                                        {assignment.title}
                                                    </h3>
                                                    <div className="text-xs text-white/40 uppercase tracking-wider font-semibold">
                                                        {assignment.type === 'file' ? 'File Submission' : 'Text Response'}
                                                    </div>
                                                </div>
                                                {isSubmitted && (
                                                    <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold flex items-center gap-1.5">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Submitted
                                                    </div>
                                                )}
                                            </div>

                                            {!isSubmitted ? (
                                                <div className="space-y-4">
                                                    {assignment.type === 'text' && (
                                                        <textarea
                                                            placeholder="Type your response here..."
                                                            className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                                                            value={assignmentData[inputKey] || ''}
                                                            onChange={(e) => handleAssignmentChange(inputKey, e.target.value)}
                                                        />
                                                    )}

                                                    {assignment.type === 'link' && (
                                                        <div className="relative">
                                                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                                            <input
                                                                type="text"
                                                                placeholder="Paste your link here..."
                                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                                                                value={assignmentData[inputKey] || ''}
                                                                onChange={(e) => handleAssignmentChange(inputKey, e.target.value)}
                                                            />
                                                        </div>
                                                    )}

                                                    {assignment.type === 'file' && (
                                                        <div className="relative">
                                                            <input
                                                                type="file"
                                                                id={`file-${idx}`}
                                                                className="hidden"
                                                                multiple
                                                                onChange={(e) => handleFileChange(inputKey, e.target.files)}
                                                            />
                                                            <label
                                                                htmlFor={`file-${idx}`}
                                                                className="w-full flex items-center justify-center gap-3 p-8 border border-dashed border-white/20 rounded-xl hover:bg-white/5 cursor-pointer transition-colors flex-col"
                                                            >
                                                                <Upload className="w-6 h-6 text-purple-400" />
                                                                <span className="text-white/60">
                                                                    {assignmentData[inputKey]?.length > 0
                                                                        ? `${assignmentData[inputKey].length} file(s) selected`
                                                                        : "Click to upload files or screenshots (Multiple allowed)"}
                                                                </span>
                                                                {assignmentData[inputKey]?.length > 0 && (
                                                                    <div className="text-xs text-white/40 mt-2">
                                                                        {Array.from(assignmentData[inputKey]).map(f => f.name).join(', ')}
                                                                    </div>
                                                                )}
                                                            </label>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-end">
                                                        <button
                                                            onClick={() => handleSubmit(assignment)}
                                                            disabled={submitting[inputKey]}
                                                            className="px-6 py-2 rounded-lg bg-white text-black font-medium text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {submitting[inputKey] ? 'Submitting...' : 'Submit Response'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-sm text-white/50 italic flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4" />
                                                    You have completed this task.
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-white/40">
                                This session has no tasks requiring submission.
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default AssessmentPage;
