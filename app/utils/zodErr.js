export const zodError = (arr) => {
    const errObj = {};
    arr.forEach((err) => {
        errObj[err.path.join(".")] = err.message;
    });

    console.log("errObj: ", errObj);

    const errorString = Object.entries(errObj)
        .map(([key, message]) => `${key}: ${message}`)
        .join(", \n ");

    return errorString;
};
