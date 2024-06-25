import User from './models/user.js';

const verifyUsers = async () => {
  try {
    const users = await User.findAll();
    console.log(`Found ${users.length} users.`); // Log the number of users found
    users.forEach(user => {
      console.log(`User: ${user.username}, Rankings: ${JSON.stringify(user.rankings)}`);
    });
  } catch (error) {
    console.error("Error verifying users:", error);
  }
};

verifyUsers();
