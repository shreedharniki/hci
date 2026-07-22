const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const multer = require("multer");

const importDatabase = require("./importMDB");

const app = express();

const PORT = 3000;


app.use(cors());
app.use(express.json());


// ===============================
// MYSQL CONNECTION
// ===============================

async function getConnection(){

    return mysql.createConnection({

        host:"localhost",
        user:"root",
        password:"",
        database:"hci"

    });

}


// ===============================
// MDB UPLOAD
// ===============================


const storage = multer.diskStorage({

    destination:(req,file,cb)=>{

        cb(null,"uploads/");

    },


    filename:(req,file,cb)=>{

        cb(null,file.originalname);

    }

});


const upload = multer({
    storage
});



app.post(
"/import-mdb",
upload.single("mdbFile"),
async(req,res)=>{


    try{


        await importDatabase(
            req.file.path
        );


        res.json({

            success:true,
            message:"MDB Imported Successfully"

        });


    }
    catch(err){


        res.status(500).json({

            error:err.message

        });


    }


});




// ===============================
// GET TREE
// ===============================


// app.get("/tree",async(req,res)=>{


// let conn;


// try{


// conn = await getConnection();



// const [rows] = await conn.query(`

// SELECT

// old_id,
// IDParent,
// Level,
// Sequence,
// line_no,
// Description,
// Quantity,
// UOM,
// source_file


// FROM bq_sections

// ORDER BY Sequence


// `);



// res.json(rows);



// }
// catch(err){


// res.status(500).json({

// error:err.message

// });


// }
// finally{

// if(conn)
// conn.end();

// }


// });

app.get("/tree", async(req,res)=>{

let conn;

try{

conn = await getConnection();


const [rows] = await conn.query(`

SELECT

b.old_id,
b.IDParent,
b.Level,
b.Sequence,
b.line_no,
b.Description,
b.Quantity,
b.UOM,
b.source_file,

c.currency AS currency


FROM bq_sections b

LEFT JOIN currency c
ON c.id = 1


ORDER BY b.Sequence


`);


res.json(rows);


}
catch(err){

res.status(500).json({

error:err.message

});

}
finally{

if(conn)
conn.end();

}

});



// ===============================
// BID LISTING
// ===============================

// ===============================
// BID LISTING WITH ALL DATA
// ===============================

app.get("/bidlisting/:id", async(req,res)=>{

    let conn;

    try{

        conn = await getConnection();

        const sectionId = req.params.id;


        const [rows] = await conn.query(`

            SELECT

            BLID,
            BQS_ID,
            line_no,
            Description,
            Quantity,
            UOM
           

            FROM bid_lines

            WHERE BQS_ID=?

            ORDER BY line_no

        `,[sectionId]);


        res.json(rows);


    }
    catch(err){

        res.status(500).json({
            error:err.message
        });

    }
    finally{

        if(conn)
        conn.end();

    }

});




app.get("/resources/:id", async(req,res)=>{

    let conn;

    try{

        conn = await getConnection();

        const sectionId = req.params.id;


        // GET BLID FROM BID_LINES

        const [bidLines] = await conn.query(`
            SELECT BLID
            FROM bid_lines
            WHERE BQS_ID=?
        `,[sectionId]);



        if(bidLines.length===0){

            return res.json([]);

        }



        const ids = bidLines.map(x=>x.BLID);


        const placeholders =
        ids.map(()=>"?").join(",");



        // GET ALL RESOURCES

        const [rows] = await conn.query(`

            SELECT

            BLID,
            Code,
            Description,
            Qty,
            Rate,
            \`Unit Cost\`,
            \`Total Cost\`,
            Category


            FROM s_labeq

            WHERE BLID IN (${placeholders})


            ORDER BY Category, Description


        `,ids);



        res.json(rows);



    }
    catch(err){

        res.status(500).json({

            error:err.message

        });

    }
    finally{

        if(conn)
        conn.end();

    }


});

app.get("/crew/:sectionId", async(req,res)=>{

    const conn = await getConnection();

    try{


        // Get BLID from bid_lines

        const [bidLines] = await conn.query(
            `
            SELECT BLID
            FROM bid_lines
            WHERE BQS_ID=?
            `,
            [
                req.params.sectionId
            ]
        );


        console.log("BID LINES");
        console.table(bidLines);



        if(!bidLines.length){
            return res.json([]);
        }



        const ids =
        bidLines.map(x=>x.BLID);



        const placeholders =
        ids.map(()=>"?").join(",");



        const [rows] = await conn.query(

        `
        SELECT

            BLID,
            Code,
            Description,
            Qty,
            Rate,
            \`Unit Cost\`,
            \`Total Cost\`,
            Category

        FROM s_crew

        WHERE BLID IN (${placeholders})

        ORDER BY BLID

        `,

        ids

        );



        console.log("CREW RESULT");

        console.table(rows);



        res.json(rows);



    }
    catch(err){

        console.log(err);

        res.status(500).json({
            error:err.message
        });

    }
    finally{

        conn.end();

    }

});


