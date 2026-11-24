const express = require("express");
const router = express.Router();

const { rateLimit } = require("express-rate-limit");

const {
  register,
  login,
  getProfile,
  getAllUsers,
  updateUser,
  deleteUser,
} = require("../Controllers/authController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    succeeded: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
    data: null,
  },
});

// Authentication routes
router.post("/register", protect, authorize("admin"), register);
router.post("/login", loginLimiter, login);
router.get("/profile", protect, getProfile);

// User Management (Admin Only)
router.get("/users", protect, authorize("admin"), getAllUsers);
router.put("/users/:id", protect, authorize("admin"), updateUser);
router.delete("/users/:id", protect, authorize("admin"), deleteUser);

module.exports = router;