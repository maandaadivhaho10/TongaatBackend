const createFarm = async (
    connection,
    userId,
    farm
) => {

    // No farm provided
    if (!farm || typeof farm !== "object") {
        throw new Error("Farm information is required");
    }


    // Farm name is required
    if (!farm.farm_name) {
        throw new Error(
            "Farm name is required"
        );
    }


    const sql = `
        INSERT INTO farm (
            user_id,
            farm_name,
            farm_size,
            farm_size_unit,
            location,
            closest_milling
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;


    const [result] = await connection.query(
        sql,
        [
            userId,
            farm.farm_name,
            farm.farm_size || null,
            farm.farm_size_unit || "hectares",
            farm.location || null,
            farm.closest_milling || null
        ]
    );


    return result.insertId;
};


module.exports = {
    createFarm
};