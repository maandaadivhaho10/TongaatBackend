const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
    storage,

    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },

    fileFilter: (req, file, cb) => {

        console.log("File name:", file.originalname);
        console.log("File type:", file.mimetype);

        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF and Word documents are allowed"));
        }
    }
});

module.exports = upload;