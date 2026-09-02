const createClientReferences = async (
    connection,
    maturityId,
    references
) => {

    // No references provided
    if (
        !Array.isArray(references) ||
        references.length === 0
    ) {
        return;
    }


    const sql = `
        INSERT INTO business_client_reference (
            maturity_id,
            client_name,
            contact_number,
            email,
            work_done
        )
        VALUES (?, ?, ?, ?, ?)
    `;


    for (const reference of references) {

        if (!reference.client_name) {
            throw new Error(
                "Client reference name is required"
            );
        }


        await connection.query(
            sql,
            [
                maturityId,
                reference.client_name,
                reference.contact_number || null,
                reference.email || null,
                reference.work_done || null
            ]
        );
    }
};


module.exports = {
    createClientReferences
};