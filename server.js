// const express = require("express");
// const mysql = require("mysql2/promise");
// const cors = require("cors");

// const app = express();
// const port = 3000;

// app.use(cors());

// async function getConnection() {
//     return await mysql.createConnection({
//         host: "localhost",
//         user: "root",
//         password: "",
//         database: "hci",
//     });
// }

// // LIST TABLES
// app.get("/tables", async (req, res) => {
//     const conn = await getConnection();
//     const [rows] = await conn.query("SHOW TABLES");
//     await conn.end();
//     res.json(rows);
// });

// // GET TABLE DATA (JSON ONLY)
// app.get("/table/:name", async (req, res) => {
//     try {
//         const conn = await getConnection();

//         const [rows] = await conn.query(
//             `SELECT * FROM \`${req.params.name}\` LIMIT 200`
//         );

//         await conn.end();

//         res.json(rows);

//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// app.get("/tree", async (req, res) => {
//     try {
//         const conn = await getConnection();

//         const [rows] = await conn.query(`
//             SELECT
//                 old_id,
//                 IDParent,
//                 Level,
//                 line_no,
//                 Description,
//                 Quantity,
//                 UOM
//             FROM bq_sections
//             ORDER BY Level, Sequence
//         `);

//         await conn.end();

//         res.json(rows);

//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
// app.get("/resources/:blid", async (req, res) => {

//     try {

//         const conn = await getConnection();

//         const [rows] = await conn.query(`
//             SELECT
//                 BLID,
//                 Code,
//                 Description,
//                 Type,
//                 Qty,
//                 Rate,
//                 \`Unit Cost\`,
//                 \`Total Cost\`,
//                 Category
//             FROM s_labeq
//             WHERE BLID = ?
//             ORDER BY Sequence
//         `, [req.params.blid]);

//         await conn.end();

//         res.json(rows);

//     } catch (err) {

//         res.status(500).json({
//             error: err.message
//         });

//     }

// });

// app.listen(port, () => {
//     console.log(`Server running: http://localhost:${port}`);
// });

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

async function getConnection() {
    return mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "hci"
    });
}

// ======================
// GET ALL TABLES
// ======================
app.get("/tables", async (req, res) => {
    let conn;

    try {
        conn = await getConnection();

        const [rows] = await conn.query("SHOW TABLES");

        res.json(rows);

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        });

    } finally {

        if (conn) await conn.end();

    }
});


// ======================
// GET ANY TABLE
// ======================
app.get("/table/:name", async (req, res) => {

    let conn;

    try {

        conn = await getConnection();

        const table = req.params.name;

        // prevent SQL injection
        const [check] = await conn.query(
            "SHOW TABLES LIKE ?",
            [table]
        );

        if (check.length === 0) {

            return res.status(404).json({
                error: "Table not found"
            });

        }

        const [rows] = await conn.query(
            `SELECT * FROM \`${table}\` LIMIT 500`
        );

        res.json(rows);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    } finally {

        if (conn) await conn.end();

    }

});


// ======================
// COST BREAKDOWN TREE
// ======================
app.get("/tree", async (req, res) => {

    let conn;

    try {

        conn = await getConnection();

        const [rows] = await conn.query(`
            SELECT
                old_id,
                IDParent,
                Level,
                Sequence,
                line_no,
                Description,
                Quantity,
                UOM,source_file
            FROM bq_sections
            ORDER BY Level, Sequence
        `);

        res.json(rows);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    } finally {

        if (conn) await conn.end();

    }

});


// ======================
// GET RESOURCES
// ======================
// app.get("/resources/:sectionId", async (req, res) => {

//     let conn;

//     try {

//         conn = await getConnection();

//         // Find the BLIDs that belong to this section
//         const [bidLines] = await conn.query(`
//             SELECT BLID
//             FROM bid_lines
//             WHERE BQS_ID = ?
//         `, [req.params.sectionId]);

//         if (bidLines.length === 0) {
//             return res.json([]);
//         }

//         const blids = bidLines.map(r => r.BLID);

//         const placeholders = blids.map(() => "?").join(",");

//         const [resources] = await conn.query(`
//             SELECT
//                 BLID,
//                 Code,
//                 Description,
//                 Qty,
//                 \`Unit Cost\`,
//                 \`Total Cost\`,
//                 Category
//             FROM s_labeq
//             WHERE BLID IN (${placeholders})
//             ORDER BY BLID, Sequence
//         `, blids);

//         res.json(resources);

//     } catch (err) {

//         res.status(500).json({
//             error: err.message
//         });

//     } finally {

//         if (conn) await conn.end();

//     }

// });

