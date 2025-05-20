import express from "express";
import { createReview, updateReview, deleteReview } from "./review.controllers.js";
import { authenticate } from "../../middlewares/auth.js";

const router = express.Router();

router.post("/books/:id/reviews", authenticate, createReview);
router.put("/reviews/:id", authenticate, updateReview);
router.delete("/reviews/:id", authenticate, deleteReview);

export default router;
