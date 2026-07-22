const API = "http://localhost:3000";

let treeData = [];
let selectedNode = null;
let currentBLID = null;   // ADD THIS

// ===============================
// LOAD APPLICATION
// ===============================

window.onload = function () {
  loadTree();

  document.getElementById("expandAll").onclick = expandAll;

  document.getElementById("collapseAll").onclick = collapseAll;

  document.getElementById("estimateFile").onchange = uploadMDB;
};

// ===============================
// LOAD TREE
// ===============================

async function loadTree() {
  const res = await fetch(API + "/tree");

  treeData = await res.json();

  console.log("TREE DATA:", treeData);
 
  buildTree(treeData);
}

// ===============================
// BUILD TREE
// ===============================

function buildTree(rows) {
  let map = {};

  rows.forEach((r) => {
    map[r.old_id] = {
      ...r,

      children: [],
    };
  });

  rows.forEach((r) => {
    if (r.IDParent != 0 && map[r.IDParent]) {
      map[r.IDParent].children.push(map[r.old_id]);
    }
  });

  const tree = document.getElementById("tree");

  tree.innerHTML = "";

  rows
    .filter((r) => r.IDParent == 0)
    .forEach((r) => {
      tree.appendChild(createNode(map[r.old_id]));
    });
}

// ===============================
// CREATE TREE NODE
// ===============================

function createNode(node) {
  const ul = document.createElement("ul");

  const li = document.createElement("li");

  const div = document.createElement("div");

  div.className = "tree-row";

  const icon = document.createElement("span");

  if (node.children.length) {
  //   icon.innerHTML = "📁";
  // } else {
  //   icon.innerHTML = "📄";
  icon.innerHTML = node.children?.length
  ? '<i class="fa-solid fa-folder"></i>'
  : '<i class="fa-solid fa-file-file"></i>';
  }

  div.innerHTML += `
${icon.innerHTML}

<b>
${node.line_no}
</b>

${node.Description}

(${node.Quantity || 0}
${node.UOM || ""})

`;

  li.appendChild(div);

  ul.appendChild(li);

  if (node.children.length) {
    const child = document.createElement("div");

    child.style.display = "none";

    node.children.forEach((c) => {
      child.appendChild(createNode(c));
    });

    div.onclick = function () {
      child.style.display = child.style.display === "none" ? "block" : "none";

      selectNode(node, div);
    };

    li.appendChild(child);
  } else {
    div.onclick = function () {
      selectNode(node, div);
    };
  }

  return ul;
}


function selectNode(node, row) {
  console.log("SELECTED NODE");
  console.log(node);

  selectedNode = node;

  document.querySelectorAll(".tree-row").forEach((x) => {
    x.classList.remove("selected");
  });

  row.classList.add("selected");

  loadDetail(node);

  Promise.all([
    loadBidListing(node.old_id),
    loadResources(node.old_id),
    loadCrew(node.old_id),
    loadMaterial(node.old_id),
  ])
    .then(() => {
      console.log("ALL DATA LOADED FOR:", node.old_id);
    })
    .catch((err) => {
      console.error("LOAD ERROR:", err);
    });
}
// ===============================
// DETAIL
// ===============================

function loadDetail(node) {
  document.getElementById("lineNo").value = node.line_no || "";

  document.getElementById("description").value = node.Description || "";

  document.getElementById("quantity").value = node.Quantity || "";

  document.getElementById("unit").value = node.UOM || "";
  document.getElementById("currency").value = node.currency || "";
  
}

// ===============================
// BID LISTING
// ===============================

// async function loadBidListing(id) {
//   const res = await fetch(API + "/bidlisting/" + id);

//   const rows = await res.json();
//   console.log("========== BID LISTING ==========");
//   console.log("ID:", id);
//   console.table(rows);

//   console.log("SECTION ID:", id);

//   console.log("========== BID LISTING END ==========");
//   let html = `


// <tr>

// <th>
// BLID
// </th>

// <th>
// Line
// </th>

// <th>
// Description
// </th>


// <th>
// Quantity
// </th>


// <th>
// UOM
// </th>


// </tr>


// `;

//   rows.forEach((r) => {
//     html += `

// <tr>

// <td>
// ${r.BLID}
// </td>


// <td>
// ${r.line_no}
// </td>


// <td>
// ${r.Description}
// </td>


// <td>
// ${r.Quantity || 0}
// </td>