app.get("/resources/:sectionId", async (req,res)=>{

    const conn = await getConnection();

    try{

        const sectionId = req.params.sectionId;

        const [bidlines] = await conn.query(`
            SELECT BLID
            FROM bid_lines
            WHERE BQS_ID = ?
        `,[sectionId]);

        if(bidlines.length==0)
            return res.json([]);

        const ids = bidlines.map(x=>x.BLID);

        const p = ids.map(()=>"?").join(",");

        const [rows] = await conn.query(`

        SELECT
            Code,
            Description,
            Qty,
            Rate,
            \`Unit Cost\`,
            \`Total Cost\`,
            'Labor' AS Category
        FROM s_labor
        WHERE BLID IN (${p})

        UNION ALL

        SELECT
            Code,
            Description,
            Qty,
            Rate,
            \`Unit Cost\`,
            \`Total Cost\`,
            'Material'
        FROM s_material
        WHERE BLID IN (${p})

        UNION ALL

        SELECT
            Code,
            Description,
            Qty,
            Rate,
            \`Unit Cost\`,
            \`Total Cost\`,
            'Equipment'
        FROM s_equipment
        WHERE BLID IN (${p})

        UNION ALL

        SELECT
            Code,
            Description,
            Qty,
            Rate,
            \`Unit Cost\`,
            \`Total Cost\`,
            'Subcontract'
        FROM s_subcontract
        WHERE BLID IN (${p})

        ORDER BY Category,Description

        `,[...ids,...ids,...ids,...ids]);

        res.json(rows);

    }
    finally{

        conn.end();

    }

});

app.get("/bidlisting/:parentId", async (req, res) => {

    const conn = await getConnection();

    const [rows] = await conn.query(`
        SELECT
            old_id,
            line_no,
            Description,
            Quantity,
            UOM,
            UnitCost,
            TotalCost,
            ManHours,
            Production
        FROM bq_sections
        WHERE IDParent = ?
        ORDER BY Sequence
    `,[req.params.parentId]);

    res.json(rows);

    conn.end();

});
// ======================
// SERVER
// ======================
app.listen(port, () => {

    console.log(`Server running at http://localhost:${port}`);

});


// const express = require("express");
// const mysql = require("mysql2/promise");
// const cors = require("cors");
// const path = require("path");
// const fs = require("fs");

// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(cors());
// app.use(express.json());

// /* ===========================================
//    DATABASE
// =========================================== */

// async function getConnection() {

//     return await mysql.createConnection({

//         host: "localhost",
//         user: "root",
//         password: "",
//         database: "hci"

//     });

// }

// /* ===========================================
//    COMMON RESPONSE HELPERS
// =========================================== */

// function success(res, data) {

//     res.json({

//         success: true,
//         data

//     });

// }

// function failure(res, err) {

//     console.error(err);

//     res.status(500).json({

//         success: false,
//         error: err.message

//     });

// }

// /* ===========================================
//    HELPER
//    Use old_id if available
// =========================================== */

// async function getSectionKey(conn, sectionId) {

//     // Try old_id first

//     const [oldRows] = await conn.query(
//         `
//         SELECT old_id
//         FROM bq_sections
//         WHERE old_id = ?
//         LIMIT 1
//         `,
//         [sectionId]
//     );

//     if (oldRows.length > 0) {

//         return oldRows[0].old_id;

//     }

//     // Otherwise lookup using id

//     const [idRows] = await conn.query(
//         `
//         SELECT old_id
//         FROM bq_sections
//         WHERE id = ?
//         LIMIT 1
//         `,
//         [sectionId]
//     );

//     if (idRows.length > 0) {

//         return idRows[0].old_id;

//     }

//     return null;

// }

// /* ===========================================
//    HOME
// =========================================== */

// app.get("/", (req, res) => {

//     res.json({

//         application: "Chief Estimator API",
//         version: "1.0",
//         database: "hci"

//     });

// });

// /* ===========================================
//    LIST TABLES
// =========================================== */

// app.get("/tables", async (req, res) => {

//     let conn;

//     try {

//         conn = await getConnection();

//         const [rows] = await conn.query("SHOW TABLES");

//         success(res, rows);

//     }
//     catch (err) {

//         failure(res, err);

//     }
//     finally {

//         if (conn) await conn.end();

//     }

// });

// /* ===========================================
//    GET TABLE CONTENTS
// =========================================== */

// app.get("/table/:name", async (req, res) => {

//     let conn;

//     try {

//         conn = await getConnection();

//         const table = req.params.name;

//         // Protect against SQL injection

//         const [exists] = await conn.query(

//             "SHOW TABLES LIKE ?",

//             [table]

//         );

//         if (exists.length === 0) {

//             return res.status(404).json({

//                 success: false,
//                 error: "Table not found"

