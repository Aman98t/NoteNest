const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Token header se nikalna
  const token = req.header('Authorization');
  
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Token verify karna ('Bearer <token>' format handle karne ke liye split use kiya hai)
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};