const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            res.status(400);
            const message = error.details.map((detail) => detail.message).join(', ');
            throw new Error(message);
        }
        next();
    };
};

module.exports = validateRequest;
