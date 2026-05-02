import TestResult from "../model/TestResult.model.js"
import mongoose from "mongoose"

async function HandleUserHistory(req,res) {
    try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const [results, total] = await Promise.all([
      TestResult.find({ userId: req.user._id })
        .sort({ createdAt: -1 })          
        .skip(skip)
        .limit(limit)
        .populate('paragraphId', 'content category difficulty'),
      TestResult.countDocuments({ userId: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      page,
      totalPages : Math.ceil(total / limit),
      totalTests : total,
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


async function HandleUserStats(req,res) {
    try {
    const stats = await TestResult.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id          : null,
          totalTests   : { $sum: 1 },
          bestWpm      : { $max: '$wpm' },
          averageWpm   : { $avg: '$wpm' },
          averageAccuracy: { $avg: '$accuracy' },
          totalTime    : { $sum: '$duration' },   // in seconds
        },
      },
      {
        $project: {
          _id             : 0,
          totalTests      : 1,
          bestWpm         : 1,
          averageWpm      : { $round: ['$averageWpm', 1] },
          averageAccuracy : { $round: ['$averageAccuracy', 1] },
          totalTimeMinutes: { $round: [{ $divide: ['$totalTime', 60] }, 1] },
        },
      },
    ]);

    // If user has never taken a test, return safe defaults
    const data = stats[0] || {
      totalTests      : 0,
      bestWpm         : 0,
      averageWpm      : 0,
      averageAccuracy : 0,
      totalTimeMinutes: 0,
    };

    res.status(200).json({ success: true, stats: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
    
}
export {
    HandleUserHistory,
    HandleUserStats
}