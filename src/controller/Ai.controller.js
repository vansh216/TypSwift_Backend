import axios from 'axios';

// Helper 
const buildPrompt = ({ wpm, accuracy, duration, errors, wpmHistory, charErrors }) => {

  // Find slowest second
  const slowestSecond = wpmHistory.indexOf(Math.min(...wpmHistory)) + 1;

  // Find fastest second
  const fastestSecond = wpmHistory.indexOf(Math.max(...wpmHistory)) + 1;

  // Group char errors by character
  const errorMap = {};
  charErrors.forEach(({ expected }) => {
    errorMap[expected] = (errorMap[expected] || 0) + 1;
  });

  // Top 3 most missed characters
  const topMissed = Object.entries(errorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([char, count]) => `'${char}' missed ${count} times`)
    .join(', ');

  // WPM trend
  const firstHalf  = wpmHistory.slice(0, Math.floor(wpmHistory.length / 2));
  const secondHalf = wpmHistory.slice(Math.floor(wpmHistory.length / 2));
  const avgFirst   = Math.round(firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length);
  const avgSecond  = Math.round(secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length);
  const trend      = avgSecond > avgFirst ? 'improving' : avgSecond < avgFirst ? 'declining' : 'stable';

  return `
You are a professional typing coach analyzing a user's typing test performance.
Analyze the following data and give helpful, encouraging, and specific feedback.

TEST DATA:
- WPM (Words Per Minute): ${wpm}
- Accuracy: ${accuracy}%
- Test Duration: ${duration / 60} minutes
- Total Errors: ${errors}
- WPM Trend: ${trend} (first half avg: ${avgFirst} wpm, second half avg: ${avgSecond} wpm)
- Slowest moment: second ${slowestSecond}
- Fastest moment: second ${fastestSecond}
- Most missed characters: ${topMissed || 'none recorded'}

INSTRUCTIONS:
- Be encouraging and positive in tone
- Give specific actionable advice based on the data
- Keep each point concise — maximum 1 sentence each
- Respond ONLY with valid JSON — no extra text before or after

RESPOND WITH EXACTLY THIS JSON FORMAT:
{
  "summary": "one sentence overall summary of performance",
  "strengths": [
    "strength 1",
    "strength 2"
  ],
  "weaknesses": [
    "weakness 1",
    "weakness 2"
  ],
  "tips": [
    "tip 1",
    "tip 2",
    "tip 3"
  ],
  "encouragement": "one short motivational sentence"
}
`.trim();
};

// POST /api/ai/analyze
export const analyzeTest = async (req, res) => {
  try {
    const {
      wpm,
      accuracy,
      duration,
      errors,
      wpmHistory  = [],
      charErrors  = [],
    } = req.body;

    // Basic validation
    if (!wpm || !accuracy || !duration) {
      return res.status(400).json({
        success: false,
        message: 'wpm, accuracy and duration are required',
      });
    }

    // Build prompt
    const prompt = buildPrompt({
      wpm,
      accuracy,
      duration,
      errors     : errors || 0,
      wpmHistory,
      charErrors,
    });

    // ── Call OpenRouter API ──
    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}/chat/completions`,
      {
        model   : 'openai/gpt-4o-mini',
        messages: [
          {
            role   : 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens : 600,
      },
      {
        headers: {
          'Authorization'      : `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type'       : 'application/json',
          'HTTP-Referer'       : 'https://typswift.vercel.app',
          'X-Title'            : 'TypSwift',
        },
      }
    );

    // ── Parse response ──
    const rawContent = response.data.choices[0].message.content.trim();

    let feedback;
    try {
      // Clean response in case model adds markdown backticks
      const cleaned = rawContent
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      feedback = JSON.parse(cleaned);
    } catch (parseError) {
      // If JSON parsing fails return a default response
      return res.status(200).json({
        success : true,
        feedback: {
          summary       : `You typed at ${wpm} WPM with ${accuracy}% accuracy.`,
          strengths     : ['You completed the test', 'Keep practicing to improve'],
          weaknesses    : ['Could not analyze specific errors'],
          tips          : ['Practice daily for best results', 'Focus on accuracy before speed'],
          encouragement : 'Every test makes you better! Keep going 💪',
        },
      });
    }

    res.status(200).json({
      success : true,
      feedback,
    });

  } catch (error) {
    // Handle OpenRouter specific errors
    if (error.response?.status === 401) {
      return res.status(500).json({
        success: false,
        message: 'Invalid OpenRouter API key',
      });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'AI service is busy. Please try again in a moment.',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};