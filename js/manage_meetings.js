let editingMeetingId = null;

// Pagination State
let currentMeetingPage = 1;
let meetingRowsPerPage = 10;
let currentMeetingsList = [];

async function loadMeetingsTable() {
    const { data, error } = await myClient
        .from("meetings")
        .select("*")
        .order("start_time");

    if (error) {
        console.error(error);
        showToast(error.message, "error");
        return [];
    }

    return data;
}

function formatMeetingTime(time) {
    return new Date(`1970-01-01T${time}`)
        .toLocaleTimeString("en-PH", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
}

// Intercepts the raw data and prepares pagination
function renderMeetingsTable(meetings) {
    currentMeetingsList = meetings;
    
    // Check dropdown value
    const rppSelect = document.getElementById("meetingRowsPerPage").value;
    meetingRowsPerPage = rppSelect === "all" ? currentMeetingsList.length : parseInt(rppSelect);

    // Keep page in bounds in case of deletions
    const maxPage = Math.ceil(currentMeetingsList.length / meetingRowsPerPage);
    if (currentMeetingPage > maxPage && maxPage > 0) currentMeetingPage = maxPage;
    if (currentMeetingPage === 0 && maxPage > 0) currentMeetingPage = 1;

    renderMeetingsTableBody();
}

// Handles slicing and drawing the HTML
function renderMeetingsTableBody() {
    const tbody = document.querySelector("#meetingsTable tbody");
    tbody.innerHTML = "";

    if (currentMeetingsList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 32px; color: #6b7280;">No meetings found.</td></tr>`;
        updateMeetingPaginationInfo(0, 0);
        return;
    }

    // Calculate slicing limits
    const startIndex = (currentMeetingPage - 1) * meetingRowsPerPage;
    const endIndex = Math.min(startIndex + meetingRowsPerPage, currentMeetingsList.length);
    const recordsToShow = currentMeetingsList.slice(startIndex, endIndex);

    recordsToShow.forEach(meeting => {
        tbody.innerHTML += `
            <tr>
                <td>${meeting.meeting_name}</td>
                <td>${formatMeetingTime(meeting.start_time)}</td>
                <td>${formatMeetingTime(meeting.cutoff_time)}</td>
                <td>
                    <!-- PREMIUM TOGGLE SWITCH ADDED HERE -->
                    <label class="toggle-switch">
                        <input
                            type="checkbox"
                            class="meetingActive"
                            data-id="${meeting.id}"
                            ${meeting.active ? "checked" : ""}
                        >
                        <span class="slider"></span>
                    </label>
                </td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-text editMeeting" data-id="${meeting.id}">
                            Edit
                        </button>
                        <button class="btn-text btn-text-danger deleteMeeting" data-id="${meeting.id}">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    // Re-attach event listeners to the newly drawn buttons
    document.querySelectorAll(".meetingActive").forEach(checkbox => {
        checkbox.addEventListener("change", toggleMeetingStatus);
    });

    document.querySelectorAll(".editMeeting").forEach(button => {
        button.addEventListener("click", loadMeetingForEdit);
    });

    document.querySelectorAll(".deleteMeeting").forEach(button => {
        button.addEventListener("click", deleteMeeting);
    });

    updateMeetingPaginationInfo(startIndex, endIndex);
}

// Updates the text and buttons at the bottom
function updateMeetingPaginationInfo(startIndex, endIndex) {
    const total = currentMeetingsList.length;
    const infoDiv = document.getElementById("meetingPaginationInfo");
    const indicator = document.getElementById("meetingPageIndicator");
    const prevBtn = document.getElementById("prevMeetingPageBtn");
    const nextBtn = document.getElementById("nextMeetingPageBtn");

    if (total === 0) {
        infoDiv.textContent = "Showing 0 to 0 of 0 entries";
        indicator.textContent = "Page 1 of 1";
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }

    infoDiv.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${total} entries`;
    
    const maxPage = Math.ceil(total / meetingRowsPerPage);
    indicator.textContent = `Page ${currentMeetingPage} of ${maxPage}`;

    prevBtn.disabled = currentMeetingPage === 1;
    nextBtn.disabled = currentMeetingPage === maxPage;
}

// --- Pagination Event Listeners ---
document.getElementById("meetingRowsPerPage").addEventListener("change", (e) => {
    const val = e.target.value;
    meetingRowsPerPage = val === "all" ? currentMeetingsList.length : parseInt(val);
    currentMeetingPage = 1; 
    renderMeetingsTableBody();
});

document.getElementById("prevMeetingPageBtn").addEventListener("click", () => {
    if (currentMeetingPage > 1) {
        currentMeetingPage--;
        renderMeetingsTableBody();
    }
});

document.getElementById("nextMeetingPageBtn").addEventListener("click", () => {
    const maxPage = Math.ceil(currentMeetingsList.length / meetingRowsPerPage);
    if (currentMeetingPage < maxPage) {
        currentMeetingPage++;
        renderMeetingsTableBody();
    }
});

// --- Core Database Logic ---

async function toggleMeetingStatus(event) {
    const checkbox = event.target;
    const meetingId = checkbox.dataset.id;
    const active = checkbox.checked;

    const { error } = await myClient
        .from("meetings")
        .update({ active: active })
        .eq("id", meetingId);

    if (error) {
        console.error(error);
        showToast(error.message, "error");
        checkbox.checked = !active;
        return;
    }
}

async function loadMeetingForEdit(event) {
    const meetingId = event.target.dataset.id;

    const { data: meeting, error } = await myClient
        .from("meetings")
        .select("*")
        .eq("id", meetingId)
        .single();

    if (error) {
        console.error(error);
        showToast(error.message, "error");
        return;
    }

    editingMeetingId = meeting.id;

    document.getElementById("meetingName").value = meeting.meeting_name;
    document.getElementById("meetingStart").value = meeting.start_time;
    document.getElementById("meetingCutoff").value = meeting.cutoff_time;
    document.getElementById("createMeetingBtn").textContent = "Update Meeting";
    document.getElementById("meetingFormTitle").textContent = "Update Meeting";
}

async function createMeeting() {
    const meetingName = document.getElementById("meetingName").value.trim();
    const startTime = document.getElementById("meetingStart").value;
    const cutoffTime = document.getElementById("meetingCutoff").value;

    if (!meetingName || !startTime || !cutoffTime) {
        showToast("Please complete all fields.", "error"); 
        return;
    }

    if (cutoffTime <= startTime) {
        showToast("Cutoff time must be later than the start time.", "error"); 
        return;
    }

    // ---> START OF NEW DUPLICATE VALIDATION <---
    
    // Ask Supabase if any meetings already have this exact name (case-insensitive)
    const { data: existingMeetings, error: checkError } = await myClient
        .from("meetings")
        .select("id")
        .ilike("meeting_name", meetingName); 

    if (checkError) {
        console.error(checkError);
        showToast("Error checking database for duplicates.", "error");
        return;
    }

    // Check if any of the matches belong to a DIFFERENT meeting than the one we are currently editing
    const isDuplicate = existingMeetings.some(m => m.id !== editingMeetingId);

    if (isDuplicate) {
        showToast("A meeting with this name already exists!", "error");
        return; // Stops the function dead in its tracks
    }
    
    // ---> END OF NEW DUPLICATE VALIDATION <---

    let error;

    if (editingMeetingId === null) {
        ({ error } = await myClient
            .from("meetings")
            .insert([{
                meeting_name: meetingName,
                start_time: startTime,
                cutoff_time: cutoffTime,
                active: true
            }]));

        if (!error) showToast("Meeting created successfully!", "success");
    } else {
        ({ error } = await myClient
            .from("meetings")
            .update({
                meeting_name: meetingName,
                start_time: startTime,
                cutoff_time: cutoffTime
            })
            .eq("id", editingMeetingId));

        if (!error) showToast("Meeting updated successfully!", "success");
    }

    if (error) {
        console.error(error);
        showToast(error.message, "error");
        return;
    }

    const meetings = await loadMeetingsTable();
    renderMeetingsTable(meetings);
    clearMeetingForm();
}

function clearMeetingForm() {
    document.getElementById("meetingName").value = "";
    document.getElementById("meetingStart").value = "";
    document.getElementById("meetingCutoff").value = "";
    editingMeetingId = null;
    document.getElementById("createMeetingBtn").textContent = "Create Meeting";
    document.getElementById("meetingFormTitle").textContent = "Create Meeting";
}

document.getElementById("createMeetingBtn").addEventListener("click", createMeeting);
document.getElementById("clearMeetingBtn").addEventListener("click", clearMeetingForm);

async function deleteMeeting(event) {
    const meetingId = event.target.dataset.id;
    const isConfirmed = await showConfirmModal();
    
    if (!isConfirmed) return;

    const { error } = await myClient
        .from("meetings")
        .delete()
        .eq("id", meetingId);

    if (error) {
        console.error("Error deleting meeting:", error);
        showToast(error.message, "error");
        return;
    }

    const meetings = await loadMeetingsTable();
    renderMeetingsTable(meetings);
}

// --- Premium UI Helpers ---

function showConfirmModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById("confirmModal");
        const confirmBtn = document.getElementById("confirmDeleteBtn");
        const cancelBtn = document.getElementById("cancelDeleteBtn");

        modal.classList.add("show");

        const cleanup = (result) => {
            modal.classList.remove("show");
            confirmBtn.onclick = null;
            cancelBtn.onclick = null;
            resolve(result);
        };

        confirmBtn.onclick = () => cleanup(true);
        cancelBtn.onclick = () => cleanup(false);
    });
}

function showToast(message, type = 'error') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    toastMessage.textContent = message;
    toast.className = `toast show ${type}`;
    
    if (type === 'success') {
        toastIcon.innerHTML = `<svg fill="none" stroke="#10b981" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
    } else {
        toastIcon.innerHTML = `<svg fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    }

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}