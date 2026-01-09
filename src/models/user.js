const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, unique: true, required: true }, // new field
    email: { type: String, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['owner', 'viewer'], required: true },
    autodeskId: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);