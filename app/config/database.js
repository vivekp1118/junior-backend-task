import { connect } from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
    console.log("process.env.MONGODB_URI: ", process.env.MONGODB_URI);
    try {
        await connect(process.env.MONGODB_URI);
        console.log("MongoDB Connected");
    } catch (error) {
        console.log("error: ", error);
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
};

export default connectDB;
