const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        console.error('Validation Error:', errorMessage, 'Body:', req.body);
        return res.status(400).json({ error: errorMessage });
    }

    next();
};

module.exports = validate;
