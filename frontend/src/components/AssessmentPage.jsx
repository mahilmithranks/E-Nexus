import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Send,
    Link as LinkIcon,
    FileText,
    CheckCircle,
    AlertCircle,
    Loader2,
    Lock,
    ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

const AssessmentPage = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [session, setSession] = useState(null);
    const [responses, setResponses] = useState({
        q1: ''
    });
    const [submittedData, setSubmittedData] = useState([]);

    // Single question for the new format
    const questions = [
        { id: 'q1', title: 'Assessment Proof', text: 'Upload your mark screen/screenshot to Drive and paste the link.' }
    ];

    const [submitted, setSubmitted] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        fetchSessionDetails();
    }, [sessionId]);

    const fetchSessionDetails = async () => {
        try {
            const res = await api.get(`/student/session/${sessionId}`);
            const sessionData = res.data;

            // SECURITY CHECK: Must have marked attendance for assessment sessions
            if (sessionData.title.toLowerCase().includes('assessment') && !sessionData.hasAttendance) {
                toast.error('Identity verification required. Please mark your attendance first.');
                navigate('/student');
                return;
            }

            setSession(sessionData);

            // Map existing submissions if any
            if (res.data.submissions && res.data.submissions.length > 0) {
                const newResponses = { ...responses };
                let anySubmission = false;

                // Check if we have the new "Assessment Proof" format or fallback to legacy Q1
                const proofSub = res.data.submissions.find(s => s.assignmentTitle === 'Assessment Proof' || s.assignmentTitle === 'Question 01');

                if (proofSub) {
                    newResponses.q1 = proofSub.response || '';
                    anySubmission = true;
                }

                if (anySubmission) {
                    setResponses(newResponses);
                    setSubmitted(true);
                }
                setSubmittedData(res.data.assignmentsSubmitted || []);
            }

            setLoading(false);
        } catch (error) {
            console.error('Fetch session error:', error);
            toast.error('Failed to load assessment details');
            navigate('/student');
        }
    };

    const handleInputChange = (id, value) => {
        setResponses(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic validation: ensure link is provided
        if (!responses.q1.trim()) {
            toast.error('Please provide your Google Drive link');
            return;
        }

        setShowConfirmModal(true);
    };

    const handleConfirmSubmit = async () => {
        setShowConfirmModal(false);
        setSubmitting(true);
        try {
            // Submit single response
            await api.post('/student/assignment', {
                sessionId,
                assignmentTitle: 'Assessment Proof',
                assignmentType: 'link',
                response: responses.q1
            });

            toast.success('Assessment submitted successfully!');
            setSubmitted(true);
            // Don't navigate away, let them see the success state
        } catch (error) {
            console.error('Submission error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit assessment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-[#f05423] animate-spin" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Loading Assessment</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcfcfc] text-zinc-900 font-sans selection:bg-[#f05423]/10">
            {/* Header */}
            <header className="h-20 border-b border-zinc-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50 px-6 lg:px-12 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/student')}
                        className="p-2.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="h-8 w-px bg-zinc-200" />
                    <div>
                        <h1 className="text-lg font-bold text-zinc-900 leading-tight">
                            Buildmode 2026 <span className="text-[#f05423]">Assessment</span>
                        </h1>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">
                            {session?.title} — Day {session?.dayId?.dayNumber}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end">
                        <p className="text-xs font-bold text-zinc-900 uppercase tracking-tight">Requirement</p>
                        <p className="text-[10px] text-zinc-400 font-medium italic">5 Proof-of-Work Links</p>
                    </div>
                    <div className="size-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600">
                        <FileText className="w-5 h-5" />
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Intro Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 p-8 rounded-[2.5rem] bg-white border border-zinc-200 shadow-xl shadow-zinc-200/50"
                >
                    <div className="flex items-start gap-6">
                        <div className="size-16 rounded-3xl bg-[#f05423] flex items-center justify-center text-white shadow-lg shadow-[#f05423]/20 shrink-0">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-zinc-900">Final Submission Portal</h2>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Please provide the Google Drive links for each task below. Each link should lead to your technical documentation or code repository for that specific question.
                            </p>
                            <div className="flex items-center gap-4 pt-2">
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600 border border-emerald-100">
                                    <Lock className="w-3 h-3" />
                                    SSL Secured
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 border border-blue-100">
                                    <ExternalLink className="w-3 h-3" />
                                    Anyone with Link Access
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {submitted ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-12 flex flex-col items-center text-center space-y-6"
                    >
                        <div className="size-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                            <CheckCircle className="w-12 h-12" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-zinc-900">Assessment Submitted!</h2>
                            <p className="text-zinc-500 max-w-md mx-auto">
                                Great job! Your assessment proof has been securely recorded. You can now safely close this page or return to your dashboard.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => navigate('/student')}
                                className="px-12 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-white text-sm font-bold uppercase tracking-widest transition-all hover:bg-zinc-800 shadow-xl shadow-zinc-900/20"
                            >
                                Finish & Return to Dashboard
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-8">
                        {/* Step 1: Open Google Doc */}
                        <div className="p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-indigo-900">Step 1: Take the Assessment</h3>
                                        <div className="space-y-1">
                                            <p className="text-indigo-600/80 text-sm font-medium">Click below to open the assessment form. Complete all questions in the form first.</p>
                                            <div className="flex items-center gap-2 text-amber-600 text-[10px] font-bold bg-amber-50 px-2 py-1 rounded-md border border-amber-100 w-fit">
                                                <AlertCircle className="w-3 h-3" />
                                                WARNING: Access allowed only with registered college mail ID.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <a
                                    href="https://docs.google.com/forms/d/e/1FAIpQLSfpbgzMS0fecLmlSnOsFI6Y6aqDKUpru5BNoGYM6pO8snZQtQ/viewform"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full py-4 rounded-xl bg-white border border-indigo-200 text-indigo-600 font-bold text-center hover:bg-indigo-50 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 group/btn"
                                >
                                    Open Assessment Form
                                    <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </div>

                        {/* Step 2: Submit Proof */}
                        <div className="p-8 rounded-[2rem] bg-white border border-zinc-200 shadow-xl shadow-zinc-200/50 relative">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="size-12 rounded-xl bg-[#f05423] text-white flex items-center justify-center shadow-lg shadow-[#f05423]/20">
                                        <Send className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-zinc-900">Step 2: Submit Proof of Completion</h3>
                                        <p className="text-zinc-500 text-sm font-medium">
                                            1. Take a <span className="text-zinc-900 font-bold">screenshot of your marks/score</span> from the form.<br />
                                            2. Upload it to Google Drive.<br />
                                            3. Paste the Drive link below.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-wider ml-1">Google Drive Link of Screenshot</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#f05423] transition-colors">
                                            <LinkIcon className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="url"
                                            placeholder="https://drive.google.com/file/d/..."
                                            required
                                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#f05423]/20 focus:border-[#f05423]/40 transition-all"
                                            value={responses.q1}
                                            onChange={(e) => handleInputChange('q1', e.target.value)}
                                        />
                                    </div>
                                    <p className="text-[10px] text-zinc-500 pl-1 font-bold">
                                        * Ensure the link permission is set to <span className="text-red-500 bg-red-50 px-1 rounded">"Anyone with the link"</span>
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-5 rounded-xl bg-[#f05423] hover:bg-[#ff9d00] text-white font-black uppercase tracking-[0.2em] shadow-lg shadow-[#f05423]/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Verifying & Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Submit Proof & Complete
                                            <CheckCircle className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )
                }

                {/* Footer Info */}
                <div className="mt-20 pt-10 border-t border-zinc-200 text-center">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">
                        Controlled Assessment Environment &copy; 2026 E-Nexus
                    </p>
                </div>
            </main >

            {/* Custom Confirmation Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-zinc-100"
                        >
                            <div className="p-6 text-center space-y-4">
                                <div className="mx-auto size-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                                    <AlertCircle className="size-6 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-900">Final Submission</h3>
                                    <p className="text-xs text-zinc-500 mt-1 font-medium">Are you sure you want to submit?</p>
                                </div>
                                <p className="text-sm text-zinc-600 leading-relaxed bg-amber-50 p-3 rounded-lg border border-amber-100">
                                    This will be your <span className="font-bold text-amber-700">FINAL submission</span> and cannot be edited afterward.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 p-6 pt-0">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-4 py-3 rounded-xl border border-zinc-200 text-zinc-600 font-bold text-xs uppercase tracking-wider hover:bg-zinc-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmSubmit}
                                    className="px-4 py-3 rounded-xl bg-[#f05423] hover:bg-[#ff9d00] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#f05423]/20 transition-all flex items-center justify-center gap-2"
                                >
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default AssessmentPage;
