const mongoose = require('mongoose');
const { MONGO_URI } = require('./config.js');
const User = require('./src/models/user.js');
const Project = require('./src/models/project.js');
const ProjectAccess = require('./src/models/projectAccess.js');

// Facility URN (used by the Viewer)
const FACILITY_URN = 'urn:adsk.dtt:AvASyje2SDOxi39ioNxN5g';

// Hardcoded name for now
const FACILITY_NAME = 'Test Facility';

async function createDummyProject() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find owner user
        const owner = await User.findOne({ username: 'testviewer2' });
        if (!owner) throw new Error('Owner user not found');

        // Create project
        const project = await Project.create({
            name: FACILITY_NAME,
            autodeskProjectId: FACILITY_URN,
            owner: owner._id
        });

        console.log('✅ Project created:', project);

        // Optionally add viewer
        const viewer = await User.findOne({ username: 'testviewer' });
        if (viewer) {
            const access = await ProjectAccess.create({
                project: project._id,
                viewer: viewer._id,
                invitedBy: owner._id,
                role: 'viewer'
            });
            console.log('✅ ProjectAccess created:', access);
        }

        await mongoose.disconnect();
        console.log('✅ MongoDB disconnected');

    } catch (err) {
        console.error('❌ Error creating dummy project:', err);
        await mongoose.disconnect();
    }
}

createDummyProject();