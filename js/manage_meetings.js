let editingMeetingId = null;

async function loadMeetingsTable() {

    const { data, error } = await myClient
        .from("meetings")
        .select("*")
        .order("start_time");

    if (error) {
        console.error(error);
        alert(error.message);
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
                    <button class="btn-text editMeeting" data-id="${meeting.id}">
                        Edit
                    </button>
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
        alert(error.message);

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
        alert(error.message);
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

        alert("Please complete all fields.");
        return;

    }

    if (cutoffTime <= startTime) {

    alert("Cutoff time must be later than the start time.");
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
        alert("Meeting created successfully!");
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
        alert("Meeting updated successfully!");
    }

}

if (error) {
    console.error(error);
    alert(error.message);
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