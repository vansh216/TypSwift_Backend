import mongoose from "mongoose"
import TestResult from "../model/TestResult.model.js"
import Paragraph  from '../model/Paragraph.model.js';



  async function HandleGetParagraph(req, res){
  try {
    const { difficulty, duration } = req.query;

    const query = { isActive: true };

    if (difficulty) query.difficulty = difficulty;
    if (duration)   query.suitableFor = parseInt(duration);

    const count = await Paragraph.countDocuments(query);

    if (count === 0) {
      return res.status(404).json({
        success: false,
        message: 'No paragraphs found for the selected filters',
      });
    }

    const randomSkip = Math.floor(Math.random() * count);

    const paragraph = await Paragraph.findOne(query).skip(randomSkip);

    res.status(200).json({
      success: true,
      paragraph,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


async function HandleSubmitTest  (req, res)  {
  try {
    const {
      wpm,
      accuracy,
      duration,
      errors,
      wpmHistory,
      paragraphId,
    } = req.body;

    // Basic validation
    if (!wpm || !accuracy || !duration) {
      return res.status(400).json({
        success: false,
        message: 'wpm, accuracy and duration are required',
      });
    }

    // Build result object
    // req.user is null for guests (optionalProtect)
    const resultData = {
      wpm,
      accuracy,
      duration,
      errorsCount      : errors     || 0,
      wpmHistory  : wpmHistory || [],
      paragraphId : paragraphId || null,
      userId      : req.user ? req.user._id : null,
    };

    const result = await TestResult.create(resultData);

    // Update paragraph usage stats if paragraphId provided
    if (paragraphId) {
      const paragraph = await Paragraph.findById(paragraphId);
      if (paragraph) {
        await paragraph.recordUsage(wpm);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Test result saved',
      result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
    HandleSubmitTest,
    HandleGetParagraph
}