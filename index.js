import express, { json } from "express";
import connectDB from "./app/config/database.js";
import router from "./app/routes/index.js";
import cookieParser from "cookie-parser";
import cors from "cors";

// Get allowed origin from environment variable
const allowedOrigin = process.env.ALLOWED_ORIGIN;
const corsOptions = {
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
};

const app = express();
connectDB();

app.use(cors(corsOptions));
app.use(json());
app.use(cookieParser());

app.use("/v1", router);

const PORT = process.env.PORT || 5000;

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
