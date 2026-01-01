const { Scopes } = require('@aps_sdk/authentication');
require('dotenv').config(); // Load .env once here

// Pull environment variables
let { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL, SERVER_SESSION_SECRET, PORT, MONGO_URI } = process.env;

// Check required variables
if (!APS_CLIENT_ID || !APS_CLIENT_SECRET || !APS_CALLBACK_URL || !SERVER_SESSION_SECRET || !MONGO_URI) {
    console.warn('❌ Missing some required environment variables.');
    process.exit(1);
}

// Define APS scopes
const INTERNAL_TOKEN_SCOPES = [Scopes.DataRead, Scopes.ViewablesRead];
const PUBLIC_TOKEN_SCOPES = [Scopes.ViewablesRead];

// Default port
PORT = PORT || 3001;

module.exports = {
    APS_CLIENT_ID,
    APS_CLIENT_SECRET,
    APS_CALLBACK_URL,
    SERVER_SESSION_SECRET,
    INTERNAL_TOKEN_SCOPES,
    PUBLIC_TOKEN_SCOPES,
    PORT,
    MONGO_URI
};