const mysql = require("mysql2/promise");

// =====================================
// MYSQL CONNECTION POOL
// =====================================

const pool = mysql.createPool({

    host: "localhost",
    user: "root",
    password: "",
    database: "hci",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0

});

// =====================================
// HELPER
// =====================================

async function query(sql, params = []) {

    const [rows] = await pool.execute(sql, params);

    return rows;

}

// =====================================
// TREE
// =====================================

async function getTree() {

    return query(`
        SELECT
            old_id,
            IDParent,
            line_no,
            Description,
            Quantity,
            UOM
        FROM bq_sections
        ORDER BY line_no
    `);

}

// =====================================
// BID LISTING
// =====================================

async function getBidListing(id) {

    return query(`
        SELECT
            BLID,
            line_no,
            Description,
            Quantity,
            UOM
        FROM bid_lines
        WHERE BQS_ID = ?
        ORDER BY BLID
    `, [id]);

}

// =====================================
// RESOURCES
// =====================================

async function getResources(id) {

    return query(`
        SELECT
            Code,
            Description,
            Category,
            Qty,
            Rate,
            \`Unit Cost\`,
            \`Total Cost\`
        FROM resources
        WHERE BQS_ID = ?
        ORDER BY Category, Code
    `, [id]);

}

// =====================================
// CREW
// =====================================

async function getCrew(id) {

    return query(`
        SELECT
            BLID,
            Code,
            Description,
            Qty,
            Rate,
            \`Unit Cost\`,
            \`Total Cost\`
        FROM crew
        WHERE BQS_ID = ?
        ORDER BY Code
    `, [id]);

}

// =====================================
// MATERIAL
// =====================================

async function getMaterial(id) {

    return query(`
        SELECT
            BLID,
            Code,
            Description,
            Quantity,
            UOM,
            \`Unit Cost\`,
            \`Total Cost\`,
            Category
        FROM material
        WHERE BQS_ID = ?
        ORDER BY Code
    `, [id]);

}

// =====================================
// LABOR RATES
// =====================================

async function getLaborRates() {

    return query(`
        SELECT
            Code,
            Description,
            \`Base Rate\`,
            Burdens,
            \`Total Rate\`
        FROM labor
        ORDER BY Code
    `);

}

// =====================================
// MATERIAL RATES
// =====================================

async function getMaterialRates() {

    return query(`
        SELECT
            Code,
            Description,
            \`Base Rate\`,
            Burdens,
            \`Total Rate\`
        FROM material_rates
        ORDER BY Code
    `);

}

// =====================================
// EQUIPMENT RATES
// =====================================

async function getEquipmentRates() {

    return query(`
        SELECT
            Code,
            Description,
            \`Rental Rate\`,
            \`Internal Rate\`
        FROM equipment
        ORDER BY Code
    `);

}

// =====================================
// EXPORTS
// =====================================

module.exports = {

    pool,
    query,

    getTree,
    getBidListing,
    getResources,
    getCrew,
    getMaterial,

    getLaborRates,
    getMaterialRates,
    getEquipmentRates

};