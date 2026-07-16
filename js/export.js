document.getElementById("exportCsvBtn").addEventListener("click", handleExportClick);

async function handleExportClick() {
    // Matches your original empty check logic
    if (filteredAttendanceData.length === 0) {
        showToast("There are no records to export.", "error"); 
        return;
    }

    // Trigger the custom modal and wait for the filename
    const filename = await showExportModal();
    
    // If they clicked Cancel, stop silently
    if (!filename) return; 

    exportToCSV(filename);
}

// --- Premium Custom Export Dialog Logic ---
function showExportModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById("exportModal");
        const input = document.getElementById("exportInput");
        const confirmBtn = document.getElementById("confirmExportBtn");
        const cancelBtn = document.getElementById("cancelExportBtn");

        // Matched your exact default filename convention
        const defaultName = `Attendance_${new Date().toISOString().split("T")[0]}`;
        input.value = defaultName;
        
        // Show modal and automatically highlight the text
        modal.classList.add("show");
        input.focus();
        input.select(); 

        const cleanup = (result) => {
            modal.classList.remove("show");
            confirmBtn.onclick = null;
            cancelBtn.onclick = null;
            resolve(result);
        };

        // If they leave it blank, fall back to the default name
        confirmBtn.onclick = () => cleanup(input.value.trim() || defaultName);
        cancelBtn.onclick = () => cleanup(null);
    });
}

// --- Core CSV Generation ---
function exportToCSV(filename) {
    // Matched your exact headers
    const headers = ["Name", "Organization", "Date", "Meeting", "Time In", "Remarks"];
    
    const rows = filteredAttendanceData.map(record => {
        const formattedTime = new Date(record.Time_In).toLocaleTimeString("en-PH", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });

        // Matched your data mapping, added CSV quote wrapping for safety
        return [
            `"${record.Name}"`,
            `"${record.Organization}"`,
            `"${record.Date}"`,
            `"${record.meetings?.meeting_name ?? ""}"`,
            `"${formattedTime}"`,
            `"${record.Remarks}"`
        ];
    });

    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    // Ensure the filename ends with .csv
    const finalFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    
    link.href = url;
    link.download = finalFilename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Kept your excellent memory cleanup line
    URL.revokeObjectURL(url);

    // Give satisfying premium feedback
    showToast("CSV Exported Successfully!", "success");
}