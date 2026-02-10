import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';

import ProtectedRoute from './components/ProtectedRoute';
import { isAuthenticated, isAdmin, isStudent } from './utils/auth';

import { Toaster } from 'react-hot-toast';

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Toaster position="top-right" toastOptions={{
                style: {
                    background: '#333',
                    color: '#fff',
                },
            }} />
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



                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
