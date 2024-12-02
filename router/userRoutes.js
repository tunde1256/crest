const express = require('express');
const router = express.Router();
const upload = require('../config/mutter'); // Assuming you meant 'multer' for file uploads
const userController = require('../controller/userController');
const { authMiddleware } = require('../controller/userController'); // Ensure this is correctly exported
const { authenticate } = require('../middleware/Authentication'); // Ensure 'authenticate' is exported correctly

// Log out the user
router.post('/logout', authMiddleware, userController.logoutUser);

// Upload user profile picture
router.post('/upload-profile', authenticate, upload.single('file'), userController.uploadProfilePicture);

// Delete user profile picture
router.post('/delete-profile', authenticate, userController.deleteProfilePicture);

// Change user password
router.post('/change-password', authenticate, userController.changePassword);

// User registration
router.post('/register', userController.registerUser);

// User login
router.post('/login', userController.loginUser);

// Get user by ID
router.get('/:id', authenticate, userController.getUserById);

// Update user by ID
router.put('/:id', authenticate, userController.updateUserById);

// Delete user by ID
router.delete('/:id', authenticate, userController.deleteUserById);

// Get all users
router.get('/', authenticate, userController.getUsers);

// Get user by email
router.get('/email/:email', authenticate, userController.getUserByEmail);

// Google OAuth callback
router.get('/google/callback', userController.googleCallback);

module.exports = router;
