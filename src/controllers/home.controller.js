const asyncHandler = require('../utils/async-handler');
const env = require('../config/env');
const homeService = env.USE_MOCK ? require('../services/mock-home.service') : require('../services/home.service');

// Render home/dashboard page with news list
exports.renderHome = asyncHandler(async (req, res) => {
  const newsList = await homeService.getNews();
  res.render('home/home', { title: 'Trang chủ', news: newsList });
});