import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getUser } from '../utils/auth';

function ProtectedRoute({ children, requiredRole }) {
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/', { replace: true });
            return;
        }

        const user = getUser();

        if (requiredRole && user.role !== requiredRole) {
            // Redirect to appropriate dashboard if wrong role
            if (user.role === 'admin') {
                navigate('/admin', { replace: true });
            } else {
                navigate('/student', { replace: true });
            }
        }
    }, [navigate, requiredRole]);

    // Only render children if authenticated and role matches
    if (!isAuthenticated()) {
        return null;
    }

    const user = getUser();
    if (requiredRole && user.role !== requiredRole) {
        return null;
    }

    return children;
}

export default ProtectedRoute;
