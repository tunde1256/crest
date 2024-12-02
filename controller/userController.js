require('dotenv').config();
const User = require('../Model/usermodel');
const Jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // For password hashing
const logger = require('../logger/logger');
// const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const fs = require('fs'); // File system module for file cleanup
const cloudinary = require('cloudinary').v2;

// In-memory token blacklist for logout
const tokenBlacklist = new Set();

// Register User
exports.registerUser = async (req, res) => {
    try {
        const { username, firstName, lastName, email, password } = req.body;

        // Check if all fields are present
        if (!username || !firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if email already exists
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'Email already exists' });

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = new User({ username, firstName, lastName, email, password: hashedPassword });
        await user.save();

        // Generate and send JWT
        const token = generateToken(user._id);
        res.json({ message:"user registered successfully",
            user,token });
    } catch (error) {
        console.error('Error during registration:', error);
        logger.error('Error during registration:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};



// Login User
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email exists
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate and send JWT
        const token = generateToken(user._id);
        res.json({ user, token });
    } catch (error) {
        logger.error('Error logging in user:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Logout User
exports.logoutUser = async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(400).json({ message: 'No token provided' });

    try {
        tokenBlacklist.add(token); // Add token to blacklist
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        logger.error('Error logging out user:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Upload Profile Picture
exports.uploadProfilePicture = async (req, res) => {
    try {
        const { file } = req;  // Use `req.file` instead of `req`
        
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log('Uploaded file:', file);

        // Upload the file to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'profile_pictures',
        });

        console.log('Cloudinary result:', result);

        // Find and update the user's profile picture
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.profilePicture = result.secure_url;
        await user.save();

        // Delete the local file after upload to Cloudinary
        fs.unlinkSync(file.path);

        res.status(200).json({
            message: 'Profile picture updated successfully',
            profilePicture: result.secure_url,
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// Generate JWT
function generateToken(id) {
    return Jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Middleware to check blacklisted tokens
exports.authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (tokenBlacklist.has(token)) {
        return res.status(401).json({ message: 'Token is invalidated' });
    }
    try {
        const decoded = Jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Get User by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (error) {
        logger.error('Error getting user by ID:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update User by ID
exports.updateUserById = async (req, res) => {
    try {
        const { firstName, lastName, email } = req.body;

        // Check if email already exists
        const userExists = await User.findOne({ _id: { $ne: req.params.id }, email });
        if (userExists) return res.status(400).json({ message: 'Email already exists' });

        const updatedUser = await User.findByIdAndUpdate(req.params.id, { firstName, lastName, email }, { new: true });
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });

        res.json(updatedUser);
    } catch (error) {
        logger.error('Error updating user by ID:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete User by ID
exports.deleteUserById = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User not found' });

        res.json(deletedUser);
    } catch (error) {
        logger.error('Error deleting user by ID:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        logger.error('Error getting users:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get User by Email
exports.getUserByEmail = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (error) {
        logger.error('Error getting user by email:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id; // Get the user ID from the token

        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if the user has a profile picture
        if (!user.profilePicture) {
            return res.status(400).json({ message: 'No profile picture to delete' });
        }

        // Extract the public ID from the URL stored in user.profilePicture
        const publicId = user.profilePicture.split('/').pop().split('.')[0]; // Assuming the URL is something like "cloudinary_url.com/xxx.jpg"

        // Delete the image from Cloudinary
        cloudinary.uploader.destroy(publicId, async (error, result) => {
            if (error) {
                logger.error('Error deleting profile picture from Cloudinary:', error.message);
                return res.status(500).json({ message: 'Error deleting profile picture from Cloudinary' });
            }

            // If deletion is successful, remove the reference from the user's document
            user.profilePicture = null;
            await user.save();

            res.json({ message: 'Profile picture deleted successfully from Cloudinary' });
        });
    } catch (error) {
        logger.error('Error deleting profile picture:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id; // Get the user ID from the token

        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if the current password matches
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

        // Validate the new password (optional, based on your requirements)
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }

        // Hash the new password and update it
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        logger.error('Error changing password:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.googleCallback = async (req, res) => {
    try {
        const profile = req.user; // Retrieved from Google Strategy's `done`

        // Check if user exists in the database
        let user = await User.findOne({ email: profile.email });

        if (!user) {
            // Create a new user if not found
            user = new User({
                username: profile.displayName,
                firstName: profile.given_name || '',
                lastName: profile.family_name || '',
                email: profile.email,
                googleId: profile.id, // Track users authenticated with Google
            });
            await user.save();
        }

        // Generate a token for the user
        const token = generateToken(user._id);

        // Respond with user info and token
        res.json({ message: 'Login successful', user, token });
    } catch (error) {
        logger.error('Error during Google login:', error.message);
        res.status(500).json({ message: 'Server error' });
    }};