import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import { Toaster } from 'react-hot-toast';

// Lazy-load heavy route components — only downloaded when the route is visited
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const AssessmentPage = lazy(() => import('./components/AssessmentPage'));

// Full-screen loading placeholder shown during code-split chunk loading
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-white">
        <div style={{
            width: 40, height: 40,
            border: '3px solid #f0542320',
            borderTopColor: '#f05423',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Toaster position="top-right" toastOptions={{
                style: {
                    background: '#333',
                    color: '#fff',
                },
            }} />
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/" element={<Login />} />

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/student"
                        element={
                            <ProtectedRoute requiredRole="student">
                                <StudentDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/assessment/:sessionId"
                        element={
                            <ProtectedRoute requiredRole="student">
                                <AssessmentPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;
