const logger = require("../logger");

// Middleware for logging requests
function logRequest(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    logger.info(`Received ${req.method} request for ${req.originalUrl} from ${ip}`);
    next();
}

module.exports = { logRequest };