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


app.get("/tree",async(req,res)=>{


let conn;


try{


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
UOM,
source_file


FROM bq_sections

ORDER BY Sequence


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

// app.get("/crew/:sectionId", async (req, res) => {

//     const conn = await getConnection();

//     try {

//         const [bidLines] = await conn.query(
//             "SELECT BLID FROM bid_lines WHERE BQS_ID=?",
//             [req.params.sectionId]
//         );

//         if (!bidLines.length) {
//             return res.json([]);
//         }

//         const ids = bidLines.map(x => x.BLID);

//         const p = ids.map(() => "?").join(",");

//         const [rows] = await conn.query(`
//             SELECT
//                 BLID,
//                 Code,
//                 Description,
//                 Qty,
//                 Rate,
//                 \`Unit Cost\`,
//                 \`Total Cost\`
//             FROM s_crew
//             WHERE BLID IN (${p})
//             ORDER BY BLID
//         `, ids);

//         res.json(rows);

//     } catch (err) {

//         res.status(500).json({
//             error: err.message
//         });

//     } finally {

//         conn.end();

//     }

// });




// ===============================
// GET ANY TABLE
// ===============================


// app.get("/crew/:sectionId", async (req, res) => {

//     const conn = await getConnection();

//     try {


//         console.log("SECTION ID:", req.params.sectionId);


//         const [bidLines] = await conn.query(
//             `
//             SELECT BLID,BQS_ID
//             FROM bid_lines
//             WHERE BQS_ID=?
//             `,
//             [req.params.sectionId]
//         );


//         console.log("BID LINES:");
//         console.table(bidLines);



//         const ids = bidLines.map(x=>x.BLID);


//         console.log("BLID LIST:");
//         console.log(ids);



//         if(!ids.length){
//             return res.json([]);
//         }



//         const p = ids.map(()=>"?").join(",");



//         const [rows] = await conn.query(
//             `
//             SELECT
//                 BLID,
//                 Code,
//                 Description,
//                 Qty,
//                 Rate,
//                 \`Unit Cost\`,
//                 \`Total Cost\`,
//                 Category

//             FROM s_crew

//             WHERE BLID IN (${p})

//             ORDER BY BLID

//             `,
//             ids
//         );



//         console.log("CREW DATA:");
//         console.table(rows);



//         res.json(rows);



//     }catch(err){

//         console.log(err);

//         res.status(500).json({
//             error:err.message
//         });


//     }finally{

//         conn.end();

//     }

// });

// app.get("/crew/:sectionId", async (req, res) => {

//     const conn = await getConnection();

//     try {


//         console.log("SECTION ID:", req.params.sectionId);


//         const [bidLines] = await conn.query(
//             `
//             SELECT BLID,BQS_ID
//             FROM bid_lines
//             WHERE BQS_ID=?
//             `,
//             [req.params.sectionId]
//         );


//         console.log("BID LINES:");
//         console.table(bidLines);



//         const ids = bidLines.map(x=>x.BLID);


//         console.log("BLID LIST:");
//         console.log(ids);



//         if(!ids.length){
//             return res.json([]);
//         }



//         const p = ids.map(()=>"?").join(",");



//         const [rows] = await conn.query(
//             `
//             SELECT
//                 BLID,
//                 Code,
//                 Description,
//                 Qty,
//                 Rate,
//                 \`Unit Cost\`,
//                 \`Total Cost\`,
//                 Category

//             FROM s_crew

//             WHERE BLID IN (${p})

//             ORDER BY BLID

//             `,
//             ids
//         );



//         console.log("CREW DATA:");
//         console.table(rows);



//         res.json(rows);



//     }catch(err){

//         console.log(err);

//         res.status(500).json({
//             error:err.message
//         });


//     }finally{

//         conn.end();

//     }

// });



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



// app.get("/material/:sectionId", async(req,res)=>{


// const conn = await getConnection();


// try{


// const [bidLines]=await conn.query(

// `
// SELECT BLID
// FROM bid_lines
// WHERE BQS_ID=?
// `,
// [
// req.params.sectionId
// ]

// );



// if(!bidLines.length){

// return res.json([]);

// }



// const ids =
// bidLines.map(x=>x.BLID);



// const p =
// ids.map(()=>"?").join(",");



// const [rows]=await conn.query(

// `
// SELECT

// BLID,
// Code,
// Description,
// Quantity,
// UOM,
// \`Unit Cost\`,
// \`Total Cost\`,
// Category

// FROM s_material

// WHERE BLID IN (${p})

// ORDER BY BLID

// `,

// ids

// );



// console.table(rows);


// res.json(rows);



// }
// catch(err){

// res.status(500).json({
// error:err.message
// });

// }
// finally{

// conn.end();

// }


// });



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
app.get(
"/table/:name",
async(req,res)=>{


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






// ===============================
// ALL TABLES
// ===============================


app.get(
"/tables",
async(req,res)=>{


const conn =
await getConnection();


const [rows]=
await conn.query(
"SHOW TABLES"
);



res.json(rows);


conn.end();


});

app.get("/labor-rates",async(req,res)=>{

    const conn=await getConnection();

    const [rows]=await conn.query(`

        SELECT

            labor.Code,
            labor.Description,
            l_rates.*

        FROM l_rates

        LEFT JOIN labor

        ON labor.old_id=l_rates.LID

        ORDER BY labor.Code

    `);

    res.json(rows);

});
app.get("/material-rates",async(req,res)=>{

    const conn=await getConnection();

    const [rows]=await conn.query(`

        SELECT

            material.Code,
            material.Description,
            m_rates.*

        FROM m_rates

        LEFT JOIN material

        ON material.old_id=m_rates.MID

        ORDER BY material.Code

    `);

    res.json(rows);

});
app.get("/equipment-rates",async(req,res)=>{

    const conn=await getConnection();

    const [rows]=await conn.query(`

        SELECT

            equipment.Code,
            equipment.Description,
            e_rates.*

        FROM e_rates

        LEFT JOIN equipment

        ON equipment.old_id=e_rates.EID

        ORDER BY equipment.Code

    `);

    res.json(rows);

});




app.listen(PORT,()=>{


    console.log(
    `Server running http://localhost:${PORT}`
    );
    

    });