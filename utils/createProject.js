const mongoose = require('mongoose');
const readline = require('readline');
const { MONGO_URI } = require('../config.js');
const User = require('../src/models/user.js');
const Project = require('../src/models/project.js');
const ProjectAccess = require('../src/models/projectAccess.js');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => rl.question(question, answer => resolve(answer)));
}

async function createProject() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Ask for project info
        const name = await ask('Project Name: ');
        const autodeskProjectId = await ask('Autodesk Facility URN: ');

        // Ask for owner username
        let ownerUsername = await ask('Owner username: ');
        const owner = await User.findOne({ username: ownerUsername });
        if (!owner) {
            console.log(`⚠ User "${ownerUsername}" not found. Exiting.`);
            process.exit(0);
        }

        // Check if project already exists
        const existing = await Project.findOne({ name, autodeskProjectId });
        if (existing) {
            console.log('⚠ Project with this name and URN already exists');
            process.exit(0);
        }

        // Create project
        const project = new Project({
            name,
            autodeskProjectId,
            owner: owner._id
        });
        await project.save();
        console.log(`✅ Project "${name}" created successfully`);

        // Optionally add another user as viewer
        const addViewer = (await ask('Add a viewer user? (y/N): ')).toLowerCase() === 'y';
        if (addViewer) {
            const viewerUsername = await ask('Viewer username: ');
            const viewer = await User.findOne({ username: viewerUsername });
            if (!viewer) {
                console.log(`⚠ User "${viewerUsername}" not found, skipping.`);
            } else {
                const access = await ProjectAccess.create({
                    project: project._id,
                    viewer: viewer._id,
                    invitedBy: owner._id,
                    role: 'viewer'
                });
                console.log(`✅ ProjectAccess for "${viewerUsername}" created`);
            }
        }

        await mongoose.disconnect();
        console.log('✅ MongoDB disconnected');
        process.exit(0);

    } catch (err) {
        console.error('❌ Error creating project:', err);
        await mongoose.disconnect();
        process.exit(1);
    }
}

createProject();