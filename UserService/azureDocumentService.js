const {
    containerClient
} = require("../config/azureDocumentStorage");

const path = require("path");
const crypto = require("crypto");

const uploadDocument = async (file, businessId) => {

    if (!file) {
        throw new Error("Document file is required");
    }

    const startTime = Date.now();

    console.log(
        `Starting Azure upload: ${file.originalname}`
    );

    console.log(
        `File size: ${file.size} bytes`
    );

    console.log(
        `MIME type: ${file.mimetype}`
    );

    const extension =
        path.extname(file.originalname);

    const uniqueName =
        `${businessId}/${crypto.randomUUID()}${extension}`;

    const blockBlobClient =
        containerClient.getBlockBlobClient(
            uniqueName
        );

    await blockBlobClient.uploadData(
        file.buffer,
        {
            blobHTTPHeaders: {
                blobContentType: file.mimetype
            }
        }
    );

    const duration =
        Date.now() - startTime;

    console.log(
        `Azure upload completed: ${file.originalname}`
    );

    console.log(
        `Upload time: ${duration} ms`
    );

    return {
        document_name: file.originalname,
        document_path: blockBlobClient.url
    };
};

module.exports = {
    uploadDocument
};