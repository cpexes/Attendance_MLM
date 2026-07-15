document.getElementById("submitAttendance").addEventListener("click", submitAttendance);

async function submitAttendance() {

    const now = new Date();
    
    // Get the current logged-in user
    const session = await requireLogin();

    if (!session) return;

    const form = validateAttendanceForm();

    if (!form) return;

    const { organization, meetingId } = form;

    const { data: meeting, error: meetingError } = await myClient
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .single();

    if (meetingError) {
    console.error(meetingError);
    alert("Unable to load meeting.");
    return;
}

    const today = now.toISOString().split("T")[0];

const existingRecord =
    await hasAlreadySubmitted(
        session.user.id,
        today,
        meetingId
    );

if (existingRecord) {
    showToast("You have already submitted your attendance for this schedule.", "error");
    return;
}

const remarks = getRemarks(meeting);

const success = await saveAttendance({
    user_id: session.user.id,
    meeting_id: meetingId,
    Name: session.user.user_metadata.full_name,
    Organization: organization,
    Date: today,
    Time_In: now.toISOString(),
    Remarks: remarks
});

if (success) {
    showToast("Attendance submitted successfully!");
}


}


async function hasAlreadySubmitted(userId, date, meetingId) {

    const { data, error } = await myClient
        .from("attendance_records")
        .select("user_id")
        .eq("user_id", userId)
        .eq("Date", date)
        .eq("meeting_id", meetingId)
        .maybeSingle();

    if (error) {
        console.error(error);
        alert("Unable to verify attendance.");
        return null;
    }

    return data;

}


function getRemarks(meeting) {

    const now = new Date();

    const today = now.toISOString().split("T")[0];

    const cutoff =
    new Date(`${today}T${meeting.cutoff_time}`);

    return now <= cutoff
        ? "Present"
        : "Late";

}

async function saveAttendance(record) {

    const { error } = await myClient
        .from("attendance_records")
        .insert([record]);

    if (error) {
        console.error(error);
        alert(error.message);
        return false;
    }

    return true;

}


function validateAttendanceForm() {
    const organization =
        document.getElementById("organization").value;

    const meetingId =
    document.getElementById("schedule").value;

    if (!organization || !meetingId) {
        // Replaced native alert with our premium UI toast
        showToast("Please complete the form.", "error"); 
        return null;
    }

    return {
        organization,
        meetingId
    };
}