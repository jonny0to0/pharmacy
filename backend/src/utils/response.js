export const sendSuccess = (res, data, message = "Success", meta) => {
    return res.status(200).json({
        success: true,
        data,
        message,
        ...(meta && { meta }),
    });
};
export const sendError = (res, error, status = 500, code) => {
    return res.status(status).json({
        success: false,
        error,
        ...(code && { code }),
    });
};
export const paginate = (total, page, limit) => {
    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};
//# sourceMappingURL=response.js.map