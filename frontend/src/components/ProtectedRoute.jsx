import { Navigate, useNavigate } from 'react-router-dom';
import { isAuthenticated, getUser } from '../utils/auth';

function ProtectedRoute({ children, requiredRole }) {
    const navigate = useNavigate();

    if (!isAuthenticated()) {
        return <Navigate to="/" replace />;
    }

    const user = getUser();

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to={user.role === 'admin' ? "/admin" : "/student"} replace />;
    }

    return children;
}

export default ProtectedRoute;
