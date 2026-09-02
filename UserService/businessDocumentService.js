const createBusinessDocuments = async (
    connection,
    businessId,
    documents
) => {

    // No documents provided
    if (
        !Array.isArray(documents) ||
        documents.length === 0
    ) {
        return;
    }


    const sql = `
        INSERT INTO business_document (
            business_id,
            document_type,
            document_name,
            document_path
        )
        VALUES (?, ?, ?, ?)
    `;


    for (const document of documents) {

        // =====================================================
        // VALIDATION
        // =====================================================

        if (!document.document_type) {
            throw new Error(
                "Document type is required"
            );
        }


        if (!document.document_name) {
            throw new Error(
                "Document name is required"
            );
        }


        if (!document.document_path) {
            throw new Error(
                "Document path is required"
            );
        }


        // =====================================================
        // INSERT DOCUMENT
        // =====================================================

        await connection.query(
            sql,
            [
                businessId,
                document.document_type,
                document.document_name,
                document.document_path
            ]
        );
    }
};


module.exports = {
    createBusinessDocuments
};