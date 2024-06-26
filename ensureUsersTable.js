import sequelize from './config/database.js';

const ensureUsersTable = async () => {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Users" (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        rankings JSONB,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Users table ensured.");
  } catch (error) {
    console.error("Error ensuring Users table:", error);
  }
};

ensureUsersTable();
