let editingMeetingId = null;

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

function renderMeetingsTable(meetings) {

    const tbody =
        document.querySelector("#meetingsTable tbody");

    tbody.innerHTML = "";

    meetings.forEach(meeting => {

        tbody.innerHTML += `
            <tr>
                <td>${meeting.meeting_name}</td>
                <td>${formatMeetingTime(meeting.start_time)}</td>
                <td>${formatMeetingTime(meeting.cutoff_time)}</td>
                <td>
                    <input
                        type="checkbox"
                        class="meetingActive"
                        data-id="${meeting.id}"
                        ${meeting.active ? "checked" : ""}
                    >
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

    document.querySelectorAll(".meetingActive")
    .forEach(checkbox => {
        checkbox.addEventListener("change", toggleMeetingStatus);
    });

    document.querySelectorAll(".editMeeting")
    .forEach(button => {
        button.addEventListener("click", loadMeetingForEdit);
    });

    // Moved inside renderMeetingsTable so it attaches after the buttons are created
    document.querySelectorAll(".deleteMeeting")
    .forEach(button => {
        button.addEventListener("click", deleteMeeting);
    });

}

async function toggleMeetingStatus(event) {

    const checkbox = event.target;

    const meetingId = checkbox.dataset.id;

    const active = checkbox.checked;

    const { error } = await myClient
        .from("meetings")
        .update({
            active: active
        })
        .eq("id", meetingId);

    if (error) {

        console.error(error);
        showToast(error.message, "error");

        // Restore the previous state
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

    document.getElementById("meetingName").value =
        meeting.meeting_name;

    document.getElementById("meetingStart").value =
        meeting.start_time;

    document.getElementById("meetingCutoff").value =
        meeting.cutoff_time;

    document.getElementById("createMeetingBtn").textContent =
        "Update Meeting";

    document.getElementById("meetingFormTitle").textContent =
     "Update Meeting";

}

async function createMeeting() {

    const meetingName =
        document.getElementById("meetingName").value.trim();

    const startTime =
        document.getElementById("meetingStart").value;

    const cutoffTime =
        document.getElementById("meetingCutoff").value;

    if (!meetingName || !startTime || !cutoffTime) {
        showToast("Please complete all fields.", "error"); 
        return;
    }

    if (cutoffTime <= startTime) {
        showToast("Cutoff time must be later than the start time.", "error"); 
        return;

}

    let error;

if (editingMeetingId === null) {

    ({ error } = await myClient
        .from("meetings")
        .insert([
            {
                meeting_name: meetingName,
                start_time: startTime,
                cutoff_time: cutoffTime,
                active: true
            }
        ]));

    if (!error) {
        showToast("Meeting created successfully!", "success");
    }

}
else {

    ({ error } = await myClient
        .from("meetings")
        .update({
            meeting_name: meetingName,
            start_time: startTime,
            cutoff_time: cutoffTime
        })
        .eq("id", editingMeetingId));

    if (!error) {
        showToast("Meeting updated successfully!", "success");
    }

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

    document.getElementById("createMeetingBtn").textContent =
        "Create Meeting";

    document.getElementById("meetingFormTitle").textContent =
        "Create Meeting";

}

document
    .getElementById("createMeetingBtn")
    .addEventListener("click", createMeeting);

document
    .getElementById("clearMeetingBtn")
    .addEventListener("click", clearMeetingForm);

async function deleteMeeting(event) {
    const meetingId = event.target.dataset.id;

    // Premium UI Safeguard: Don't delete without asking first
    const isConfirmed = await showConfirmModal();
    
    if (!isConfirmed) {
        return;
    }

    // Tell Supabase to delete the record matching this ID
    const { error } = await myClient
        .from("meetings")
        .delete()
        .eq("id", meetingId);

    if (error) {
        console.error("Error deleting meeting:", error);
        showToast(error.message, "error");
        return;
    }

    // Refresh the table so the deleted meeting vanishes instantly
    const meetings = await loadMeetingsTable();
    renderMeetingsTable(meetings);
}

// Premium Custom Confirm Dialog logic
function showConfirmModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById("confirmModal");
        const confirmBtn = document.getElementById("confirmDeleteBtn");
        const cancelBtn = document.getElementById("cancelDeleteBtn");

        // Reveal the modal with animation
        modal.classList.add("show");

        // Cleanup function to hide modal and return the result
        const cleanup = (result) => {
            modal.classList.remove("show");
            confirmBtn.onclick = null;
            cancelBtn.onclick = null;
            resolve(result);
        };

        // Resolve true if Delete is clicked, false if Cancel is clicked
        confirmBtn.onclick = () => cleanup(true);
        cancelBtn.onclick = () => cleanup(false);
    });
}

// Premium Toast Notification Controller (Global for Admin Panel)
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