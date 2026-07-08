
// // ID === oeld id
// const fs = require("fs");
// const path = require("path");
// const mysql = require("mysql2/promise");

// const MDBReader = require("mdb-reader").default;

// const dbPath = path.join(
//     __dirname,
//          // "HCI-460-Water Control & Hydro Structures (english)-$US-sample.mdb" 
//    // "HCI-940-Regional Highway & Bridge Project Indirect Assemblies (metric)-$cdn-sample.mdb"
//     //  "HCI-910-Contractor Master Indirect Assemblies (english)-$US.mdb"
//      "HCI-530-Roadway Configurations (english)-$US.mdb"
// );

// async function importDatabase() {
//     // const { default: MDBReader } = await import("mdb-reader");
//     const connection = await mysql.createConnection({
//         host: "localhost",
//         user: "root",
//         password: "",
//         database: "hci",
//         multipleStatements: true
//     });

//     const sourceFile = path.basename(dbPath);

//     const buffer = fs.readFileSync(dbPath);
//     const reader = new MDBReader(buffer);

//     const tableNames = reader.getTableNames();

//     console.log(`Found ${tableNames.length} tables\n`);

//     for (const tableName of tableNames) {

//         console.log(`Processing ${tableName}`);

//         try {

//             const table = reader.getTable(tableName);
//             const columns = table.getColumns();

//             const [exists] = await connection.query(
//                 `SHOW TABLES LIKE ?`,
//                 [tableName]
//             );

//             if (exists.length === 0) {

//                 let createSQL = `CREATE TABLE \`${tableName}\` (
//                     id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//                 `;

//                 columns.forEach(col => {

//                     // ❗ rename MDB ID to avoid conflict
//                     let colName = col.name;
//                     if (colName.toLowerCase() === "id") {
//                         colName = "old_id";
//                     }

//                     createSQL += `\`${colName}\` LONGTEXT NULL,`;
//                 });

//                 createSQL += `source_file LONGTEXT NULL
//                 )`;

//                 await connection.query(createSQL);

//                 console.log(`Created table ${tableName}`);
//             }

//             else {

//                 const [cols] = await connection.query(
//                     `SHOW COLUMNS FROM \`${tableName}\` LIKE 'source_file'`
//                 );

//                 if (cols.length === 0) {
//                     await connection.query(
//                         `ALTER TABLE \`${tableName}\` ADD COLUMN source_file LONGTEXT NULL`
//                     );
//                 }
//             }

//             const rows = table.getData();

//             if (rows.length > 0) {

//                 const columnNames = columns.map(c => {
//                     if (c.name.toLowerCase() === "id") {
//                         return "old_id";
//                     }
//                     return c.name;
//                 });

//                 const insertColumns = [...columnNames, "source_file"];

//                 const placeholders = insertColumns.map(() => "?").join(",");

//                 const insertSQL = `
//                     INSERT INTO \`${tableName}\`
//                     (${insertColumns.map(c => `\`${c}\``).join(",")})
//                     VALUES (${placeholders})
//                 `;

//                 for (const row of rows) {

//                     const values = columnNames.map(c => {
//                         if (c === "old_id") return row["ID"] ?? row["id"] ?? null;
//                         return row[c] ?? null;
//                     });

//                     values.push(sourceFile);

//                     await connection.execute(insertSQL, values);
//                 }

//                 console.log(`${rows.length} rows inserted`);
//             }

//             else {
//                 console.log("No records");
//             }

//             console.log("--------------------------------");

//         } catch (err) {
//             console.error(`Error importing ${tableName}:`, err.message);
//         }
//     }

//     await connection.end();
//     console.log("Import Completed Successfully.");
// }

// importDatabase();



//100,000 rows = 100 MySQL requests

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const MDBReader = require("mdb-reader").default;

// const dbPath = path.join(
//     __dirname,
//     "HCI-530-Roadway Configurations (english)-$US.mdb"
// );

// async function importDatabase() {
async function importDatabase(dbPath) {

    const connection = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "hci",
        multipleStatements: true,
        maxPreparedStatements: 100
    });

    // Speed up MySQL import
    await connection.query("SET FOREIGN_KEY_CHECKS=0");
    await connection.query("SET UNIQUE_CHECKS=0");
    await connection.query("SET AUTOCOMMIT=0");

    const sourceFile = path.basename(dbPath);

    const buffer = fs.readFileSync(dbPath);
    const reader = new MDBReader(buffer);

    const tableNames = reader.getTableNames();

    console.log(`Found ${tableNames.length} tables\n`);

    for (const tableName of tableNames) {

        console.log(`Processing ${tableName}`);

        try {

            const table = reader.getTable(tableName);
            const columns = table.getColumns();

            let [exists] = await connection.query(
                `SHOW TABLES LIKE ?`,
                [tableName]
            );


            // CREATE TABLE
            if (exists.length === 0) {

                let createSQL = `
                CREATE TABLE \`${tableName}\` (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                `;

                for (const col of columns) {

                    let colName =
                        col.name.toLowerCase() === "id"
                        ? "old_id"
                        : col.name;

                    createSQL += `
                    \`${colName}\` LONGTEXT NULL,
                    `;
                }

                createSQL += `
                    source_file LONGTEXT NULL
                ) ENGINE=InnoDB;
                `;

                await connection.query(createSQL);

                console.log(`Created ${tableName}`);
            }


            // ADD SOURCE COLUMN
            else {

                let [cols] = await connection.query(
                    `SHOW COLUMNS FROM \`${tableName}\` LIKE 'source_file'`
                );

                if (cols.length === 0) {
                    await connection.query(
                        `ALTER TABLE \`${tableName}\`
                         ADD COLUMN source_file LONGTEXT NULL`
                    );
                }
            }


            const rows = table.getData();

            if (!rows.length) {
                console.log("No records");
                continue;
            }


            const columnNames = columns.map(c =>
                c.name.toLowerCase() === "id"
                ? "old_id"
                : c.name
            );


            const insertColumns = [
                ...columnNames,
                "source_file"
            ];


            const batchSize = 1000;


            for (let i = 0; i < rows.length; i += batchSize) {


                const batch = rows.slice(
                    i,
                    i + batchSize
                );


                const values = batch.map(row => {

                    return columnNames.map(c => {

                        if (c === "old_id") {
                            return row.ID ?? row.id ?? null;
                        }

                        return row[c] ?? null;

                    }).concat(sourceFile);

                });


                const placeholders =
                    values
                    .map(row =>
                        "(" +
                        row.map(() => "?").join(",") +
                        ")"
                    )
                    .join(",");


                const sql = `
                    INSERT INTO \`${tableName}\`
                    (${insertColumns.map(c => `\`${c}\``).join(",")})
                    VALUES ${placeholders}
                `;


                await connection.query(
                    sql,
                    values.flat()
                );


                console.log(
                    `${tableName}: ${Math.min(
                        i + batchSize,
                        rows.length
                    )}/${rows.length}`
                );

            }


            await connection.commit();

            console.log(
                `${rows.length} rows inserted`
            );


            console.log("--------------------------------");


        } catch(err) {

            console.error(
                `Error importing ${tableName}:`,
                err.message
            );

        }
    }


    await connection.query("SET FOREIGN_KEY_CHECKS=1");
    await connection.query("SET UNIQUE_CHECKS=1");

    await connection.end();

    console.log(
        "Import Completed Successfully."
    );
}


// importDatabase();
module.exports = importDatabase;