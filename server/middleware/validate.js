const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        // Create a safe copy of body for logging
        const safeBody = { ...req.body };
        if (safeBody.password) safeBody.password = '***MASKED***';

        console.error('Validation Error:', errorMessage, 'Body:', safeBody);
        return res.status(400).json({ error: errorMessage });
    }

    next();
};

module.exports = validate;
