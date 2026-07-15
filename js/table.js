let currentPage = 1;
let rowsPerPage = 10;
let currentRecords = [];

// The main function called by filtering.js and admin.js
function renderTable(records) {
    currentRecords = records;
    currentPage = 1; // Always reset to page 1 when new data/filters are applied
    
    // Check what the dropdown is currently set to
    const rppSelect = document.getElementById("rowsPerPage").value;
    rowsPerPage = rppSelect === "all" ? currentRecords.length : parseInt(rppSelect);

    renderTableBody();
}

function renderTableBody() {
    const tbody = document.querySelector("#attendanceTable tbody");
    tbody.innerHTML = "";

    // Handle empty state gracefully
    if (currentRecords.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 32px; color: #6b7280;">No records found.</td></tr>`;
        updatePaginationInfo(0, 0);
        return;
    }

    // Calculate slicing limits for the current page
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, currentRecords.length);
    const recordsToShow = currentRecords.slice(startIndex, endIndex);

    // Draw the sliced records
    recordsToShow.forEach(record => {
        const timeOnly = new Date(record.Time_In).toLocaleTimeString("en-PH", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });

        tbody.innerHTML += `
            <tr>
                <td>${record.Name}</td>
                <td>${record.Organization}</td>
                <td>${record.Date}</td>
                <td>${record.MeetingName}</td>
                <td>${timeOnly}</td>
                <td>${record.Remarks}</td>
            </tr>
        `;
    });

    updatePaginationInfo(startIndex, endIndex);
}

function updatePaginationInfo(startIndex, endIndex) {
    const total = currentRecords.length;
    const infoDiv = document.getElementById("paginationInfo");
    const indicator = document.getElementById("pageIndicator");
    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");

    if (total === 0) {
        infoDiv.textContent = "Showing 0 to 0 of 0 entries";
        indicator.textContent = "Page 1 of 1";
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }

    infoDiv.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${total} entries`;
    
    const maxPage = Math.ceil(total / rowsPerPage);
    indicator.textContent = `Page ${currentPage} of ${maxPage}`;

    // Disable buttons if we are at the extreme ends
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === maxPage;
}

// --- Event Listeners for the Controls ---

document.getElementById("rowsPerPage").addEventListener("change", (e) => {
    const val = e.target.value;
    // If "all" is selected, grab the entire array length
    rowsPerPage = val === "all" ? currentRecords.length : parseInt(val);
    currentPage = 1; 
    renderTableBody();
});

document.getElementById("prevPageBtn").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderTableBody();
    }
});

document.getElementById("nextPageBtn").addEventListener("click", () => {
    const maxPage = Math.ceil(currentRecords.length / rowsPerPage);
    if (currentPage < maxPage) {
        currentPage++;
        renderTableBody();
    }
});