app.get("/material/:sectionId", async(req,res)=>{

    const conn = await getConnection();

    try{


        const [bidLines] = await conn.query(
            `
            SELECT BLID
            FROM bid_lines
            WHERE BQS_ID=?
            `,
            [
                req.params.sectionId
            ]
        );


        if(!bidLines.length)
        {
            return res.json([]);
        }



        const ids =
        bidLines.map(x=>x.BLID);



        const placeholders =
        ids.map(()=>"?").join(",");



        const [rows] = await conn.query(

        `
        SELECT
        BLID,
        Code,
        Description,
        Quantity,
        UOM,
        \`Unit Cost\`,
        \`Total Cost\`,
        Category

        FROM s_material

        WHERE BLID IN (${placeholders})

        ORDER BY BLID

        `,

        ids

        );


        console.log("MATERIAL API");
        console.table(rows);


        res.json(rows);


    }
    catch(err){

        res.status(500).json({
            error:err.message
        });

    }
    finally{

        conn.end();

    }

});


app.get("/table/:name",async(req,res)=>{


    let conn;


    try{


    conn=await getConnection();



    const table=req.params.name;



    const [rows]=await conn.query(

    `SELECT * FROM \`${table}\` LIMIT 1000`

);



res.json(rows);



}
catch(err){


res.status(500).json({

error:err.message

});


}
finally{


conn.end();


}


});


app.get("/tables",async(req,res)=>{


    const conn =
    await getConnection();


    const [rows]=
    await conn.query(
    "SHOW TABLES"
    );



    res.json(rows);


    conn.end();


});

// app.get("/labor-rates", async (req, res) => {

//     try {

//         const conn = await getConnection();

//         const [rows] = await conn.query(`

//             SELECT

//                 lr.*,
//                 l.Code,
//                 l.Description

//             FROM l_rates lr

//             LEFT JOIN labor l
//                 ON l.old_id = lr.LID

//             ORDER BY l.Code

//         `);

//         res.json(rows);

//     } catch (err) {

//         console.log(err);

//         res.status(500).json(err);

//     }

// });

app.get("/material-rates", async (req, res) => {

    try {

        const conn = await getConnection();

        const [rows] = await conn.query(`

            SELECT

                mr.*,
                m.Code,
                m.Description,
                m.UOM

            FROM m_rates mr

            LEFT JOIN material m
                ON m.old_id = mr.MID

            ORDER BY m.Code

        `);

        res.json(rows);

    } catch (err) {

        console.log(err);

        res.status(500).json(err);

    }

});
// app.get("/equipment-rates", async (req, res) => {

//     try {

//         const conn = await getConnection();

//         const [rows] = await conn.query(`

//             SELECT

//                 er.*,
//                 e.Code,
//                 e.Description

//             FROM e_rates er

//             LEFT JOIN equipment e
//                 ON e.old_id = er.EID

//             ORDER BY e.Code

//         `);

//         res.json(rows);

//     } catch (err) {

//         console.log(err);

//         res.status(500).json(err);

//     }

// });

// app.get("/labor-rates", async (req, res) => {

//     try {

//         const conn = await getConnection();

//         const [rows] = await conn.query(`
//             SELECT
//                 l.Code,
//                 l.Description,
//                 l.UOT,
//                 lr.\`Base Rate\`,
//                 lr.Burdens,
//                 lr.\`Total Rate\`,
//                 lr.\`Alt UOT\`,
//                 lr.\`Alt Fact\`,
//                 lr.\`Alt Total Rate\`,
//                 lr.Formula
//             FROM l_rates lr
//             LEFT JOIN labor l
//                 ON l.old_id = lr.LID
//             ORDER BY l.Code
//         `);

//         res.json(rows);

//     } catch (err) {

//         console.error(err);
//         res.status(500).json({
//             success: false,
//             message: err.message
//         });

//     }

// });

// app.get("/labor-rates", async (req, res) => {

//     const conn = await getConnection();

