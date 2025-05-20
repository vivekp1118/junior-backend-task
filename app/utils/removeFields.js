const defaultFieldsToRemove = ["createdAt", "updatedAt", "__v", "password"];

export const removeFields = (data, fields = [], append = false) => {
    try {
        const allFields = append ? [...new Set([...fields, ...defaultFieldsToRemove])] : fields.length ? fields : defaultFieldsToRemove;

        // remove fields array from object
        if (Array.isArray(data)) {
            return data.map((item) => removeFields(item, allFields, false));
        }

        if (typeof data !== "object" || data === null) {
            console.error("Invalid object provided");
            return data;
        }

        const plainObj = data.toObject?.() || { ...data };

        allFields.forEach((field) => {
            delete plainObj[field];
        });

        return plainObj;
    } catch (error) {
        console.error("An error occurred while removing fields: ", error);
        throw error;
    }
};
