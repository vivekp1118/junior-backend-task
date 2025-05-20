import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./user.model.js";
import { badRequest, created, success, unauthorized } from "../../../utils/responseHandler.js";
import { handleError } from "../../../utils/handleError.js";
import { z } from "zod";
import { removeFields } from "../../../utils/removeFields.js";
import { getCookieOptions } from "../../middlewares/auth.js";

// username validation function
const isValidUsername = (username) => {
    // Only allow letters, numbers, underscores and hyphens
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    return usernameRegex.test(username);
};

// password validation function
const isStrongPassword = (password) => {
    // At least 8 characters, one uppercase, one lowercase, one number, one special
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

const registerSchema = z.object({
    name: z.string().min(1, "Name is required").trim(),
    email: z.string().email("Invalid email").trim().toLowerCase(),
    password: z.string().min(8, "Password must be at least 8 characters").refine(isStrongPassword, {
        message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
    userName: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username cannot exceed 30 characters")
        .trim()
        .toLowerCase()
        .refine(isValidUsername, {
            message: "Username can only contain letters, numbers, underscores and hyphens",
        }),
});

const updateUserSchema = registerSchema.partial();

const register = async (req, res) => {
    try {
        const result = registerSchema.safeParse(req.body);
        if (!result.success) throw result.error;

        const { name, email, password, userName } = result.data;

        // check email already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) return badRequest(res, "Email already in use");

        // username validation
        const existingUsername = await User.findOne({ userName });
        if (existingUsername) return badRequest(res, "Username already taken");

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({ name, email, password: hashedPassword, userName });
        if (!user) return badRequest(res, "Registration failed");

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });
        res.cookie("access_token", token, getCookieOptions());

        // remove password from object
        const sanitizedUser = removeFields(user.toObject(), ["password"], true);
        return created(res, sanitizedUser, "User created successfully");
    } catch (error) {
        return handleError(error, res);
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // normalize email
        const cleanEmail = email?.trim().toLowerCase();

        if (!cleanEmail || !password) {
            return badRequest(res, "Email and password are required");
        }

        const user = await User.findOne({ email: cleanEmail });
        if (!user) return unauthorized(res, "Invalid credentials");

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return unauthorized(res, "Invalid credentials");

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });
        res.cookie("access_token", token, getCookieOptions());

        // remove password from object
        const sanitizedUser = removeFields(user.toObject(), ["password"], true);
        return success(res, sanitizedUser, "Logged in successfully");
    } catch (error) {
        return handleError(error, res);
    }
};

const logout = (req, res) => {
    try {
        res.clearCookie("access_token", getCookieOptions());
        return success(res, null, "Logged out successfully");
    } catch (error) {
        return handleError(error, res);
    }
};

const getCurrentUser = (req, res) => {
    try {
        return success(res, req.user, "User retrieved successfully");
    } catch (error) {
        return handleError(error, res);
    }
};

const updateUser = async (req, res) => {
    try {
        const result = updateUserSchema.safeParse(req.body);
        if (!result.success) throw result.error;

        // check if user exists
        const updateData = {};
        if (result.data.name) updateData.name = result.data.name;
        if (result.data.userName) {
            // check username  already exists
            if (result.data.userName !== req.user.userName) {
                const existingUsername = await User.findOne({ userName: result.data.userName });
                if (existingUsername) return badRequest(res, "Username already taken");
            }
            updateData.userName = result.data.userName;
        }

        // check if email already exists
        if (result.data.password) {
            updateData.password = await bcrypt.hash(result.data.password, 12);
        }

        const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
        const userDetails = removeFields(updatedUser.toObject(), ["password"], true);
        return success(res, userDetails, "User updated successfully");
    } catch (error) {
        return handleError(error, res);
    }
};

const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user._id);
        res.clearCookie("access_token", getCookieOptions());
        return success(res, null, "User deleted successfully");
    } catch (error) {
        return handleError(error, res);
    }
};

export { register, login, logout, getCurrentUser, updateUser, deleteUser };