//             });

//         }

//         const [rows] = await conn.query(

//             `SELECT * FROM \`${table}\` LIMIT 500`

//         );

//         success(res, rows);

//     }
//     catch (err) {

//         failure(res, err);

//     }
//     finally {

//         if (conn) await conn.end();

//     }

// });

// /* ===========================================
//    DATABASE INFORMATION
// =========================================== */

// app.get("/database", async (req, res) => {

//     let conn;

//     try {

//         conn = await getConnection();

//         const [tables] = await conn.query("SHOW TABLES");

//         success(res, {

//             database: "hci",

//             tableCount: tables.length,

//             tables

//         });

//     }
//     catch (err) {

//         failure(res, err);

//     }
//     finally {

//         if (conn) await conn.end();

//     }

// });
// /* ===========================================
//    COST BREAKDOWN TREE
// =========================================== */

// app.get("/tree", async (req, res) => {

//     let conn;

//     try {

//         conn = await getConnection();

//         const [rows] = await conn.query(`

//             SELECT

//                 id,
//                 old_id,
//                 IDParent,
//                 Level,
//                 Sequence,
//                 line_no,
//                 Description,
//                 Quantity,
//                 UOM,
//                 source_file

//             FROM bq_sections

//             ORDER BY
//                 Level,
//                 Sequence

//         `);

//         success(res, rows);

//     }
//     catch (err) {

//         failure(res, err);

//     }
//     finally {

//         if (conn) await conn.end();

//     }

// });


// /* ===========================================
//    RESOURCES
// =========================================== */

// app.get("/resources/:sectionId", async (req, res) => {

//     let conn;

//     try {

//         conn = await getConnection();

//         //--------------------------------------------------
//         // Find correct section key
//         //--------------------------------------------------

//         const sectionKey = await getSectionKey(

//             conn,

//             req.params.sectionId

//         );

//         if (!sectionKey) {

//             return success(res, []);

//         }

//         //--------------------------------------------------
//         // Find BLIDs
//         //--------------------------------------------------

//         const [bidLines] = await conn.query(`

//             SELECT
//                 BLID

//             FROM bid_lines

//             WHERE BQS_ID = ?

//         `, [sectionKey]);

//         if (bidLines.length === 0) {

//             return success(res, []);

//         }

//         const blids = bidLines.map(r => r.BLID);

//         const marks = blids.map(() => "?").join(",");

//         //--------------------------------------------------
//         // Load all resources
//         //--------------------------------------------------

//         const sql = `

// SELECT
// BLID,
// Code,
// Description,
// Qty,
// Rate,
// \`Unit Cost\`,
// \`Total Cost\`,
// 'Labor' Category
// FROM s_labor
// WHERE BLID IN (${marks})

// UNION ALL

// SELECT
// BLID,
// Code,
// Description,
// Qty,
// Rate,
// \`Unit Cost\`,
// \`Total Cost\`,
// 'Material'
// FROM s_material
// WHERE BLID IN (${marks})

// UNION ALL

// SELECT
// BLID,
// Code,
// Description,
// Qty,
// Rate,
// \`Unit Cost\`,
// \`Total Cost\`,
// 'Equipment'
// FROM s_equipment
// WHERE BLID IN (${marks})

// UNION ALL

// SELECT
// BLID,
// Code,
// Description,
// Qty,
// Rate,
// \`Unit Cost\`,
// \`Total Cost\`,
// 'Subcontract'
// FROM s_subcontract
// WHERE BLID IN (${marks})

// ORDER BY
// Category,
// Description

// `;

//         const params = [

//             ...blids,
//             ...blids,
//             ...blids,
//             ...blids

//         ];

//         const [rows] = await conn.query(

//             sql,

//             params

//         );

//         success(res, rows);

//     }
//     catch (err) {

//         failure(res, err);

//     }
//     finally {

//         if (conn) await conn.end();

//     }

// });


// /* ===========================================
//    RESOURCE TOTALS
// =========================================== */

// app.get("/resourceTotals/:sectionId", async (req, res) => {

//     let conn;

//     try {

//         conn = await getConnection();

//         const sectionKey = await getSectionKey(

//             conn,

//             req.params.sectionId

//         );

//         if (!sectionKey) {

//             return success(res, {

//                 Labor: 0,
//                 Material: 0,
//                 Equipment: 0,
//                 Subcontract: 0,
//                 GrandTotal: 0

//             });

//         }

//         const [bidLines] = await conn.query(

//             `
//             SELECT BLID
//             FROM bid_lines
//             WHERE BQS_ID = ?
//             `,

//             [sectionKey]

//         );

//         if (!bidLines.length) {

//             return success(res, {

