import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isAuthenticated, getUser } from '../utils/auth';

function ProtectedRoute({ children, requiredRole }) {
    const navigate = useNavigate();

    if (!isAuthenticated()) {
        return <Navigate to="/" replace />;
    }

    const user = getUser();

    if (requiredRole) {
        if (requiredRole === 'admin' && user.role !== 'admin' && user.role !== 'teacher') {
            return <Navigate to="/student" replace />;
        }
        if (requiredRole === 'student' && !user) {
            return <Navigate to="/" replace />;
        }
    }

    return children;
}

export default ProtectedRoute;
