import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { setAuth } from '../utils/auth';
import { SignInCard } from './ui/SignInCard';
import './Login.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', {
                username,
                password
            });

            const { token, user } = response.data;

            // Store auth data
            setAuth(token, user);

            // Redirect based on role
            if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/student');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(
                err.response?.data?.message || 'Login failed. Please check your credentials.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SignInCard
            username={username}
            password={password}
            onUsernameChange={(e) => setUsername(e.target.value)}
            onPasswordChange={(e) => setPassword(e.target.value)}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
        />
    );
}

export default Login;
