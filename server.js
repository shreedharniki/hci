

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const importDatabase = require("./importMDB");
const app = express();
const port = 3000;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage
});

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

app.post(
    "/import-mdb",
    upload.single("mdbFile"),
    async (req, res) => {

        const uploadedPath = req.file.path;

        console.log(
            "Uploaded file:",
            uploadedPath
        );


        await importDatabase(uploadedPath);


        res.json({
            message:"Import completed"
        });
    }
);


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


