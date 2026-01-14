const mongoose = require('mongoose');
const User = require('../src/models/user.js');
const { MONGO_URI } = require('../config.js');

async function fixUserPassword() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected');

        const user = await User.findOne({ username: 'testviewer2' });

        if (!user) {
            console.log('❌ User not found');
            return process.exit(0);
        }

        await user.setPassword('password123');
        await user.save();

        console.log('🔐 Password fixed for:', user.username);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error fixing user:', err);
        process.exit(1);
    }
}

fixUserPassword();