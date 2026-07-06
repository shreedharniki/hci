// ======================================
// Chief Estimator Dashboard
// Part 3.1
// Tree Rendering
// ======================================

const API = "http://localhost:3000";

let treeData = [];
let treeMap = {};


// ======================================
// Initialize
// ======================================

window.onload = function () {

    loadTree();

    initializeToolbar();

    initializeTabs();

};

// ======================================
// Toolbar
// ======================================

function initializeToolbar() {

    document
        .getElementById("expandAll")
        .onclick = expandAll;

    document
        .getElementById("collapseAll")
        .onclick = collapseAll;

}

// ======================================
// Tabs
// ======================================

function initializeTabs() {

    const detailTab =
        document.getElementById("detailTab");

    const listTab =
        document.getElementById("listTab");

    if (!detailTab || !listTab)
        return;

    detailTab.onclick = function () {

        detailTab.classList.add("active");

        listTab.classList.remove("active");

        detailView.style.display = "block";

        listView.style.display = "none";

    };

    listTab.onclick = function () {

        listTab.classList.add("active");

        detailTab.classList.remove("active");

        detailView.style.display = "none";

        listView.style.display = "block";

    };

}

// ======================================
// Load Tree
// ======================================

async function loadTree() {

    const res =
        await fetch(API + "/tree");

    treeData =
        await res.json();

    buildTree(treeData);

}

// ======================================
// Build Tree
// ======================================

function buildTree(rows) {

    treeMap = {};

    rows.forEach(r => {

        treeMap[r.old_id] = {

            ...r,

            children: []

        };

    });

    rows.forEach(r => {

        if (
            r.IDParent != 0 &&
            treeMap[r.IDParent]
        ) {

            treeMap[r.IDParent]
                .children
                .push(treeMap[r.old_id]);

        }

    });

    const tree =
        document.getElementById("tree");

    tree.innerHTML = "";

    rows
        .filter(r => r.IDParent == 0)
        .forEach(r => {

            tree.appendChild(

                drawNode(
                    treeMap[r.old_id]
                )

            );

        });

}

// ======================================
// Draw Node
// ======================================

function drawNode(node) {

    const ul =
        document.createElement("ul");

    const li =
        document.createElement("li");

    const row =
        document.createElement("div");

    row.className = "tree-row";

    const toggle =
        document.createElement("span");

    toggle.className = "toggle";

    const icon =
        document.createElement("span");

    icon.className = "icon";

    const label =
        document.createElement("span");

    label.className = "label";

    const qty =
        Number(node.Quantity || 0)
            .toLocaleString(undefined, {

                maximumFractionDigits: 4

            });

    label.innerHTML = `

        <b>${node.line_no}</b>

        ${node.Description}

        <span class="qty">

            (${qty} ${node.UOM})

        </span>

    `;

    row.appendChild(toggle);

    row.appendChild(icon);

    row.appendChild(label);

    li.appendChild(row);

    ul.appendChild(li);

    // ===========================
    // Children
    // ===========================

    let childContainer = null;

    if (node.children.length > 0) {

        toggle.innerHTML =
            '<i class="fa-solid fa-square-plus"></i>';

        icon.innerHTML =
            '<i class="fa-regular fa-folder"></i>';

        childContainer =
            document.createElement("div");

        childContainer.className =
            "children hidden";

        node.children.forEach(c => {

            childContainer.appendChild(

                drawNode(c)

            );

        });

        li.appendChild(childContainer);

        toggle.onclick = function (e) {

            e.stopPropagation();

            if (
                childContainer.classList.contains("hidden")
            ) {

                childContainer.classList.remove("hidden");

                toggle.innerHTML =
                    '<i class="fa-solid fa-square-minus"></i>';

                icon.innerHTML =
                    '<i class="fa-regular fa-folder-open"></i>';

            }
            else {

                childContainer.classList.add("hidden");

                toggle.innerHTML =
                    '<i class="fa-solid fa-square-plus"></i>';

                icon.innerHTML =
                    '<i class="fa-regular fa-folder"></i>';

            }

        };

    }
    else {

        toggle.innerHTML = "";

        icon.innerHTML =
            '<i class="fa-regular fa-file-lines"></i>';

    }

    // ===========================
    // Select Node
    // ===========================

    row.onclick = function () {

        document
            .querySelectorAll(".tree-row")
            .forEach(r => {

                r.classList.remove("selected");

            });

        row.classList.add("selected");

        // Part 3.2
        loadSummary(node);

        loadResources(node);
        
        loadBidListing(node);

    };

    return ul;

}
async function loadBidListing(node){

    const res = await fetch(
        API + "/bidlisting/" + node.old_id
    );

    const rows = await res.json();

    let html = `
    <tr>
        <th>Line/Code</th>
        <th>Description</th>
        <th>UOM</th>
        <th>Quantity</th>
        <th>Unit Cost</th>
        <th>Total Cost</th>
        <th>Man Hours</th>
        <th>Prod</th>
    </tr>
    `;

    rows.forEach(r=>{

        html += `
        <tr>

            <td>${r.line_no}</td>

            <td>${r.Description}</td>

            <td>${r.UOM}</td>

            <td>${Number(r.Quantity).toLocaleString()}</td>

            <td>${Number(r.UnitCost||0).toLocaleString()}</td>

            <td>${Number(r.TotalCost||0).toLocaleString()}</td>

            <td>${Number(r.ManHours||0).toLocaleString()}</td>

            <td>${r.Production||"n/a"}</td>

        </tr>
        `;

    });

    document.getElementById("listTable").innerHTML = html;

}

