require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.Port || 3000;
const cors = require('cors');
const connection = require('./db/db');
const logger = require('./logger/logger');
const passport = require('passport');
const session = require('express-session');
const { Strategy: GoogleStrategy } = require('passport-google-oauth2'); // Ensure correct import// Import routes


const userRoutes = require('./router/userRoutes');

// Enable CORS
app.use(cors());
connection()
app.use(express.json());
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
}));

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: 'http://localhost:4080/auth/google/callback',
            passReqToCallback: true, // Optional: Pass the request object if needed
        },
        (request, accessToken, refreshToken, profile, done) => {
            // This is the `verify` callback.
            // Handle the authenticated user here:
            // - Check if user exists in your database
            // - Create a new user if they don't exist
            // - Pass the user data to `done`

            // Example:
            const user = {
                id: profile.id,
                displayName: profile.displayName,
                email: profile.emails[0].value,
            };

            return done(null, user);
        }
    )
);

// Serialize and deserialize user to maintain session
passport.serializeUser((user, done) => {
    done(null, user.id); // Save user ID to the session
});

passport.deserializeUser((id, done) => {
    // Retrieve the user from your database using the ID
    // Example:
    const user = { id, displayName: 'Test User', email: 'test@example.com' }; // Replace with actual database lookup
    done(null, user);
});

app.use(passport.initialize());
app.use(passport.session());


app.use('/api/users', userRoutes);

// Connect to MongoDB




app.listen(port,(req, res)=>{
    logger.info(`Server is running on port ${port}`);
});

