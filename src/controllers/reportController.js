const Animal = require('../models/Animal');
const DigitalTwin = require('../models/DigitalTwin');
const Report = require('../models/Report');
const { generateConservationStory } = require('../services/storyGenerator');

exports.generateStory = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.animalId);
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    const twin = await DigitalTwin.findOne({ animalId: animal._id });
    if (!twin) {
      return res.status(404).json({ success: false, message: 'Digital twin not found' });
    }

    const storyText = await generateConservationStory({
      animal,
      twin,
      medicalHighlights: req.body.medicalHighlights || null,
    });

    const report = await Report.create({
      animalId: animal._id,
      reportType: 'Conservation Story',
      generatedContent: storyText,
      generatedBy: req.user.id,
    });

    res.status(201).json({ success: true, report });
  } catch (error) {
    console.error('Story generation error:', error.message);
    if (error.message.includes('credit') || error.status === 429 || error.status === 401) {
      return res.status(503).json({
        success: false,
        message: 'AI story generation is not available right now (OpenAI billing/credits not yet set up). All other features are unaffected.',
      });
    }
    res.status(500).json({ success: false, message: 'Could not generate story. ' + error.message });
  }
};

exports.getStoriesForAnimal = async (req, res) => {
  try {
    const reports = await Report.find({ animalId: req.params.animalId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.togglePublish = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.isPublished = !report.isPublished;
    await report.save();

    res.status(200).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};