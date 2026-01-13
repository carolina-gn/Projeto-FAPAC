const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../src/models/user.js');
const { MONGO_URI } = require('../config.js');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => rl.question(question, answer => resolve(answer)));
}

async function createUser() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const name = await ask('Full Name: ');
        const username = await ask('Username: ');
        const email = await ask('Email: ');
        const password = await ask('Password: ');
        let role = await ask('Role (owner / user / general): ');
        role = role.toLowerCase();
        if (!['owner', 'user', 'general'].includes(role)) role = 'user';

        const existing = await User.findOne({ $or: [{ username }, { email }] });
        if (existing) {
            console.log('⚠ User with this username or email already exists');
            process.exit(0);
        }

        const user = new User({ name, username, email, role });
        await user.setPassword(password);
        await user.save();

        console.log(`✅ User "${username}" created successfully`);
        process.exit(0);

    } catch (err) {
        console.error('❌ Error creating user:', err);
        process.exit(1);
    }
}

createUser();