// <td>
// ${r.UOM || ""}
// </td>


// </tr>


// `;
//   });

//   document.getElementById("bidTable").innerHTML = html;
// }

async function loadBidListing(id) {

    const res = await fetch(API + "/bidlisting/" + id);
    const rows = await res.json();

    if(rows.length){
        currentBLID = rows[0].BLID;
    }

    let html = `
    <tr>
        <th>BLID</th>
        <th>Line</th>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit</th>
    </tr>
    `;

    rows.forEach(r=>{

        html += `
    <tr class="bid-row" data-blid="${r.BLID}">

            <td>${r.BLID}</td>

            <td>${r.line_no}</td>

            <td>${r.Description}</td>

            <td>${r.Quantity}</td>

            <td>${r.UOM}</td>

        </tr>
        `;

    });

    document.getElementById("bidTable").innerHTML = html;
    document.querySelectorAll(".bid-row").forEach(row => {

    row.addEventListener("click", function () {

        currentBLID = this.dataset.blid;

        console.log("Current BLID:", currentBLID);

        document.querySelectorAll(".bid-row").forEach(r =>
            r.classList.remove("selected")
        );

        this.classList.add("selected");

    });

});

}

// function selectBidLine(blid){

//     currentBLID = blid;

//     console.log("Current BLID:", currentBLID);

// }


async function loadResources(id) {

    const res = await fetch(API + "/resources/" + id);
    const rows = await res.json();

    console.log("========== RESOURCES ==========");
    console.log("SECTION ID:", id);
    console.table(rows);

    const table = document.getElementById("resourceTable");

    let labor = 0;
    let material = 0;
    let equipment = 0;
    let subcontract = 0;

    let html = `
    <thead>
        <tr>
            <th>Code</th>
            <th>Description</th>
            <th>Category</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Unit Cost</th>
            <th>Total Cost</th>
        </tr>
    </thead>
    <tbody>
    `;

    rows.forEach((r) => {

        const total = Number(r["Total Cost"] || 0);

        html += `
        <tr>
            <td>${r.Code || ""}</td>
            <td>${r.Description || ""}</td>
            <td>${r.Category || ""}</td>
            <td>${Number(r.Qty || 0).toLocaleString()}</td>
            <td>${Number(r.Rate || 0).toFixed(2)}</td>
            <td>${Number(r["Unit Cost"] || 0).toFixed(2)}</td>
            <td>${total.toFixed(2)}</td>
        </tr>
        `;

        switch (r.Category) {

            case "Labor":
                labor += total;
                break;

            case "Material":
                material += total;
                break;

            case "Equipment":
                equipment += total;
                break;

            case "Subcontract":
                subcontract += total;
                break;
        }

    });

    html += "</tbody>";

    table.innerHTML = html;

    console.log("========== TOTAL ==========");
    console.table([{
        Labor: labor,
        Material: material,
        Equipment: equipment,
        Subcontract: subcontract,
        Grand_Total: labor + material + equipment + subcontract
    }]);

    document.getElementById("laborTotal").innerHTML = labor.toFixed(2);
    document.getElementById("materialTotal").innerHTML = material.toFixed(2);
    document.getElementById("equipmentTotal").innerHTML = equipment.toFixed(2);
    document.getElementById("subcontractTotal").innerHTML = subcontract.toFixed(2);
    document.getElementById("grandTotal").innerHTML =
        (labor + material + equipment + subcontract).toFixed(2);
}

// ===============================
// EXPAND ALL
// ===============================

function expandAll() {
  document.querySelectorAll("#tree ul div").forEach((x) => {
    if (x.parentElement.children[1]) {
      x.parentElement.children[1].style.display = "block";
    }
  });
}

// ===============================
// COLLAPSE ALL
// ===============================

function collapseAll() {
  document.querySelectorAll("#tree ul ul").forEach((x) => {
    x.style.display = "none";
  });
}

// ===============================
// SEARCH
// ===============================

document.getElementById("searchTree").onkeyup = function () {
  let value = this.value.toLowerCase();

  document.querySelectorAll(".tree-row").forEach((row) => {
    row.style.display = row.innerText.toLowerCase().includes(value)
      ? "block"
      : "none";
  });
};

// ===============================
// UPLOAD MDB
// ===============================

