const uploadDocument = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Return the file path relative to the server (to be stored in DB)
        // Adjust standard URL path
        const fileUrl = `/uploads/documents/${req.file.filename}`;

        res.json({
            message: 'File uploaded successfully',
            url: fileUrl,
            filename: req.file.filename,
            originalName: req.file.originalname
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
};

module.exports = {
    uploadDocument
};
