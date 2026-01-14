// utils/createProjectAccess.js
const mongoose = require('mongoose');
const readline = require('readline');
const { MONGO_URI } = require('../config.js');
const User = require('../src/models/user.js');
const Project = require('../src/models/project.js');
const { ProjectAccess } = require('../src/models/projectAccess.js'); // destructure correctly

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function ask(question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer)));
}

// Main function
async function createProjectAccess() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // List projects
    const projects = await Project.find().populate('owner');
    if (!projects.length) {
      console.log('⚠ No projects found. Exiting.');
      return cleanup(0);
    }

    console.log('\nProjects:');
    projects.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} (owner: ${p.owner.username})`);
    });

    const projectNum = parseInt(await ask('Select project number: '), 10);
    const project = projects[projectNum - 1];
    if (!project) {
      console.log('⚠ Invalid project number. Exiting.');
      return cleanup(0);
    }

    // List users
    const users = await User.find();
    if (!users.length) {
      console.log('⚠ No users found. Exiting.');
      return cleanup(0);
    }

    console.log('\nUsers:');
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.username} (${u.role})`);
    });

    const userNum = parseInt(await ask('Select user number: '), 10);
    const user = users[userNum - 1];
    if (!user) {
      console.log('⚠ Invalid user number. Exiting.');
      return cleanup(0);
    }

    // Check if user already has access
    const existing = await ProjectAccess.findOne({
      project: project._id,
      viewer: user._id
    });

    if (existing) {
      console.log('⚠ User already has access to this project.');
      return cleanup(0);
    }

    // Create ProjectAccess
    await ProjectAccess.create({
      project: project._id,
      viewer: user._id,
      invitedBy: project.owner._id,
      role: 'viewer'
    });

    console.log(`✅ Added "${user.username}" as viewer to project "${project.name}"`);
    cleanup(0);

  } catch (err) {
    console.error('❌ Error:', err.message || err);
    cleanup(1);
  }
}

// Cleanup function to close readline and disconnect MongoDB
async function cleanup(exitCode = 0) {
  try {
    rl.close();
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
  } catch (err) {
    console.error('Error during cleanup:', err.message || err);
  } finally {
    process.exit(exitCode);
  }
}

// Run the script
createProjectAccess();