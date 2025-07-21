const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../../uploads');
const encryptedDir = path.join(__dirname, '../../../encrypted_uploads');

// Ensure directories exist
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(encryptedDir)) fs.mkdirSync(encryptedDir, { recursive: true });

const SECRET_KEY = "12345678901234567890123456789012"; // 32-byte key
const IV = "1234567890123456";  // 16-byte IV

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage, limits: { fileSize: 5000 * 1024 * 1024 } });

const encryptFile = (inputFilePath, outputFilePath) => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const cipher = crypto.createCipheriv('aes-256-cbc', SECRET_KEY, IV);
        const input = fs.createReadStream(inputFilePath);
        const output = fs.createWriteStream(outputFilePath);

        input.pipe(cipher).pipe(output);
        output.on('finish', () => {
            const endTime = Date.now();
            console.log(`File encryption took ${endTime - startTime} ms`);
            resolve(true);
        });
        output.on('error', (err) => reject(err));
    });
};



router.post('/upload-file', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: false, message: 'No file uploaded' });
    }

    const originalFilePath = path.join(uploadDir, req.file.filename);
    const encryptedFilePath = path.join(encryptedDir, req.file.filename + '.bin');

    try {
        await encryptFile(originalFilePath, encryptedFilePath);
        fs.unlinkSync(originalFilePath); // Remove the original file after encryption
    } catch (error) {
        return res.status(500).json({ status: false, message: 'File encryption failed', error: error.toString() });
    }

    const fileUrl = `https://tasl.runtimetheory.com/encrypted_uploads/${req.file.filename}.bin`;

    res.status(200).json({
        status: true,
        message: 'File uploaded and encrypted successfully',
        file_url: fileUrl,
    });
});


module.exports = router;
