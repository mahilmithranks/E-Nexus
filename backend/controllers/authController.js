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

        // Efficient finding: registerNumber is always uppercase in DB
        const regNum = normalizedUsername.toUpperCase();
        let user = await User.findOne({
            $or: [
                { registerNumber: regNum },
                { email: normalizedUsername }
            ]
        }).lean();

        if (!user) {
            console.log(`[Login] Exact match failed for: ${normalizedUsername}. Trying case-insensitive search...`);
            // Fallback: Use regex with ^ and $ for exact field match but case-insensitive
            user = await User.findOne({
                $or: [
                    { registerNumber: { $regex: new RegExp(`^${normalizedUsername}$`, 'i') } },
                    { email: { $regex: new RegExp(`^${normalizedUsername}$`, 'i') } }
                ]
            }).lean();

            if (!user) {
                console.log(`[Login] User not found: ${normalizedUsername}`);
                return res.status(401).json({ message: 'Invalid credentials' });
            }
        }

        // Must re-fetch or use non-lean for password comparison if it's a model method
        const userModel = await User.findById(user._id);
        const isMatch = await userModel.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user._id.toString());

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
        console.error('CRITICAL Login Error:', error);
        console.error(error.stack);
        res.status(500).json({
            message: 'Server error during login',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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
