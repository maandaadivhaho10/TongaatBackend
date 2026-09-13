const {
    BlobServiceClient
} = require("@azure/storage-blob");

const blobServiceClient =
    BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
    );

const containerName =
    process.env.AZURE_STORAGE_CONTAINER_NAME;

const containerClient =
    blobServiceClient.getContainerClient(
        containerName
    );

module.exports = {
    blobServiceClient,
    containerClient
};