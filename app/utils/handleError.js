import { z } from "zod";
import { zodError } from "./zodErr.js";
import { serverError } from "./responseHandler.js";

export const handleError = (error, res) => {
    if (error instanceof z.ZodError) {
        console.error("Z-ERROR", zodError(error.errors));
        return serverError(res, zodError(error.errors));
    } else {
        console.error("ERROR", error);
        return serverError(res, error.message);
    }
};
