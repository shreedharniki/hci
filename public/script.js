const API = "http://localhost:3000";

// ===============================
// FORMAT NUMBER
// ===============================
function formatNumber(value) {
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
    });
}

// ===============================
// CALCULATE
// ===============================
function calculate() {

    const qty = parseFloat(document.getElementById("quantity").value) || 0;
    const baseCost = parseFloat(document.getElementById("baseCost").value) || 0;

    const margins = [
        {
            name: "Indirect Cost",
            percent: parseFloat(document.getElementById("indirect").value) || 0
        },
        {
            name: "Travel & Subsistence",
            percent: parseFloat(document.getElementById("travel").value) || 0
        },
        {
            name: "Escalation",
            percent: parseFloat(document.getElementById("escalation").value) || 0
        },
        {
            name: "Engineering Design",
            percent: parseFloat(document.getElementById("engineering").value) || 0
        },
        {
            name: "Contingency",
            percent: parseFloat(document.getElementById("contingency").value) || 0
        },
        {
            name: "Overhead & Profit",
            percent: parseFloat(document.getElementById("overhead").value) || 0
        },
        {
            name: "Guarantees & Insurance",
            percent: parseFloat(document.getElementById("insurance").value) || 0
        }
    ];

    const ownerPercent = parseFloat(document.getElementById("owner").value) || 0;

    let currentBase = baseCost;
    let contractorPrice = baseCost;

    const tbody = document.getElementById("marginTable");
    tbody.innerHTML = "";

    margins.forEach(item => {

        const marginAmount = currentBase * item.percent / 100;
        const cumulative = currentBase + marginAmount;

        tbody.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${item.percent.toFixed(2)}%</td>
                <td>${formatNumber(currentBase)}</td>
                <td>${formatNumber(marginAmount)}</td>
                <td>${formatNumber(cumulative)}</td>
            </tr>
        `;

        currentBase = cumulative;
        contractorPrice = cumulative;
    });

    const ownerPrice = contractorPrice * ownerPercent / 100;
    const totalProjectPrice = contractorPrice + ownerPrice;

    const unitCost = qty > 0 ? baseCost / qty : 0;
    const contractorUnit = qty > 0 ? contractorPrice / qty : 0;
    const totalUnit = qty > 0 ? totalProjectPrice / qty : 0;

    document.getElementById("contractorPrice").textContent = formatNumber(contractorPrice);
    document.getElementById("ownerPrice").textContent = formatNumber(ownerPrice);
    document.getElementById("totalPrice").textContent = formatNumber(totalProjectPrice);

    document.getElementById("unitCost").textContent = unitCost.toFixed(5);
    document.getElementById("contractorUnit").textContent = contractorUnit.toFixed(5);
    document.getElementById("totalUnit").textContent = totalUnit.toFixed(5);

    console.log("Quantity :", qty);
    console.log("Base Cost:", baseCost);
}

// ===============================
// LOAD PROJECT INFO
// ===============================
async function loadProjectInfo() {

    try {

        const response = await fetch(`${API}/project-info`);

        if (!response.ok) {
            throw new Error("Failed to load project info");
        }

        const data = await response.json();

        document.getElementById("estimateCode").value = data.estimateCode || "";
        document.getElementById("currency").value = data.currency || "";
        document.getElementById("bidName").value = data.bidName || "";
        document.getElementById("quantity").value = data.quantity || "";
        document.getElementById("unit").value = data.unit || "";

        // Calculate after loading quantity
        calculate();

    } catch (err) {
        console.error("Project Info Error:", err);
    }
}

// ===============================
// PAGE LOAD
// ===============================
window.addEventListener("DOMContentLoaded", async () => {

    // Load project information first
    await loadProjectInfo();

    // Add event listeners
    document.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", calculate);
    });

    // Initial calculation
    calculate();

});