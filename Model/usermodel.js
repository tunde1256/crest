const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // For password hashing

// Define User Schema
const UserSchema = new mongoose.Schema({
    firstName: { 
        type: String, 
        required: [true, "First name is required"], 
        trim: true 
    },
    lastName: { 
        type: String, 
        required: [true, "Last name is required"], 
        trim: true 
    },
    username: { 
        type: String, 
        required: [true, "Username is required"], 
        trim: true 
    },
    email: { 
        type: String, 
        required: [true, "Email is required"], 
        unique: true, 
        trim: true, 
        match: [/.+@.+\..+/, "Please enter a valid email address"] 
    },
    password: { 
        type: String, 
        required: [true, "Password is required"], 
        minlength: [6, "Password must be at least 6 characters long"] 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    role: { 
        type: String, 
        enum: ["user", "admin"], 
        default: "user" 
    },
    profilePicture: { type: String, default: null }, // Add profile picture field
});


// Export the User model
const User = mongoose.model("User", UserSchema);
module.exports = User;
