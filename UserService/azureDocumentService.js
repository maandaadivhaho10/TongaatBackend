
const {
    containerClient
} = require("../config/azureDocumentStorage");

const path = require("path");
const crypto = require("crypto");

// =====================================================
// UPLOAD DOCUMENT TO AZURE
// =====================================================

const uploadDocument = async (file, businessId) => {

    if (!file || !file.buffer) {
        throw new Error("Valid document file is required");
    }

    if (!businessId) {
        throw new Error("Business ID is required");
    }

    const startTime = Date.now();

    const extension = path.extname(file.originalname);

    const blobName =
        `${businessId}/${crypto.randomUUID()}${extension}`;

    const blockBlobClient =
        containerClient.getBlockBlobClient(blobName);

    console.log(`Starting Azure upload: ${file.originalname}`);

    await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
            blobContentType: file.mimetype
        }
    });

    console.log(
        `Azure upload completed in ${Date.now() - startTime} ms`
    );

    return {
        document_name: file.originalname,
        document_path: blockBlobClient.url,
        blob_name: blobName
    };
};

// =====================================================
// DELETE DOCUMENT FROM AZURE
// =====================================================

const deleteDocument = async (blobName) => {

    if (!blobName) return;

    const blockBlobClient =
        containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.deleteIfExists();

    console.log(`Azure document deleted: ${blobName}`);
};

module.exports = {
    uploadDocument,
    deleteDocument
};
