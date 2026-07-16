// Pagination State
let currentOrgPage = 1;
let orgRowsPerPage = 5;
let currentOrgsList = [];

async function loadOrgsTable() {
    const { data, error } = await myClient
        .from("orgs") // Check DB table name
        .select("*")
        .order("org_name");

    if (error) {
        console.error(error);
        showToast(error.message, "error");
        return [];
    }
    return data;
}

function renderOrgsTable(orgs) {
    currentOrgsList = orgs;
    
    const rppSelect = document.getElementById("orgRowsPerPage").value;
    orgRowsPerPage = rppSelect === "all" ? currentOrgsList.length : parseInt(rppSelect);

    const maxPage = Math.ceil(currentOrgsList.length / orgRowsPerPage);
    if (currentOrgPage > maxPage && maxPage > 0) currentOrgPage = maxPage;
    if (currentOrgPage === 0 && maxPage > 0) currentOrgPage = 1;

    renderOrgsTableBody();
}

function renderOrgsTableBody() {
    const tbody = document.querySelector("#orgsTable tbody");
    tbody.innerHTML = "";

    if (currentOrgsList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="text-align: center; padding: 32px; color: #6b7280;">No organizations found.</td></tr>`;
        updateOrgPaginationInfo(0, 0);
        return;
    }

    const startIndex = (currentOrgPage - 1) * orgRowsPerPage;
    const endIndex = Math.min(startIndex + orgRowsPerPage, currentOrgsList.length);
    const recordsToShow = currentOrgsList.slice(startIndex, endIndex);

    recordsToShow.forEach(org => {
        tbody.innerHTML += `
            <tr>
                <td>${org.org_name}</td>
                <td>
                    <button class="btn-text btn-text-danger deleteOrg" data-id="${org.id}">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });

    document.querySelectorAll(".deleteOrg").forEach(button => {
        button.addEventListener("click", deleteOrg);
    });

    updateOrgPaginationInfo(startIndex, endIndex);
}

function updateOrgPaginationInfo(startIndex, endIndex) {
    const total = currentOrgsList.length;
    const infoDiv = document.getElementById("orgPaginationInfo");
    const indicator = document.getElementById("orgPageIndicator");
    const prevBtn = document.getElementById("prevOrgPageBtn");
    const nextBtn = document.getElementById("nextOrgPageBtn");

    if (total === 0) {
        infoDiv.textContent = "Showing 0 to 0 of 0 entries";
        indicator.textContent = "Page 1 of 1";
        prevBtn.disabled = true; nextBtn.disabled = true;
        return;
    }

    infoDiv.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${total} entries`;
    const maxPage = Math.ceil(total / orgRowsPerPage);
    indicator.textContent = `Page ${currentOrgPage} of ${maxPage}`;

    prevBtn.disabled = currentOrgPage === 1;
    nextBtn.disabled = currentOrgPage === maxPage;
}

// --- Event Listeners ---
document.getElementById("orgRowsPerPage").addEventListener("change", (e) => {
    const val = e.target.value;
    orgRowsPerPage = val === "all" ? currentOrgsList.length : parseInt(val);
    currentOrgPage = 1; 
    renderOrgsTableBody();
});

document.getElementById("prevOrgPageBtn").addEventListener("click", () => {
    if (currentOrgPage > 1) { currentOrgPage--; renderOrgsTableBody(); }
});

document.getElementById("nextOrgPageBtn").addEventListener("click", () => {
    const maxPage = Math.ceil(currentOrgsList.length / orgRowsPerPage);
    if (currentOrgPage < maxPage) { currentOrgPage++; renderOrgsTableBody(); }
});

// --- Core Database Logic ---
async function createOrg() {
    const orgName = document.getElementById("orgNameInput").value.trim();

    if (!orgName) {
        showToast("Please enter an organization name.", "error"); 
        return;
    }

    // Duplicate Check Validation
    const { data: existingOrgs, error: checkError } = await myClient
        .from("orgs")
        .select("id")
        .ilike("org_name", orgName); 

    if (existingOrgs && existingOrgs.length > 0) {
        showToast("This organization already exists!", "error");
        return;
    }

    // Insert into DB
    const { error } = await myClient
        .from("orgs")
        .insert([{ org_name: orgName }]);

    if (error) {
        console.error(error);
        showToast(error.message, "error");
        return;
    }

    showToast("Organization added successfully!", "success");
    document.getElementById("orgNameInput").value = "";
    
    const orgs = await loadOrgsTable();
    renderOrgsTable(orgs);
}

async function deleteOrg(event) {
    const orgId = event.target.dataset.id;
    const isConfirmed = await showConfirmModal(); // Reusing our global premium modal!
    
    if (!isConfirmed) return;

    const { error } = await myClient
        .from("orgs")
        .delete()
        .eq("id", orgId);

    if (error) {
        console.error("Error deleting org:", error);
        // If it throws a foreign key error, it means attendance records exist for this org
        if (error.code === "23503") {
            showToast("Cannot delete: Records exist for this organization.", "error");
        } else {
            showToast(error.message, "error");
        }
        return;
    }

    const orgs = await loadOrgsTable();
    renderOrgsTable(orgs);
}

document.getElementById("createOrgBtn").addEventListener("click", createOrg);
document.getElementById("clearOrgBtn").addEventListener("click", () => {
    document.getElementById("orgNameInput").value = "";
});