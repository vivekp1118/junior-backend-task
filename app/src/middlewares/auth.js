import jwt from "jsonwebtoken";
import { notFound, unauthorized } from "../../utils/responseHandler.js";
import User from "../services/user/user.model.js";
import { handleError } from "../../utils/handleError.js";

export const authenticate = async (req, res, next) => {
    try {
        const token =
            req.cookies.access_token ||
            (req.headers.authorization && req.headers.authorization.startsWith("Bearer") ? req.headers.authorization.split(" ")[1] : null);

        if (!token) {
            return unauthorized(res, "Authentication required");
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return unauthorized(res, "Session has expired, please login again");
            }
            return unauthorized(res, "Invalid authentication token");
        }

        // Find user by decoded ID
        const user = await User.findById(decoded.id).select("-password").lean();

        if (!user) {
            return notFound(res, "User not found");
        }

        // Set user in request object
        req.user = user;

        // Set createdBy if user is admin
        if (user.role === "admin") {
            req.body.createdBy = user._id;
        }

        next();
    } catch (err) {
        return handleError(err, res);
    }
};

export const getCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction, // True in production, false in development
        sameSite: isProduction ? "None" : "Lax", // More permissive in development
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };
};

export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        return unauthorized(res, "Admin access required");
    }
};
