import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '24h'
    });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Please provide username and password' });
        }

        const normalizedUsername = username.trim().toLowerCase();

        console.log(`[Login] Attempt for: ${username} (normalized: ${normalizedUsername})`);

        // Find user by registerNumber (always stored uppercase) or email (lowercase)
        const user = await User.findOne({
            $or: [
                { registerNumber: normalizedUsername.toUpperCase() },
                { email: normalizedUsername }
            ]
        });

        if (!user) {
            console.log(`[Login] User not found: ${normalizedUsername}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log(`[Login] Found user: ${user.registerNumber} (${user.role})`);

        // Check if account is locked
        if (user.isLocked) {
            return res.status(423).json({
                message: 'Account is locked due to too many failed login attempts. Please try again later.'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            // Increment login attempts
            await user.incLoginAttempts();
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Reset login attempts on successful login
        if (user.loginAttempts > 0 || user.lockUntil) {
            await user.resetLoginAttempts();
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            token,
            user: {
                id: user._id,
                registerNumber: user.registerNumber,
                email: user.email,
                name: user.name,
                role: user.role,
                yearOfStudy: user.yearOfStudy,
                department: user.department
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ message: 'Server error fetching user profile' });
    }
};
