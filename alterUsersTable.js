import sequelize from './config/database.js';

const alterUsersTable = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "Users"
      ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log("Users table altered.");
  } catch (error) {
    console.error("Error altering Users table:", error);
  }
};

alterUsersTable();
