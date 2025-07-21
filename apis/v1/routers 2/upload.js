const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration (Store files in `uploads/` folder)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Function to remove specific extensions
const removeExtension = (filename) => {
    return filename.replace(/\.(png|jpg|mp4|mp3|glb)$/i, '');
};

// File Upload API
router.post('/upload-file', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: false, message: 'No file uploaded' });
    }

    // Construct file URL (assuming the server runs on localhost:5000)
    const fileUrl = `https://tasl.runtimetheory.com/uploads/${req.file.filename}`;

    res.status(200).json({
        status: true,
        message: 'File uploaded successfully',
        file_url: fileUrl,
        file_name: removeExtension(req.file.originalname), // Remove extensions before returning
    });
});

module.exports = router;