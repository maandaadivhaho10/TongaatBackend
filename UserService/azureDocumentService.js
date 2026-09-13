const {
    containerClient
} = require("../config/azureDocumentStorage")

const path = require("path");
const crypto = require("crypto");

const uploadDocument = async (file, businessId) => {

    if (!file) {
        throw new Error("Document file is required");
    }

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

    return {
        document_name: file.originalname,
        document_path: blockBlobClient.url
    };
};

module.exports = {
    uploadDocument
};