//                 Labor: 0,
//                 Material: 0,
//                 Equipment: 0,
//                 Subcontract: 0,
//                 GrandTotal: 0

//             });

//         }

//         const blids = bidLines.map(x => x.BLID);

//         const marks = blids.map(() => "?").join(",");

//         async function getTotal(table) {

//             const [r] = await conn.query(

//                 `
//                 SELECT
//                 SUM(\`Total Cost\`) total
//                 FROM ${table}
//                 WHERE BLID IN (${marks})
//                 `,

//                 blids

//             );

//             return Number(r[0].total || 0);

//         }

//         const labor = await getTotal("s_labor");

//         const material = await getTotal("s_material");

//         const equipment = await getTotal("s_equipment");

//         const subcontract = await getTotal("s_subcontract");

//         success(res, {

//             Labor: labor,

//             Material: material,

//             Equipment: equipment,

//             Subcontract: subcontract,

//             GrandTotal:

//                 labor +
//                 material +
//                 equipment +
//                 subcontract

//         });

//     }
//     catch (err) {

//         failure(res, err);

//     }
//     finally {

//         if (conn) await conn.end();

//     }

// });

// /* ===========================================
//    BID LISTING
//    Children of selected section
// =========================================== */

// app.get("/bidlisting/:parentId", async (req, res) => {

//     let conn;

//     try {

//         conn = await getConnection();

//         const parentKey = await getSectionKey(

//             conn,

//             req.params.parentId

//         );

//         if (!parentKey) {

//             return success(res, []);

//         }

//         const [rows] = await conn.query(`

//             SELECT

//                 id,
//                 old_id,
//                 IDParent,
//                 line_no,
//                 Description,
//                 Quantity,
//                 UOM,

//                 IFNULL(UnitCost,0) UnitCost,
//                 IFNULL(TotalCost,0) TotalCost,
//                 IFNULL(ManHours,0) ManHours,
//                 IFNULL(Production,'') Production

//             FROM bq_sections

//             WHERE IDParent = ?

//             ORDER BY Sequence

//         `,[parentKey]);

//         success(res, rows);

//     }

//     catch(err){

//         failure(res,err);

//     }

//     finally{

//         if(conn) await conn.end();

//     }

// });


// /* ===========================================
//    SECTION DETAILS
// =========================================== */

// app.get("/section/:id", async(req,res)=>{

//     let conn;

//     try{

//         conn=await getConnection();

//         const key = await getSectionKey(

//             conn,

//             req.params.id

//         );

//         if(!key){

//             return success(res,null);

//         }

//         const [rows]=await conn.query(`

//             SELECT *

//             FROM bq_sections

//             WHERE old_id=?

//             LIMIT 1

//         `,[key]);

//         success(res,

//             rows.length

//             ? rows[0]

//             : null

//         );

//     }

//     catch(err){

//         failure(res,err);

//     }

//     finally{

//         if(conn) await conn.end();

//     }

// });


// /* ===========================================
//    HEALTH CHECK
// =========================================== */

// app.get("/health",(req,res)=>{

//     res.json({

//         success:true,

//         status:"OK",

//         server:"Chief Estimator",

//         database:"hci",

//         time:new Date()

//     });

// });


// /* ===========================================
//    API INFORMATION
// =========================================== */

// app.get("/api",(req,res)=>{

//     res.json({

//         success:true,

//         endpoints:[

//             "/",

//             "/database",

//             "/health",

//             "/tables",

//             "/table/:name",

//             "/tree",

//             "/section/:id",

//             "/resources/:sectionId",

//             "/resourceTotals/:sectionId",

//             "/bidlisting/:parentId"

//         ]

//     });

// });


// /* ===========================================
//    404
// =========================================== */

// app.use((req,res)=>{

//     res.status(404).json({

//         success:false,

//         error:"API route not found."

//     });

// });


// /* ===========================================
//    ERROR HANDLER
// =========================================== */

// app.use((err,req,res,next)=>{

//     console.error(err);

//     res.status(500).json({

//         success:false,

//         error:err.message

//     });

// });


// /* ===========================================
//    START SERVER
// =========================================== */

// app.listen(PORT,()=>{

//     console.log("");

//     console.log("====================================");

//     console.log(" Chief Estimator API");

//     console.log("====================================");

//     console.log(" Server : http://localhost:"+PORT);

//     console.log(" Database : hci");

//     console.log("");

//     console.log(" Available Endpoints");

//     console.log(" -------------------");

//     console.log(" GET /tree");

//     console.log(" GET /resources/:sectionId");

//     console.log(" GET /bidlisting/:parentId");

//     console.log(" GET /section/:id");

//     console.log(" GET /tables");

//     console.log(" GET /database");

//     console.log("");

// });