// ======================================
// Expand All
// ======================================

function expandAll() {

    document
        .querySelectorAll(".children")
        .forEach(c => {

            c.classList.remove("hidden");

        });

    document
        .querySelectorAll(".toggle")
        .forEach(t => {

            if (t.innerHTML !== "") {

                t.innerHTML =
                    '<i class="fa-solid fa-square-minus"></i>';

            }

        });

    document
        .querySelectorAll(".icon")
        .forEach(i => {

            if (
                i.innerHTML.includes("folder")
            ) {

                i.innerHTML =
                    '<i class="fa-regular fa-folder-open"></i>';

            }

        });

}

// ======================================
// Collapse All
// ======================================

function collapseAll() {

    document
        .querySelectorAll(".children")
        .forEach(c => {

            c.classList.add("hidden");

        });

    document
        .querySelectorAll(".toggle")
        .forEach(t => {

            if (t.innerHTML !== "") {

                t.innerHTML =
                    '<i class="fa-solid fa-square-plus"></i>';

            }

        });

    document
        .querySelectorAll(".icon")
        .forEach(i => {

            if (
                i.innerHTML.includes("folder")
            ) {

                i.innerHTML =
                    '<i class="fa-regular fa-folder"></i>';

            }

        });

}
// ======================================
// Part 3.2a
// Detail + Resources
// ======================================


// --------------------------------------
// Load Section Summary
// --------------------------------------

function loadSummary(node){

    const title =
        document.getElementById("costBreakdownTitle");

    if(title){

        title.textContent =
            `Cost Breakdown - ${node.source_file}`;

    }

    document.getElementById("lineNo").value =
        node.line_no || "";

    document.getElementById("description").value =
        node.Description || "";

    document.getElementById("altDescription").value =
        node.Description || "";

    document.getElementById("quantity").value =
        Number(node.Quantity || 0)
            .toLocaleString();

    document.getElementById("unit").value =
        node.UOM || "";

    document.getElementById("status").value =
        "Bid";

    document.getElementById("unitCost").value = "";

    document.getElementById("totalCost").value = "";

    document.getElementById("workGroup").value = "";

    document.getElementById("location").value = "";

}



// --------------------------------------
// Load Resources
// --------------------------------------

async function loadResources(node){

    const res =
        await fetch(
            API + "/resources/" + node.old_id
        );

    const resources =
        await res.json();

    const tbody =
        document.querySelector(
            "#resourceTable tbody"
        );

    tbody.innerHTML = "";

    if(resources.length===0){

        tbody.innerHTML=`

        <tr>

            <td colspan="7"
                style="text-align:center;padding:20px;">

                No Resources Found

            </td>

        </tr>

        `;

        clearTotals();

        return;

    }


    let labor = 0;

    let equipment = 0;

    let material = 0;

    let subcontract = 0;

    let grand = 0;


    resources.forEach(r=>{

        const tr =
            document.createElement("tr");


        const qty =
            Number(r.Qty || 0);

        const rate =
            Number(r.Rate || 0);

        const unit =
            Number(r["Unit Cost"] || 0);

        const total =
            Number(r["Total Cost"] || 0);


        tr.innerHTML = `

        <td>${r.Code || ""}</td>

        <td>${r.Description || ""}</td>

        <td>${r.Category || ""}</td>

        <td style="text-align:right">

            ${qty.toLocaleString()}

        </td>

        <td style="text-align:right">

            ${rate.toFixed(2)}

        </td>

        <td style="text-align:right">

            ${unit.toFixed(2)}

        </td>

        <td style="text-align:right">

            ${total.toFixed(2)}

        </td>

        `;

        tbody.appendChild(tr);


        switch((r.Category || "").toLowerCase()){

            case "labor":

                labor += total;

                break;

            case "equipment":

                equipment += total;

                break;

            case "material":

                material += total;

                break;

            case "subcontract":

                subcontract += total;

                break;

        }

        grand += total;

    });


    updateTotals(

        labor,

        equipment,

        material,

        subcontract,

        grand

    );


    document.getElementById("unitCost").value =
        resources.length
        ? resources[0]["Unit Cost"] || ""
        : "";

    document.getElementById("totalCost").value =
        grand.toFixed(2);

}



