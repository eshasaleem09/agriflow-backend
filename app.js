require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const { connectDB } = require("./db");

require("./Model");

const app = express();

app.use(helmet());
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use(
    "/images",
    express.static(path.join(__dirname, "public", "Images"))
);

// Health check
app.get("/", (req, res) => {
    res.json({
        succeeded: true,
        message: "AgriFlow Backend API is running",
        data: null
    });
});

// Authentication routes
app.use("/api/auth", require("./Routes/authRoutes"));
app.use("/api", require("./Routes/crudRoutes"));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        succeeded: false,
        message: "API route not found",
        data: null
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).json({
        succeeded: false,
        message: err.message || "Internal server error",
        data: null
    });
});

const PORT = process.env.PORT || process.env.PORT_NAME || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`AgriFlow server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
};

startServer();

module.exports = app;