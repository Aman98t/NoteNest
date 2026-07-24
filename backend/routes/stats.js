const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Activity = require('../models/Activity');

// Helper: Get today's date in YYYY-MM-DD format (IST adjusted)
const getTodayDateString = () => {
  const today = new Date();
  today.setHours(today.getHours() + 5);
  today.setMinutes(today.getMinutes() + 30);
  return today.toISOString().split('T')[0];
};

// GET /api/stats/heatmap - Fetch activity data for the last 12 months
router.get('/heatmap', auth, async (req, res) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const dateLimit = oneYearAgo.toISOString().split('T')[0];

    const activities = await Activity.find({
      userId: req.user.id,
      date: { $gte: dateLimit }
    }).select('date noteCount -_id').sort({ date: 1 });

    res.json(activities);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// GET /api/stats/streak - Calculate current and longest streak
router.get('/streak', auth, async (req, res) => {
  try {
    // Fetch all dates for the user, newest first
    const activities = await Activity.find({ userId: req.user.id }).select('date').sort({ date: -1 });
    const dates = activities.map(a => a.date);

    let currentStreak = 0;
    let longestStreak = 0;

    if (dates.length > 0) {
      // 1. Calculate Longest Streak
      let tempStreak = 1;
      longestStreak = 1;
      
      for (let i = 0; i < dates.length - 1; i++) {
        const currDate = new Date(dates[i]);
        const prevDate = new Date(dates[i + 1]);
        const diffTime = Math.abs(currDate - prevDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
        } else {
          tempStreak = 1; // reset temp streak if gap is > 1 day
        }
      }

      // 2. Calculate Current Streak
      const todayStr = getTodayDateString();
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() + 5);
      yesterday.setMinutes(yesterday.getMinutes() + 30);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Current streak is active only if the last activity was today or yesterday
      if (dates[0] === todayStr || dates[0] === yesterdayStr) {
        currentStreak = 1;
        let expectedDate = new Date(dates[0]);

        for (let i = 1; i < dates.length; i++) {
          expectedDate.setDate(expectedDate.getDate() - 1);
          const expectedStr = expectedDate.toISOString().split('T')[0];

          if (dates[i] === expectedStr) {
            currentStreak++;
          } else {
            break; // streak broken
          }
        }
      }
      
      // Edge case safety
      longestStreak = Math.max(longestStreak, currentStreak);
    }

    res.json({ currentStreak, longestStreak });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;