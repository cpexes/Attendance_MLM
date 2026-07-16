document
    .getElementById("clearAttendanceBtn")
    .addEventListener("click", clearAttendanceRecords);

async function clearAttendanceRecords() {

    // 1. Trigger our new premium modal instead of the browser prompt
    const isConfirmed = await showPromptModal();

    // 2. If they hit cancel, just stop the function silently
    if (!isConfirmed) {
        return;
    }

    // 3. Execute the database wipe
    const { error } = await myClient
        .rpc("clear_attendance_records");

    if (error) {
        console.error(error);
        showToast(error.message, "error"); // Upgraded to premium toast
        return;
    }

    await refreshAttendancePage();

    showToast("All attendance records have been deleted.", "success"); // Upgraded to premium toast
}

// --- Premium Custom Prompt Dialog Logic ---
function showPromptModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById("promptModal");
        const input = document.getElementById("promptInput");
        const confirmBtn = document.getElementById("confirmPromptBtn");
        const cancelBtn = document.getElementById("cancelPromptBtn");

        // Reset the modal state every time it opens
        input.value = "";
        confirmBtn.disabled = true;
        modal.classList.add("show");
        input.focus(); // Automatically put the cursor in the box

        // Listen for typing to enable the danger button
        const handleInput = (e) => {
            if (e.target.value === "DELETE") {
                confirmBtn.disabled = false;
            } else {
                confirmBtn.disabled = true;
            }
        };
        input.addEventListener("input", handleInput);

        // Cleanup and resolve
        const cleanup = (result) => {
            modal.classList.remove("show");
            input.removeEventListener("input", handleInput);
            confirmBtn.onclick = null;
            cancelBtn.onclick = null;
            resolve(result);
        };

        confirmBtn.onclick = () => cleanup(true);
        cancelBtn.onclick = () => cleanup(false);
    });
}