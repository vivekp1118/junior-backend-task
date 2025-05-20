import express from "express";
import { createBook, getBooks, getBookById, searchBooks } from "./book.controllers.js";
import { authenticate } from "../../middlewares/auth.js";

const router = express.Router();

// public routes
router.get("/", getBooks);
router.get("/search", searchBooks);
router.get("/:id", getBookById);

// authenticated routes
router.post("/", authenticate, createBook);

export default router;
