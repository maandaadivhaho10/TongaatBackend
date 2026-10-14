require("dotenv").config();

const {
    BlobServiceClient
} = require("@azure/storage-blob");

const connectionString =
    process.env.AZURE_STORAGE_CONNECTION_STRING;

const containerName =
    process.env.AZURE_STORAGE_CONTAINER_NAME;

// Check environment variables
if (!connectionString) {
    throw new Error(
        "AZURE_STORAGE_CONNECTION_STRING is missing from .env"
    );
}

if (!containerName) {
    throw new Error(
        "AZURE_STORAGE_CONTAINER_NAME is missing from .env"
    );
}

const blobServiceClient =
    BlobServiceClient.fromConnectionString(
        connectionString
    );

const containerClient =
    blobServiceClient.getContainerClient(
        containerName
    );

module.exports = {
    blobServiceClient,
    containerClient
};