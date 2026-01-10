const mongoose = require('mongoose');
const User = require('./src/models/user.js');  
const { MONGO_URI } = require('./config.js');

async function createDummyUser() {
    try {
        // Modern Mongoose connection (no extra options)
        await mongoose.connect(MONGO_URI);

        const existing = await User.findOne({ email: "viewer@example.com" });
        if (existing) {
            console.log("Dummy user already exists");
            return process.exit(0);
        }

        const user = new User({
    name: "Test Viewer",
    username: "testviewer",    // new field
    email: "viewer@example.com",
    passwordHash: "password123",
    role: "viewer"
    });


        await user.save();
        console.log("✅ Dummy user created successfully");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

createDummyUser();
