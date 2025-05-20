import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        author: {
            type: String,
            required: true,
            trim: true,
        },
        genre: {
            type: [String],
            required: true,
            validate: {
                validator: function (v) {
                    return v && v.length > 0;
                },
                message: "At least one genre is required",
            },
        },
        description: {
            type: String,
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for average rating
bookSchema.virtual("averageRating").get(function () {
    if (!this.reviews || this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / this.reviews.length).toFixed(1);
});

// Virtual for reviews so dont have to insert reviews in the book schema every time
bookSchema.virtual("reviews", {
    ref: "Review",
    localField: "_id",
    foreignField: "book",
});

const Book = mongoose.model("Book", bookSchema);
export default Book;
