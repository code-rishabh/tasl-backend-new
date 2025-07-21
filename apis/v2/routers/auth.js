const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../../v1/models/User"); 

const MASTER_KEY = "12345678901234567890123456789012"

const router = express.Router();

// Encryption Constants
const SECRET_KEY = "12345678901234567890123456789012"; 
const IV = "1234567890123456"; 

// AES Encryption Function
function encrypt(text) {
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(SECRET_KEY), Buffer.from(IV));
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
}

// AES Decryption Function
function decrypt(encryptedText) {
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(SECRET_KEY), Buffer.from(IV));
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

// JWT Verification
const verifyToken = (token) => {
    try {
        return jwt.verify(token, "abhishek"); // Replace with a secure secret key
    } catch (err) {
        return null;
    }
};

// Signup Endpoint
router.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            const errors = {};
            if (existingUser.username === username) errors.username = ["The username has already been taken."];
            if (existingUser.email === email) errors.email = ["The email has already been taken."];

            return res.status(400).json({ encryptedData: encrypt(JSON.stringify({ status: false, message: "The username or email has already been taken.", errors })) });
        }

        const user = new User({ username, email, password, role: 2 }); // Default role: trainee
        await user.save();

        const token = user.generateAuthToken();
        const encryptedToken = encrypt(token);

        res.status(201).json({ encryptedData: encrypt(JSON.stringify({ status: true, message: "Signup successful!", token: encryptedToken, role: user.role })) });
    } catch (err) {
        res.status(500).json({ encryptedData: encrypt(JSON.stringify({ error: "Server error: " + err.toString() })) });
    }
});

// Login Endpoint
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ encryptedData: encrypt(JSON.stringify({ status: false, message: "Invalid username.", errors: { username: ["Invalid username."] } })) });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ encryptedData: encrypt(JSON.stringify({ status: false, message: "Incorrect Username / Password" })) });
        }

        const token = user.generateAuthToken();

        res.status(200).json({ encryptedData: encrypt(JSON.stringify({ status: true, message: "Login successful", token: token, role: user.role,key:MASTER_KEY,IV:IV })) });
    } catch (err) {
        res.status(500).json({ encryptedData: encrypt(JSON.stringify({ status: false, message: "Server error" })) });
    }
});

// Forgot Password Endpoint
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ encryptedData: encrypt(JSON.stringify({ error: "Email not found" })) });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 600000; // 10 minutes
        await user.save();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        const mailOptions = { from: process.env.EMAIL_USER, to: email, subject: "Password Reset OTP", text: `Your OTP for password reset is: ${otp}` };

        transporter.sendMail(mailOptions, (err) => {
            if (err) {
                return res.status(500).json({ encryptedData: encrypt(JSON.stringify({ error: "Failed to send OTP" })) });
            }
            res.status(200).json({ encryptedData: encrypt(JSON.stringify({ message: "OTP sent to email" })) });
        });
    } catch (err) {
        res.status(500).json({ encryptedData: encrypt(JSON.stringify({ error: "Server error" })) });
    }
});

// Reset Password Endpoint
router.post("/reset-password", async (req, res) => {
    try {
        const { adminToken, adminPassword, userToken, newPassword } = req.body;

        if (!adminToken || !adminPassword || !userToken || !newPassword) {
            return res.status(400).json({ encryptedData: encrypt(JSON.stringify({ message: "All fields are required" })) });
        }

        // Verify Admin Token
        const adminDecoded = verifyToken(adminToken);
        if (!adminDecoded) {
            return res.status(401).json({ encryptedData: encrypt(JSON.stringify({ message: "Invalid or expired admin token" })) });
        }

        const adminUser = await User.findById(adminDecoded._id);
        if (!adminUser || adminUser.role !== 0) {
            return res.status(403).json({ encryptedData: encrypt(JSON.stringify({ message: "Unauthorized: Not an admin" })) });
        }

        const isPasswordValid = await bcrypt.compare(adminPassword, adminUser.password);
        if (!isPasswordValid) {
            return res.status(401).json({ encryptedData: encrypt(JSON.stringify({ message: "Incorrect admin password" })) });
        }

        // Verify User Token
        const userDecoded = verifyToken(userToken);
        if (!userDecoded) {
            return res.status(401).json({ encryptedData: encrypt(JSON.stringify({ message: "Invalid or expired user token" })) });
        }

        const normalUser = await User.findById(userDecoded._id);
        if (!normalUser) {
            return res.status(404).json({ encryptedData: encrypt(JSON.stringify({ message: "User not found" })) });
        }

        // Reset Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        normalUser.password = hashedPassword;
        await normalUser.save();

        res.json({ encryptedData: encrypt(JSON.stringify({ message: "Password reset successfully" })) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ encryptedData: encrypt(JSON.stringify({ message: "Internal server error" })) });
    }
});


module.exports = router;