async function uploadMDB(e) {
  const file = e.target.files[0];

  if (!file) return;

  let form = new FormData();

  form.append("mdbFile", file);

  await fetch(
    API + "/import-mdb",

    {
      method: "POST",

      body: form,
    },
  );

  alert("MDB Imported Successfully");

  loadTree();
}



async function loadCrew(sectionId) {
  const res = await fetch(API + "/crew/" + sectionId);

  const rows = await res.json();

  console.log("========== CREW ==========");
  console.log("SECTION:", sectionId);
  console.table(rows);

  console.table(
    rows.map((r) => ({
      BLID: r.BLID,
      BQS_ID: r.BQS_ID,
      line_no: r.line_no,
      Description: r.Description,
      Quantity: r.Quantity,
      UOM: r.UOM,
    })),
  );
  console.log("========== CREW END ==========");
  // const tbody = document.querySelector("#crewTable tbody");

  // tbody.innerHTML = "";

  // rows.forEach((r) => {
  //   tbody.innerHTML += `
  //       <tr>
  //           <td>${r.BLID || ""}</td>
  //           <td>${r.Code || ""}</td>
  //           <td>${r.Description || ""}</td>
  //           <td>${Number(r.Qty || 0).toLocaleString()}</td>
  //           <td>${Number(r.Rate || 0).toFixed(2)}</td>
  //           <td>${Number(r["Unit Cost"] || 0).toFixed(2)}</td>
  //           <td>${Number(r["Total Cost"] || 0).toFixed(2)}</td>
  //       </tr>`;
  // });
  const table = document.getElementById("crewTable");

let html = `
<thead>
    <tr>
        <th>BLID</th>
        <th>Code</th>
        <th>Description</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Unit Cost</th>
        <th>Total Cost</th>
    </tr>
</thead>
<tbody>
`;

rows.forEach((r) => {
    html += `
    <tr>
        <td>${r.BLID || ""}</td>
        <td>${r.Code || ""}</td>
        <td>${r.Description || ""}</td>
        <td>${Number(r.Qty || 0).toLocaleString()}</td>
        <td>${Number(r.Rate || 0).toFixed(2)}</td>
        <td>${Number(r["Unit Cost"] || 0).toFixed(2)}</td>
        <td>${Number(r["Total Cost"] || 0).toFixed(2)}</td>
    </tr>
    `;
});

html += `
</tbody>
`;

table.innerHTML = html;
}

async function loadMaterial(sectionId) {
  try {
    const res = await fetch(API + "/material/" + sectionId);

    const rows = await res.json();

    console.log("================================");
    console.log("          MATERIAL DATA          ");
    console.log("SECTION ID:", sectionId);
    console.table(rows);

    console.log(
      rows.map((r) => ({
        BLID: r.BLID,
        Code: r.Code,
        Description: r.Description,
        Quantity: r.Quantity,
        UOM: r.UOM,
        UnitCost: r["Unit Cost"],
        TotalCost: r["Total Cost"],
        Category: r.Category,
      })),
    );

    console.log("========== MATERIAL END ==========");

    const table = document.querySelector("#materialTable");

    let html = `

        <thead>
        <tr>
            <th>BLID</th>
            <th>Code</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>UOM</th>
            <th>Unit Cost</th>
            <th>Total Cost</th>
            <th>Category</th>
        </tr>
        </thead>

        <tbody>

        `;

    rows.forEach((r) => {
      html += `

            <tr>

            <td>${r.BLID || ""}</td>

            <td>${r.Code || ""}</td>

            <td>${r.Description || ""}</td>

            <td>${r.Quantity || 0}</td>

            <td>${r.UOM || ""}</td>

            <td>
            ${Number(r["Unit Cost"] || 0).toFixed(2)}
            </td>

            <td>
            ${Number(r["Total Cost"] || 0).toFixed(2)}
            </td>

            <td>
            ${r.Category || ""}
            </td>

            </tr>

            `;
    });

    html += "</tbody>";

    table.innerHTML = html;
  } catch (err) {
    console.error("MATERIAL ERROR:", err);
  }
}



const views=[
"detailView",
"laborRateView",
"materialRateView",
"equipmentRateView"
];

function showView(view){

    views.forEach(v=>{

        document.getElementById(v).style.display="none";

    });

    document.getElementById(view).style.display="block";

    document.querySelectorAll(".tabs button").forEach(btn=>{

        btn.classList.remove("active");

    });

}




document.getElementById("detailTab").onclick=()=>{

    showView("detailView");

    document.getElementById("detailTab").classList.add("active");

};

