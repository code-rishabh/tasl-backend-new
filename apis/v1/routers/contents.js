const express = require('express');
const router = express.Router();
const Guide = require('../models/Guide');
const ContentEdit = require('../models/contentEdit')



router.post('/add-content', async (req, res) => {
    try {
        const { guide_id, step_id, type, placement, link,filename } = req.body;

        if (!guide_id || !step_id || !type || !placement || !link) {
            return res.status(400).json({ status: false, message: 'guide_id, step_id, type, placement, and link are required' });
        }

        // Find the guide and populate its steps
        const guide = await Guide.findById(guide_id).populate('steps');
        if (!guide) {
            return res.status(404).json({ status: false, message: 'Guide not found' });
        }

        // Validate step_id within the guide's steps list
        if (step_id < 1 || step_id > guide.steps.length) {
            return res.status(400).json({ status: false, message: 'Invalid step_id' });
        }

        // Get the correct step
        const step = guide.steps[step_id - 1];

        if (!step) {
            return res.status(404).json({ status: false, message: 'Step not found' });
        }

        // Create a new content object
        const newContent = {
            type,
            placement,
            link,
            filename
        };

        // Add the content object to the contents array
        step.contents.push(newContent);

        step.updated_at = Date.now();
        await step.save();

        res.status(200).json({
            status: true,
            message: 'Content added successfully',
            step,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: 'Server error' });
    }
});

router.post('/edit-content', async (req, res) => {
    const { guide_id, step_id, content_id, placement } = req.body;
  
    if (!guide_id || !step_id || !content_id || !placement) {
      return res.status(400).send('Missing required fields');
    }
  
    try {
      // Find the guide by ID
      const guide = await Guide.findById(guide_id);
      if (!guide) {
        return res.status(404).send('Guide not found');
      }
  
      // Find the step in the guide by step_id
      const step = guide.steps.id(step_id);
      if (!step) {
        return res.status(404).send('Step not found');
      }
  
      // Find the content in the step by content_id and update its placement
      const content = step.contents.id(content_id);
      if (!content) {
        return res.status(404).send('Content not found');
      }
  
      // Update the placement of the content
      content.placement = placement;
  
      // Save the guide
      await guide.save();
  
      res.status(200).json({"message:":'Content updated successfully'});
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });


  router.post('/approve-content-edit/:editId', async (req, res) => {
    try {
      const { editId } = req.params;
  
      // Find edit request
      const contentEdit = await ContentEdit.findById(editId);
      if (!contentEdit) return res.status(404).json({ error: "Edit request not found" });
  
      // Find the guide, step, and content
      const guide = await Guide.findById(contentEdit.guide_id);
      if (!guide) return res.status(404).json({ error: "Guide not found" });
  
      const step = guide.steps.id(contentEdit.step_id);
      if (!step) return res.status(404).json({ error: "Step not found" });
  
      const content = step.contents.id(contentEdit.content_id);
      if (!content) return res.status(404).json({ error: "Content not found" });
  
      // Apply the approved change
      content.placement = contentEdit.new_placement;
  
      // Save updated guide
      await guide.save();
  
      // Update the request status
      contentEdit.status = "approved";
      await contentEdit.save();
  
      res.json({ message: "Edit approved and applied" });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });



  router.post('/reject-content-edit/:editId', async (req, res) => {
    try {
      const { editId } = req.params;
  
      // Find and update the request status
      const contentEdit = await ContentEdit.findByIdAndUpdate(editId, { status: "rejected" }, { new: true });
      if (!contentEdit) return res.status(404).json({ error: "Edit request not found" });
  
      res.json({ message: "Edit request rejected" });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });




module.exports = router;