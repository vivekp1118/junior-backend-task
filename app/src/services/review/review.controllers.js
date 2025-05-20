import { z } from "zod";
import Review from "./review.model.js";
import Book from "../book/book.model.js";
import { success, badRequest, notFound, unauthorized } from "../../../utils/responseHandler.js";
import { handleError } from "../../../utils/handleError.js";

// Validation schemas
const reviewSchema = z.object({
    rating: z.number().int("Rating must be a whole number").min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
    comment: z.string().min(5, "Comment must be at least 5 characters").max(1000, "Comment cannot exceed 1000 characters").trim(),
});

// create  review
export const createReview = async (req, res) => {
    try {
        const result = reviewSchema.safeParse(req.body);
        if (!result.success) throw result.error;

        // validate book id
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return badRequest(res, "Invalid book ID format");
        }

        const book = await Book.findById(req.params.id);
        if (!book) return notFound(res, "Book not found");

        //cannot review own book
        if (book.createdBy.toString() === req.user._id.toString()) {
            return badRequest(res, "You cannot review your own book");
        }

        // check already reviewed
        const existingReview = await Review.findOne({
            book: req.params.id,
            user: req.user._id,
        });

        if (existingReview) {
            return badRequest(res, "You have already reviewed this book");
        }

        const review = await Review.create({
            ...result.data,
            book: req.params.id,
            user: req.user._id,
        });

        // add review to book
        const populatedReview = await Review.findById(review._id).populate("user", "name userName").populate("book", "title author");

        return success(res, populatedReview, "Review created successfully");
    } catch (error) {
        return handleError(error, res);
    }
};

// update review
export const updateReview = async (req, res) => {
    try {
        const result = reviewSchema.safeParse(req.body);
        if (!result.success) throw result.error;

        // validate review id
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return badRequest(res, "Invalid review ID format");
        }

        const review = await Review.findById(req.params.id);
        if (!review) return notFound(res, "Review not found");

        // check if own review
        if (review.user.toString() !== req.user._id.toString()) {
            return unauthorized(res, "You can only update your own reviews");
        }

        //  old reviews cannot be updated
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        if (review.createdAt < thirtyDaysAgo) {
            return badRequest(res, "Reviews older than 30 days cannot be updated");
        }

        const updatedReview = await Review.findByIdAndUpdate(req.params.id, result.data, { new: true })
            .populate("user", "name userName")
            .populate("book", "title author");

        return success(res, updatedReview, "Review updated successfully");
    } catch (error) {
        return handleError(error, res);
    }
};

// delete a review
export const deleteReview = async (req, res) => {
    try {
        // validate review id
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return badRequest(res, "Invalid review ID format");
        }

        const review = await Review.findById(req.params.id);
        if (!review) return notFound(res, "Review not found");

        // check if own review or admin
        const isOwner = review.user.toString() === req.user._id.toString();

        if (!isOwner) {
            return unauthorized(res, "You can only delete your own reviews");
        }

        await Review.findByIdAndDelete(req.params.id);

        return success(res, null, "Review deleted successfully");
    } catch (error) {
        return handleError(error, res);
    }
};

// get all reviews for a book
export const getBookReviews = async (req, res) => {
    try {
        // validate book id
        if (!req.params.bookId.match(/^[0-9a-fA-F]{24}$/)) {
            return badRequest(res, "Invalid book ID format");
        }

        const book = await Book.findById(req.params.bookId);
        if (!book) return notFound(res, "Book not found");

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // pagination parameters
        let sort = { createdAt: -1 };
        if (req.query.sort === "rating-high") sort = { rating: -1 };
        if (req.query.sort === "rating-low") sort = { rating: 1 };
        if (req.query.sort === "oldest") sort = { createdAt: 1 };

        const reviews = await Review.find({ book: req.params.bookId }).populate("user", "name userName").sort(sort).skip(skip).limit(limit);

        const total = await Review.countDocuments({ book: req.params.bookId });

        return success(
            res,
            {
                reviews,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
            "Reviews retrieved successfully"
        );
    } catch (error) {
        return handleError(error, res);
    }
};
