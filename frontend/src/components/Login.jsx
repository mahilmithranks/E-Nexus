import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { setAuth } from '../utils/auth';
import { AnimatedLoginPage } from './ui/animated-characters-login-page';


function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');

        const cleanedUsername = username.trim();
        const cleanedPassword = password.trim();

        setLoading(true);

        try {
            // Clear any existing auth before trying to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            const response = await api.post('/auth/login', {
                username: cleanedUsername,
                password: cleanedPassword
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
        <AnimatedLoginPage
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
