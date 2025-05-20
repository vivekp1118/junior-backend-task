import { z } from "zod";
import Book from "./book.model.js";
import Review from "../review/review.model.js";
import { success, badRequest, notFound } from "../../../utils/responseHandler.js";
import { handleError } from "../../../utils/handleError.js";

// Validation schemas
const bookSchema = z.object({
    title: z.string().min(1, "Title is required").max(200, "Title cannot exceed 200 characters").trim(),
    author: z
        .string()
        .min(2, "Author name must be at least 2 characters")
        .max(100, "Author name cannot exceed 100 characters")
        .trim()
        .regex(/^[a-zA-Z\s\-'.]+$/, "Author name can only contain letters, spaces, hyphens, apostrophes, and periods"),
    genre: z
        .array(z.string().trim().min(1))
        .min(1, "At least one genre is required")
        .max(5, "Maximum 5 genres allowed")
        .refine((genres) => genres.every((g) => g.length <= 50), {
            message: "Each genre cannot exceed 50 characters",
        }),
    description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description cannot exceed 2000 characters").trim(),
});

// Create a new book
export const createBook = async (req, res) => {
    try {
        const result = bookSchema.safeParse(req.body);
        if (!result.success) throw result.error;

        // Check for duplicate book titles by the same author
        const existingBook = await Book.findOne({
            title: { $regex: new RegExp(`^${result.data.title.trim()}$`, "i") },
            author: { $regex: new RegExp(`^${result.data.author.trim()}$`, "i") },
        });

        if (existingBook) {
            return badRequest(res, "A book with this title and author already exists");
        }

        const book = await Book.create({
            ...result.data,
            createdBy: req.user._id,
        });

        return success(res, book, "Book created successfully");
    } catch (error) {
        return handleError(error, res);
    }
};

// get all books with pagination and filters
export const getBooks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // pagination parameters
        if (page < 1) return badRequest(res, "Page must be at least 1");
        if (limit < 1 || limit > 50) return badRequest(res, "Limit must be between 1 and 50");

        const skip = (page - 1) * limit;

        // query filters
        const query = {};
        if (req.query.author) query.author = new RegExp(req.query.author.trim(), "i");
        if (req.query.genre) {
            query.genre = { $in: [new RegExp(req.query.genre.trim(), "i")] };
        }
        if (req.query.title) query.title = new RegExp(req.query.title.trim(), "i");

        // sort options
        let sort = { createdAt: -1 };
        if (req.query.sort) {
            const sortField = req.query.sort;
            const sortDirection = req.query.order === "asc" ? 1 : -1;

            // sort field
            const allowedSortFields = ["title", "author", "createdAt"];
            if (allowedSortFields.includes(sortField)) {
                sort = { [sortField]: sortDirection };
            }
        }

        const books = await Book.find(query).populate("createdBy", "name userName").skip(skip).limit(limit).sort(sort);

        const total = await Book.countDocuments(query);

        return success(
            res,
            {
                books,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
            "Books retrieved successfully"
        );
    } catch (error) {
        return handleError(error, res);
    }
};

// get book by ID with reviews
export const getBookById = async (req, res) => {
    try {
        // validate book ID format (objectId)
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return badRequest(res, "Invalid book ID format");
        }

        // get review pagination parameters
        const page = parseInt(req.query.page) || 1;
        const reviewLimit = parseInt(req.query.reviewLimit) || 10;

        const book = await Book.findById(req.params.id)
            .populate("createdBy", "name userName")
            .populate({
                path: "reviews",
                options: {
                    limit: reviewLimit,
                    skip: (page - 1) * reviewLimit,
                    sort: { createdAt: -1 },
                },
                populate: {
                    path: "user",
                    select: "name userName",
                },
            });

        if (!book) return notFound(res, "Book not found");

        // review count
        const totalReviews = await Review.countDocuments({ book: req.params.id });

        const bookData = book.toObject();
        bookData.pagination = {
            page,
            limit: reviewLimit,
            total: totalReviews,
            pages: Math.ceil(totalReviews / reviewLimit),
        };

        return success(res, bookData, "Book retrieved successfully");
    } catch (error) {
        return handleError(error, res);
    }
};

// search books
export const searchBooks = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.trim().length < 2) {
            return badRequest(res, "Search query must be at least 2 characters");
        }

        // pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const searchRegex = new RegExp(query.trim(), "i");

        const books = await Book.find({
            $or: [{ title: searchRegex }, { author: searchRegex }, { genre: { $in: [searchRegex] } }],
        })
            .populate("createdBy", "name userName")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Book.countDocuments({
            $or: [{ title: searchRegex }, { author: searchRegex }, { genre: { $in: [searchRegex] } }],
        });

        return success(
            res,
            {
                books,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
            "Search results retrieved successfully"
        );
    } catch (error) {
        return handleError(error, res);
    }
};
