const multer = require("multer");

const storage = multer.memoryStorage();

const uploadDocuments = multer({
    storage: storage,

    limits: {
        files: 3,
        fileSize: 10 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png"
        ];

        if (
            allowedTypes.includes(file.mimetype)
        ) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only PDF, JPG and PNG documents are allowed"
                )
            );
        }
    }
});

module.exports = uploadDocuments;