document.getElementById("laborRateTab").onclick=()=>{

    showView("laborRateView");

    document.getElementById("laborRateTab").classList.add("active");

    loadLaborRates();

};

document.getElementById("materialRateTab").onclick=()=>{

    showView("materialRateView");

    document.getElementById("materialRateTab").classList.add("active");

    loadMaterialRates();

};

document.getElementById("equipmentRateTab").onclick=()=>{

    showView("equipmentRateView");

    document.getElementById("equipmentRateTab").classList.add("active");

    loadEquipmentRates();

};

async function loadLaborRates() {

    const res = await fetch(API + "/labor-rates");
    const rows = await res.json();

    console.log("===== LABOR RATES =====");
    console.table(rows);

    const table = document.getElementById("laborRateTable");

    let html = `
    <thead>
        <tr>
            <th>Code</th>
            <th>Description</th>
            <th>Base Rate</th>
            <th>Burdens</th>
            <th>Total Rate</th>
        </tr>
    </thead>
    <tbody>
    `;

    rows.forEach(r => {

        html += `
        <tr>
            <td>${r.Code || ""}</td>
            <td>${r.Description || ""}</td>
            <td>${Number(r["Base Rate"] || 0).toFixed(2)}</td>
            <td>${Number(r.Burdens || 0).toFixed(2)}</td>
            <td>${Number(r["Total Rate"] || 0).toFixed(2)}</td>
        </tr>
        `;

    });

    html += `</tbody>`;

    table.innerHTML = html;
    
}

// async function loadMaterialRates() {

//     const res = await fetch(API + "/material-rates");
//     const rows = await res.json();

//     console.log("===== MATERIAL RATES =====");
//     console.table(rows);

//     const table = document.getElementById("materialRateTable");

//     let html = `
//     <thead>
//         <tr>
//             <th>Code</th>
//             <th>Description</th>
//             <th>Base Rate</th>
//             <th>Burdens</th>
//             <th>Total </th>
//         </tr>
//     </thead>
//     <tbody>
//     `;

//     rows.forEach(r => {

//         html += `
//         <tr>
//             <td>${r.Code || ""}</td>
//             <td>${r.Description || ""}</td>
//             <td>${Number(r["Base Rate"] || 0).toFixed(2)}</td>
//             <td>${Number(r.Burdens || 0).toFixed(2)}</td>
//             <td>${Number(r["totalCostt"] || 0).toFixed(2)}</td>
//         </tr>
//         `;

//     });

//     html += `</tbody>`;

//     table.innerHTML = html;
// }
// document.getElementById("materialRateTab").addEventListener("click", loadMaterialRates);

// async function loadMaterialRates() {

//     if (!currentBLID) {
//         alert("Please select a Bid Item first.");
//         return;
//     }

//     try {

//         const res = await fetch(`${API}/material-rates/${currentBLID}`);
//         const rows = await res.json();

//         const tbody = document.getElementById("materialRateBody");
//         tbody.innerHTML = "";

//         rows.forEach(r => {

//             tbody.innerHTML += `
//                 <tr>
//                     <td>${r.Description}</td>
//                     <td>${r.UOM}</td>
//                     <td>${Number(r.Quantity).toLocaleString()}</td>
//                     <td>${Number(r.unitCost).toFixed(3)}</td>
//                     <td>${Number(r.totalCost).toLocaleString(undefined,{
//                         minimumFractionDigits:3,
//                         maximumFractionDigits:3
//                     })}</td>
//                 </tr>
//             `;

//         });

//     } catch (err) {

//         console.error(err);

//     }

// }


// async function loadMaterialRates(){

//     if(currentBLID==null){

//         alert("Please select a Bid Item.");

//         return;

//     }

//     try{

//         const res = await fetch(API + "/material-rates/" + currentBLID);

//         const rows = await res.json();

//         let html="";

//         rows.forEach(r=>{

//             html+=`

//             <tr>

//                 <td>${r.Code || ""}</td>

//                 <td>${r.Description || ""}</td>

//                 <td>${r.UOM || ""}</td>

//                 <td>${Number(r.Quantity||0).toLocaleString()}</td>

//                 <td>${Number(r["Base Rate"]||0).toFixed(3)}</td>

//                 <td>${Number(r.Burdens||0).toFixed(3)}</td>

//                 <td>${Number(r["Total Rate"]||0).toFixed(3)}</td>

