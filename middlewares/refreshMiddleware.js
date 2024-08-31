const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");

exports.checkTokenExpiration = catchAsyncErrors(async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return next(new ErrorHandler("Token not provided", 401));
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        next(); // If the token is valid, proceed to the next middleware
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            // Token expired, try to refresh it
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                return next(new ErrorHandler("Refresh Token not provided", 401));
            }

            try {
                const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

                // Update the access token
                res.cookie("token", newAccessToken, { httpOnly: true, secure: true });
                next(); // Continue with the request
            } catch (error) {
                return next(new ErrorHandler("Invalid Refresh Token", 401));
            }
        } else {
            return next(new ErrorHandler("Invalid Token", 401));
        }
    }
});