const { User } = require("../Model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// REGISTER
exports.register = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({
        succeeded: false,
        message: "All fields are required",
        data: null,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        succeeded: false,
        message: "Password must be at least 6 characters",
        data: null,
      });
    }

    const existingUser = await User.findOne({
      where: {
        [require("sequelize").Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        succeeded: false,
        message: "Username or email already exists",
        data: null,
      });
    }

    const user = await User.create({
      fullName,
      username,
      email,
      password,
      role: "manager",
    });

    const token = generateToken(user);

    return res.status(201).json({
      succeeded: true,
      message: "Registration successful",
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const loginValue = username || email;

    if (!loginValue || !password) {
      return res.status(400).json({
        succeeded: false,
        message: "Username/email and password are required",
        data: null,
      });
    }

    const user = await User.findOne({
      where: {
        [require("sequelize").Op.or]: [
          { username: loginValue },
          { email: loginValue },
        ],
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        succeeded: false,
        message: "Invalid login credentials",
        data: null,
      });
    }

    const token = generateToken(user);

    return res.json({
      succeeded: true,
      message: "Login successful",
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// GET PROFILE
exports.getProfile = async (req, res) => {
  const { id, fullName, username, email, role } = req.user;

  res.json({
    succeeded: true,
    message: "Profile fetched successfully",
    data: { id, fullName, username, email, role },
  });
};
// GET ALL USERS (ADMIN ONLY)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: {
        exclude: ["password"],
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      succeeded: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};

// DELETE USER (ADMIN ONLY)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting their own account
    if (String(req.user.id) === String(id)) {
      return res.status(400).json({
        succeeded: false,
        message: "You cannot delete your own account",
        data: null,
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        succeeded: false,
        message: "User not found",
        data: null,
      });
    }

    // Protect admin accounts from deletion
    if (user.role === "admin") {
      return res.status(403).json({
        succeeded: false,
        message: "Admin accounts cannot be deleted through this feature",
        data: null,
      });
    }

    await user.destroy();

    return res.status(200).json({
      succeeded: true,
      message: "User deleted successfully",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};
// UPDATE USER (ADMIN ONLY)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, username, email, password } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        succeeded: false,
        message: "User not found",
        data: null,
      });
    }

    // Only allow updating manager accounts
    if (user.role === "admin") {
      return res.status(403).json({
        succeeded: false,
        message: "Admin accounts cannot be edited through this feature",
        data: null,
      });
    }

    // Check for duplicate username or email
    const { Op } = require("sequelize");

    const existingUser = await User.findOne({
      where: {
        [Op.and]: [
          { id: { [Op.ne]: id } },
          {
            [Op.or]: [
              ...(username ? [{ username }] : []),
              ...(email ? [{ email }] : []),
            ],
          },
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        succeeded: false,
        message: "Username or email already exists",
        data: null,
      });
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;

    if (password !== undefined && password.trim() !== "") {
      if (password.length < 6) {
        return res.status(400).json({
          succeeded: false,
          message: "Password must be at least 6 characters",
          data: null,
        });
      }

      user.password = password;
    }

    await user.save();

    return res.status(200).json({
      succeeded: true,
      message: "User updated successfully",
      data: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    return res.status(400).json({
      succeeded: false,
      message: error.message,
      data: null,
    });
  }
};