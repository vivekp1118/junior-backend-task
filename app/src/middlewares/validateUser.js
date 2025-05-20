import { notFound } from "../../utils/responseHandler.js";
import User from "../services/user/user.model.js";

export const validateUserId = async (req, res, next) => {
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: "User ID is required" });

    try {
        const user = await User.findById(userId);
        if (user) req.body.userData = user;
    } catch (error) {
        console.error(error);
        return notFound(res, "User not found", error.message);
    }

    next();
};
