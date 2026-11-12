const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadPath = path.join(__dirname, "..", "public", "Images");

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" + Math.round(Math.random() * 1e9);

        cb(null, uniqueName + path.extname(file.originalname).toLowerCase());
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png"];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG and PNG images are allowed."));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 1024 * 1024
    }
});

const uploadBuyerPhoto = (req, res, next) => {
    upload.single("photo")(req, res, (error) => {
        if (error) {
            return res.status(400).json({
                succeeded: false,
                message: error.code === "LIMIT_FILE_SIZE"
                    ? "Image must not exceed 1 MB."
                    : error.message,
                data: null
            });
        }

        if (req.file) {
            req.body.photoUrl = `/images/${req.file.filename}`;
        }

        next();
    });
};

module.exports = uploadBuyerPhoto;