// --------------------------------------
// Update Status Bar
// --------------------------------------

function updateTotals(

    labor,

    equipment,

    material,

    subcontract,

    total

){

    document.getElementById("laborTotal").textContent =
        "$" + labor.toLocaleString(undefined,{
            minimumFractionDigits:2
        });

    document.getElementById("equipmentTotal").textContent =
        "$" + equipment.toLocaleString(undefined,{
            minimumFractionDigits:2
        });

    document.getElementById("materialTotal").textContent =
        "$" + material.toLocaleString(undefined,{
            minimumFractionDigits:2
        });

    document.getElementById("subcontractTotal").textContent =
        "$" + subcontract.toLocaleString(undefined,{
            minimumFractionDigits:2
        });

    document.getElementById("grandTotal").textContent =
        "$" + total.toLocaleString(undefined,{
            minimumFractionDigits:2
        });

}



// --------------------------------------
// Clear Totals
// --------------------------------------

function clearTotals(){

    updateTotals(

        0,

        0,

        0,

        0,

        0

    );

}

// ======================================
// Part 3.2b
// Tabs + Search + List View
// ======================================


// --------------------------------------
// Detail / List Tabs
// --------------------------------------

document.getElementById("detailTab").onclick = function () {

    this.classList.add("active");

    document
        .getElementById("listTab")
        .classList.remove("active");

    document
        .getElementById("detailView")
        .style.display = "block";

    document
        .getElementById("listView")
        .style.display = "none";

};

document.getElementById("listTab").onclick = function () {

    this.classList.add("active");

    document
        .getElementById("detailTab")
        .classList.remove("active");

    document
        .getElementById("detailView")
        .style.display = "none";

    document
        .getElementById("listView")
        .style.display = "block";

    buildListTable();

};


// --------------------------------------
// Resource Tabs
// --------------------------------------

document.querySelectorAll(".resource-tab")
.forEach(btn=>{

    btn.onclick=function(){

        document
        .querySelectorAll(".resource-tab")
        .forEach(x=>x.classList.remove("active"));

        this.classList.add("active");

        document.getElementById("libraryTab").style.display="none";
        document.getElementById("adjustmentsTab").style.display="none";
        document.getElementById("notesTab").style.display="none";

        const tab=this.dataset.tab;

        if(tab==="library")
            document.getElementById("libraryTab").style.display="block";

        if(tab==="adjustments")
            document.getElementById("adjustmentsTab").style.display="block";

        if(tab==="notes")
            document.getElementById("notesTab").style.display="block";

    };

});


// --------------------------------------
// Search Tree
// --------------------------------------

document
.getElementById("searchTree")
.addEventListener("keyup",function(){

    const value=this.value.toLowerCase();

    document
    .querySelectorAll(".tree-row")
    .forEach(row=>{

        if(row.innerText.toLowerCase().includes(value)){

            row.parentElement.style.display="";

        }
        else{

            row.parentElement.style.display="none";

        }

    });

});


// --------------------------------------
// Build List View
// --------------------------------------

function buildListTable(){

    const table =
        document.getElementById("listTable");

    let html = `

    <tr>

        <th>Line</th>

        <th>Description</th>

        <th>Quantity</th>

        <th>Unit</th>

    </tr>

    `;

    treeData.forEach(r=>{

        html += `

        <tr>

            <td>${r.line_no}</td>

            <td>${r.Description}</td>

            <td style="text-align:right">

                ${Number(r.Quantity||0).toLocaleString()}

            </td>

            <td>${r.UOM}</td>

        </tr>

        `;

    });

    table.innerHTML=html;

}


// --------------------------------------
// Auto Select First Node
// --------------------------------------

function autoSelectFirstNode(){

    const first =
        document.querySelector(".tree-row");

    if(first){

        first.click();

    }

}


// --------------------------------------
// Keyboard Shortcut
// Ctrl + F
// --------------------------------------

document.addEventListener("keydown",function(e){

    if(e.ctrlKey && e.key==="f"){

        e.preventDefault();

        document
            .getElementById("searchTree")
            .focus();

    }

});


