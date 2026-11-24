const readline = require("readline");
const { sequelize } = require("../db");
const { User } = require("../Model");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log("\nDatabase connected successfully.");

    const existingUsers = await User.count();

    if (existingUsers > 0) {
      console.log(
        "Admin setup stopped: Users already exist in the database."
      );
      return;
    }

    console.log("\n--- Create Initial AgriFlow Admin ---");

    const fullName = (await ask("Full name: ")).trim();
    const username = (await ask("Username: ")).trim();
    const email = (await ask("Email: ")).trim().toLowerCase();
    const password = await ask("Password (minimum 6 characters): ");

    if (!fullName || !username || !email || !password) {
      throw new Error("All fields are required.");
    }

    if (password.length < 6) {
      throw new Error("Password must contain at least 6 characters.");
    }

    const admin = await User.create({
      fullName,
      username,
      email,
      password,
      role: "admin",
    });

    console.log("\nAdmin account created successfully!");
    console.log("Username:", admin.username);
    console.log("Role:", admin.role);
    console.log("You can now log in to AgriFlow.");
  } catch (error) {
    console.error("\nAdmin setup failed:", error.message);
  } finally {
    rl.close();
    await sequelize.close();
  }
}

createAdmin();