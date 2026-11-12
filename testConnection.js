const { sequelize } = require("./db");

const testConnection = async () => {
  try {
    await sequelize.authenticate();

    console.log("================================");
    console.log("DATABASE CONNECTED SUCCESSFULLY!");
    console.log("Database: agriflow_db");
    console.log("================================");

    await sequelize.close();
  } catch (error) {
    console.error("DATABASE CONNECTION FAILED!");
    console.error("ERROR NAME:", error.name);
    console.error("ERROR MESSAGE:", error.message);
    console.error("DATABASE ERROR:", error.parent?.message);

    process.exitCode = 1;
  }
};

testConnection();