// --------------------------------------
// Wait for Tree then Select First
// --------------------------------------

setTimeout(function(){

    autoSelectFirstNode();

},400);

// ==========================================
// Part 3.3
// Keyboard + Utilities + Finishing
// ==========================================

let selectedNode = null;

// ------------------------------------------
// Remember Selected Node
// ------------------------------------------

function selectTreeNode(row, node) {

    document
        .querySelectorAll(".tree-row")
        .forEach(r => r.classList.remove("selected"));

    row.classList.add("selected");

    selectedNode = node;

    loadSummary(node);

    loadResources(node);

}

// ------------------------------------------
// Refresh Tree
// ------------------------------------------

async function refreshTree() {

    await loadTree();

    setTimeout(() => {

        autoSelectFirstNode();

    }, 300);

}

// ------------------------------------------
// Upload Button
// ------------------------------------------

const upload =
    document.getElementById("estimateFile");

if (upload) {

    upload.addEventListener("change", function () {

        if (!this.files.length)
            return;

        const file = this.files[0];

        alert("Selected File:\n\n" + file.name);

        // Future:
        // uploadEstimate(file);

    });

}

// ------------------------------------------
// ESC clears search
// ------------------------------------------

document.addEventListener("keydown", function (e) {

    if (e.key === "Escape") {

        const box =
            document.getElementById("searchTree");

        box.value = "";

        box.dispatchEvent(
            new Event("keyup")
        );

    }

});

// ------------------------------------------
// F5 Refresh Tree
// ------------------------------------------

document.addEventListener("keydown", function (e) {

    if (e.key === "F5") {

        e.preventDefault();

        refreshTree();

    }

});

// ------------------------------------------
// Arrow Navigation
// ------------------------------------------

document.addEventListener("keydown", function (e) {

    if (!selectedNode)
        return;

    const rows =
        [...document.querySelectorAll(".tree-row")];

    const current =
        document.querySelector(".tree-row.selected");

    if (!current)
        return;

    let index =
        rows.indexOf(current);

    if (e.key === "ArrowDown") {

        if (index < rows.length - 1) {

            rows[index + 1].click();

            rows[index + 1]
                .scrollIntoView({
                    block: "nearest"
                });

        }

    }

    if (e.key === "ArrowUp") {

        if (index > 0) {

            rows[index - 1].click();

            rows[index - 1]
                .scrollIntoView({
                    block: "nearest"
                });

        }

    }

});

// ------------------------------------------
// Double Click Expand / Collapse
// ------------------------------------------

document.addEventListener("dblclick", function (e) {

    const toggle =
        e.target.closest(".toggle");

    if (!toggle)
        return;

    toggle.click();

});

// ------------------------------------------
// Select First Node After Load
// ------------------------------------------

function autoSelectFirstNode() {

    const first =
        document.querySelector(".tree-row");

    if (first)
        first.click();

}

// ------------------------------------------
// Expand Everything
// ------------------------------------------

function expandEverything() {

    document
        .querySelectorAll(".children")
        .forEach(c => {

            c.classList.remove("hidden");

        });

    document
        .querySelectorAll(".toggle")
        .forEach(t => {

            if (t.innerHTML !== "") {

                t.innerHTML =
                    '<i class="fa-solid fa-square-minus"></i>';

            }

        });

    document
        .querySelectorAll(".icon")
        .forEach(i => {

            if (
                i.innerHTML.includes("folder")
            ) {

                i.innerHTML =
                    '<i class="fa-regular fa-folder-open"></i>';

            }

        });

}

// ------------------------------------------
// Collapse Everything
// ------------------------------------------

function collapseEverything() {

    document
        .querySelectorAll(".children")
        .forEach(c => {

            c.classList.add("hidden");

        });

    document
        .querySelectorAll(".toggle")
        .forEach(t => {

            if (t.innerHTML !== "") {

                t.innerHTML =
                    '<i class="fa-solid fa-square-plus"></i>';

            }

        });

    document
        .querySelectorAll(".icon")
        .forEach(i => {

            if (
                i.innerHTML.includes("folder")
            ) {

                i.innerHTML =
                    '<i class="fa-regular fa-folder"></i>';

            }

        });

}

// ------------------------------------------
// Toolbar Buttons
// ------------------------------------------

document
    .getElementById("expandAll")
    .onclick = expandEverything;

document
    .getElementById("collapseAll")
    .onclick = collapseEverything;

// ------------------------------------------
// Auto Load
// ------------------------------------------

window.addEventListener("load", function () {

    refreshTree();

});

console.log("Chief Estimator Ready");