//                 <td>${Number(r["Total Cost"]||0).toFixed(3)}</td>

//             </tr>

//             `;

//         });

//         document.getElementById("materialRateBody").innerHTML=html;

//     }
//     catch(err){

//         console.log(err);

//     }

// }

// async function loadMaterialRates() {

//     if (!currentBLID) {
//         alert("Please select a Bid Line.");
//         return;
//     }

//     try {

//         const res = await fetch(API + "/material-rates/" + currentBLID);

//         const rows = await res.json();

//         console.table(rows);

//         const tbody = document.getElementById("materialRateBody");

//         tbody.innerHTML = "";

//         rows.forEach(r => {

//             tbody.innerHTML += `
//                 <tr>

//                     <td>${r.Code}</td>

//                     <td>${r.Description}</td>

//                     <td>${r.UOM}</td>

//                     <td>${Number(r.Quantity).toLocaleString()}</td>

//                     <td>${Number(r["Base Rate"]).toFixed(4)}</td>

//                     <td>${Number(r.Burdens).toFixed(4)}</td>

//                     <td>${Number(r["Total Rate"]).toFixed(4)}</td>

//                     <td>${Number(r["Unit Cost"]).toFixed(4)}</td>

//                     <td>${Number(r["Total Cost"]).toFixed(4)}</td>

//                 </tr>
//             `;

//         });

//     }
//     catch(err){

//         console.error(err);

//     }

// }

async function loadMaterialRates() {

    if (!currentBLID) {
        alert("Please select a Bid Line.");
        return;
    }

    try {

        const res = await fetch(API + "/material-rates/" + currentBLID);

        const rows = await res.json();

        console.table(rows);

        const tbody = document.getElementById("materialRateBody");

        tbody.innerHTML = "";

        rows.forEach(r => {

            tbody.innerHTML += `
                <tr>

                    <td>${r.Code || ""}</td>

                    <td>${r.Description || ""}</td>

                    <td>${r.UOM || ""}</td>

                    <td>${Number(r.Quantity || 0).toLocaleString()}</td>

                    <td>${Number(r.Waste || 0).toFixed(2)}</td>

                    <td>${Number(r.AdjQty || 0).toLocaleString()}</td>

                    <td>${Number(r["Base Rate"] || 0).toFixed(4)}</td>

                    <td>${Number(r.Burdens || 0).toFixed(4)}</td>

                    <td>${Number(r["Total Rate"] || 0).toFixed(4)}</td>

                    <td>${Number(r["Unit Cost"] || 0).toFixed(4)}</td>

                    <td>${Number(r["Total Cost"] || 0).toFixed(4)}</td>

                    <td>${Number(r["Mat Unit Cost"] || 0).toFixed(4)}</td>

                    <td>${Number(r["Mat Total Cost"] || 0).toFixed(4)}</td>

                    <td>${Number(r.adj_amt_lab || 0).toFixed(4)}</td>

                    <td>${Number(r.adj_amt_eq || 0).toFixed(4)}</td>

                    <td>${Number(r.adj_amt_mat || 0).toFixed(4)}</td>

                    <td>${Number(r.adj_amt_sub || 0).toFixed(4)}</td>

                    <td>${Number(r.total_adj_cost || 0).toFixed(4)}</td>

                    <td>${r.Category || ""}</td>

                    <td>${r["2nd Category"] || ""}</td>

                    <td>${r["3rd Category"] || ""}</td>

                </tr>
            `;

        });

    } catch (err) {

        console.error("Material Rates Error:", err);

    }

}
async function loadEquipmentRates() {

    const res = await fetch(API + "/equipment-rates");
    const rows = await res.json();

    console.log("===== EQUIPMENT RATES =====");
    console.table(rows);

    const table = document.getElementById("equipmentRateTable");

    let html = `
    <thead>
        <tr>
            <th>Code</th>
            <th>Description</th>
            <th>Rental Rate</th>
            <th>Internal Rate</th>
        </tr>
    </thead>
    <tbody>
    `;

    rows.forEach(r => {

        html += `
        <tr>
            <td>${r.Code || ""}</td>
            <td>${r.Description || ""}</td>
            <td>${Number(r["Rental Rate"] || 0).toFixed(2)}</td>
            <td>${Number(r["Internal Rate"] || 0).toFixed(2)}</td>
        </tr>
        `;

    });

    html += `</tbody>`;

    table.innerHTML = html;
}