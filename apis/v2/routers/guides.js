const express = require("express");
const crypto = require("crypto");
const Guide = require("../../v1/models/Guide"); // Adjust path based on your project structure
const jwt = require('jsonwebtoken')
const router = express.Router();

// Encryption Constants
const SECRET_KEY = "12345678901234567890123456789012"; // 32-byte key
const IV = "1234567890123456"; // 16-byte IV

// AES Encryption Function
function encrypt(text) {
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(SECRET_KEY), Buffer.from(IV));
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
}

const encryptTextToBytes = (text) => {
    const cipher = crypto.createCipheriv('aes-256-cbc', SECRET_KEY, IV);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return Buffer.from(encrypted, 'hex').toJSON().data;
};


// GET all guides (encrypted response)
router.get("/get-all-guides", async (req, res) => {
    try {
        const guides = await Guide.find({}, "_id name description steps created_at updated_at");

        // Transform response to include step count
        const formattedGuides = guides.map(guide => ({
            _id: guide._id,
            name: guide.name,
            description: guide.description,
            steps_count: guide.steps.length, // Number of steps
            created_at: guide.created_at,
            updated_at: guide.updated_at
        }));

        res.status(200).json({ data: encryptTextToBytes(JSON.stringify({ guides: formattedGuides })) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ data: encrypt(JSON.stringify({ message: "Internal server error" })) });
    }
});

// GET specific guide by ID (encrypted response)
router.get("/guide-info", async (req, res) => {
    try {
        const { id } = req.query; // Get the guide ID from query parameters

        if (!id) {
            return res.status(400).json({ data: encryptTextToBytes(JSON.stringify({ status: false, message: "Guide ID is required" })) });
        }

        // Fetch guide from MongoDB
        const guide = await Guide.findById(id);

        if (!guide) {
            return res.status(404).json({ data: encryptTextToBytes(JSON.stringify({ status: false, message: "Guide not found" })) });
        }

        res.status(200).json({ data: encryptTextToBytes(JSON.stringify({ status: true, guide })) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ data: encryptTextToBytes(JSON.stringify({ status: false, message: "Internal server error" })) });
    }
});

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
  
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, 'abhishek'); // Replace with process.env.JWT_SECRET
      req.user = decoded; // Store decoded user info in req.user
      next();
    } catch (error) {
      res.status(403).json({ error: 'Invalid or expired token' });
    }
  };

router.post('/request-edit-content', authMiddleware, async (req, res) => {
    try {
        const { guide_id, step_id, content_id, placement } = req.body;
        const user_id = req.user._id; // Extract user ID from JWT token
  
        if (!guide_id || !step_id || !content_id || !placement) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
  
        // Find the guide
        const guide = await Guide.findById(guide_id);
        if (!guide) return res.status(404).json({ error: 'Guide not found' });
  
        // Find the step
        const step = guide.steps.id(step_id);
        if (!step) return res.status(404).json({ error: 'Step not found' });
  
        // Find the content
        const content = step.contents.id(content_id);
        if (!content) return res.status(404).json({ error: 'Content not found' });
  
        // Compare old and new placement
        if (JSON.stringify(content.placement) === JSON.stringify(placement)) {
            return res.status(400).json({ message: "No changes detected" });
        }
  
        // Store edit request
        const contentEdit = new ContentEdit({
            guide_id,
            step_id,
            content_id,
            user_id, // Extracted from JWT token
            old_placement: content.placement, // Store existing placement
            new_placement: placement, // Store requested change
            status: "pending"
        });
  
        await contentEdit.save();
        res.json({"data":encryptTextToBytes(JSON.stringify({ message: "Edit request created", edit_id: contentEdit._id, status: "pending" }))});
  
    } catch (error) {
        res.json({ "data": encryptTextToBytes(JSON.stringify({ error: error.message })) });    }
  });

module.exports = router;
