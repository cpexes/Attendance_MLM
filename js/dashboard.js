(async () => {

    const session = await requireLogin();

    if (!session) return;

    const organizations = await loadOrganizations();

    const meetings = await loadMeetings();

const meetingDropdown =
    document.getElementById("schedule");

meetings.forEach(meeting => {

    meetingDropdown.innerHTML += `
        <option value="${meeting.id}">
            ${meeting.meeting_name}
        </option>
    `;

});

    const organizationDropdown =
        document.getElementById("organization");

    organizations.forEach(org => {

    organizationDropdown.innerHTML +=
        `<option value="${org.org_name}">
            ${org.org_name}
        </option>`;

    

});

    document.getElementById("name").value =
    session.user.user_metadata.full_name;

    document.getElementById("date").value =
    new Date().toISOString().split("T")[0];

    document.getElementById("email").value =
    session.user.email;

})();

// Premium Logout Interceptor
document.getElementById("logoutBtn").addEventListener("click", async () => {
    const isConfirmed = await showLogoutModal();
    if (isConfirmed) {
        await logout(); 
    }
});

// Premium Custom Logout Dialog Logic
function showLogoutModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById("logoutModal");
        const confirmBtn = document.getElementById("confirmLogoutBtn");
        const cancelBtn = document.getElementById("cancelLogoutBtn");

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


// Premium UI fix: Unfocus dropdown after selection to trigger chevron animation
document.querySelectorAll(".form-group select").forEach(select => {
    select.addEventListener("change", function() {
        this.blur(); 
    });
});

// Premium Toast Notification Controller
function showToast(message, type = 'error') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    // Set the message text
    toastMessage.textContent = message;

    // Reset classes and apply the new type (success or error)
    toast.className = `toast show ${type}`;
    
    // Inject the correct SVG icon
    if (type === 'success') {
        toastIcon.innerHTML = `<svg fill="none" stroke="#10b981" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
    } else {
        toastIcon.innerHTML = `<svg fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    }

    // Automatically hide the toast after 3.5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}
