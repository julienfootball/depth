import User from './models/user.js';

const addUsers = async () => {
  try {
    await User.create({
      username: 'testuser1',
      rankings: JSON.stringify([
        "Player1", "Player2", "Player3"
      ])
    });

    await User.create({
      username: 'testuser2',
      rankings: JSON.stringify([
        "Player4", "Player5", "Player6"
      ])
    });

    console.log("Users added successfully.");
  } catch (error) {
    console.error("Error adding users:", error);
  }
};

addUsers();
