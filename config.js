const { Scopes } = require('@aps_sdk/authentication');
require('dotenv').config();
console.log("MYSQL_PUBLIC_URL:", process.env.MYSQL_PUBLIC_URL);

let {
    APS_CLIENT_ID,
    APS_CLIENT_SECRET,
    SERVER_SESSION_SECRET,
    PORT,
    MONGO_URI,
    MYSQL_PUBLIC_URL,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
    VAPID_SUBJECT
} = process.env;

if (
    !APS_CLIENT_ID ||
    !APS_CLIENT_SECRET ||
    !SERVER_SESSION_SECRET ||
    !MONGO_URI
) {
    console.warn('❌ Missing some required environment variables.');
    process.exit(1);
}

if (!MYSQL_PUBLIC_URL) {
    console.warn('❌ Missing MYSQL_PUBLIC_URL in .env');
    process.exit(1);
}

const INTERNAL_TOKEN_SCOPES = [Scopes.DataRead, Scopes.ViewablesRead];
const PUBLIC_TOKEN_SCOPES = [Scopes.ViewablesRead];

PORT = PORT || 3001;

module.exports = {
    APS_CLIENT_ID,
    APS_CLIENT_SECRET,
    SERVER_SESSION_SECRET,
    INTERNAL_TOKEN_SCOPES,
    PUBLIC_TOKEN_SCOPES,
    PORT,
    MONGO_URI,
    MYSQL_PUBLIC_URL,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
    VAPID_SUBJECT
};