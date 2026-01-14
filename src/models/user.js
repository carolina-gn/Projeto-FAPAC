const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['owner', 'user', 'general'], default: 'user' }
}, { timestamps: true });

// Hash password
userSchema.methods.setPassword = async function(password) {
    this.passwordHash = await bcrypt.hash(password, 10);
};

// Compare password
userSchema.methods.validatePassword = function(password) {
    return bcrypt.compare(password, this.passwordHash);
};

// Permissions helpers
userSchema.methods.canCreateIssue = function() {
    return this.role === 'owner' || this.role === 'general';
};

userSchema.methods.canUpdateIssue = function(issue) {
    if (this.role === 'owner') return true;
    if (this.role === 'user') return issue.assignedToName === this.username;
    return false; // general cannot update
};

module.exports = mongoose.model('User', userSchema);
