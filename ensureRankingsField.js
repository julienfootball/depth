import User from './models/user.js';

const ensureRankingsField = async () => {
  try {
    const users = await User.findAll();
    for (const user of users) {
      if (!user.rankings || user.rankings === null) {
        user.rankings = [];
        await user.save();
        console.log(`Updated user ${user.username} with empty rankings.`);
      }
    }
    console.log("Rankings field ensured for all users.");
  } catch (error) {
    console.error("Error ensuring rankings field:", error);
  }
};

ensureRankingsField();
