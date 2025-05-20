import express from "express";
import userRoutes from "../src/services/user/user.routes.js";
import bookRoutes from "../src/services/book/book.routes.js";
import reviewRoutes from "../src/services/review/review.routes.js";

const router = express.Router();

const defaultRoutes = [
    {
        path: "/user",
        route: userRoutes,
    },
    {
        path: "/books",
        route: bookRoutes,
    },
    {
        path: "/",
        route: reviewRoutes,
    },
];

defaultRoutes.forEach(({ path, route }) => {
    router.use(path, route);
});

export default router;