//     const [rows] = await conn.query(`
//         SELECT
//             labor.Code,
//             labor.Description,
//             l_rates.\`Base Rate\`,
//             l_rates.Burdens,
//             l_rates.\`Total Rate\`
//         FROM l_rates
//         LEFT JOIN labor
//             ON labor.old_id = l_rates.LID
//         ORDER BY labor.Code
//     `);

//     res.json(rows);
// });
// app.get("/material-rates", async (req, res) => {

//     const conn = await getConnection();

//     const [rows] = await conn.query(`
//         SELECT
//             material.Code,
//             material.Description,
//             m_rates.\`Base Rate\`,
//             m_rates.Burdens,
//             m_rates.\`Total Rate\`
//         FROM m_rates
//         LEFT JOIN material
//             ON material.old_id = m_rates.MID
//         ORDER BY material.Code
//     `);

//     res.json(rows);
// });
// app.get("/equipment-rates", async (req, res) => {

//     const conn = await getConnection();

//     const [rows] = await conn.query(`
//         SELECT
//             equipment.Code,
//             equipment.Description,
//             e_rates.\`Rental Rate\`,
//             e_rates.\`Internal Rate\`
//         FROM e_rates
//         LEFT JOIN equipment
//             ON equipment.old_id = e_rates.EID
//         ORDER BY equipment.Code
//     `);

//     res.json(rows);
// });

app.get("/project-info", async (req, res) => {
    try {
        const conn = await getConnection();

        const [rows] = await conn.query(`
            SELECT
                \`Bid Number\` AS estimateCode,
                \`Bid Name\` AS bidName,
                \`Bid Currency\` AS currency,
                \`Description\` AS description,
                \`Unit Of Measure\` AS unit,
                \`Overall Quantity\` AS quantity
            FROM geninfo
            LIMIT 1
        `);

        res.json(rows[0] || {});
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});


// app.get("/material-rates/:blid", async (req, res) => {

//     let conn;

//     try {

//         conn = await getConnection();

//         const [rows] = await conn.query(`
//             SELECT
//                 sm.BLID,
//                 sm.Code,
//                 sm.Description,
//                 sm.UOM,
//                 sm.Quantity,

//                 IFNULL(mr.\`Base Rate\`,0) AS \`Base Rate\`,
//                 IFNULL(mr.Burdens,0) AS Burdens,
//                 IFNULL(mr.\`Total Rate\`,0) AS \`Total Rate\`,

//                 sm.\`Unit Cost\`,
//                 sm.\`Total Cost\`

//             FROM s_material sm

//             LEFT JOIN m_rates mr
//                 ON mr.MID = sm.old_id

//             WHERE sm.BLID = ?

//             ORDER BY sm.Sequence
//         `, [req.params.blid]);

//         res.json(rows);

//     } catch (err) {

//         console.log(err);

//         res.status(500).json({
//             error: err.message
//         });

//     } finally {

//         if (conn) conn.end();

//     }

// });

app.get("/material-rates/:blid", async (req, res) => {
    let conn;

    try {

        conn = await getConnection();

        const [rows] = await conn.query(`
            SELECT

                sm.BLID,
                sm.old_id,
                sm.Sequence,

                sm.Code,
                sm.Description,
                sm.UOM,

                sm.Quantity,
                sm.Waste,
                sm.AdjQty,

                sm.\`Unit Cost\`,
                sm.\`Total Cost\`,

                sm.\`Mat Unit Cost\`,
                sm.\`Mat Total Cost\`,

                sm.adj_amt_lab,
                sm.adj_amt_eq,
                sm.adj_amt_mat,
                sm.adj_amt_sub,
                sm.total_adj_cost,

                sm.Category,
                sm.\`2nd Category\`,
                sm.\`3rd Category\`,

                COALESCE(mr.\`Base Rate\`, sm.\`Unit Cost\`)  AS \`Base Rate\`,
                COALESCE(mr.Burdens,0)                        AS Burdens,
                COALESCE(mr.\`Total Rate\`, sm.\`Unit Cost\`) AS \`Total Rate\`

            FROM s_material sm

            LEFT JOIN m_rates mr
                ON mr.MID = sm.old_id

            WHERE sm.BLID = ?

            ORDER BY sm.Sequence
        `,[req.params.blid]);

        res.json(rows);

    } catch(err){

        console.log(err);

        res.status(500).json({
            success:false,
            error:err.message
        });

    } finally{

        if(conn) conn.end();

    }
});

app.listen(PORT,()=>{


    console.log(
    `Server running http://localhost:${PORT}`
    );
    

    });