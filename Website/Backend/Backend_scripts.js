const API_BASE = "http://localhost:3000/api"; // Ensure this matches your API server


document.addEventListener('DOMContentLoaded', function() {
    const loginText = document.querySelector(".title-text .login");
    const loginForm = document.querySelector("form.login");
    const loginBtn = document.querySelector("label.login");
    const signupBtn = document.querySelector("label.signup");
    const signupLink = document.querySelector("form .signup-link a");
    
    signupBtn.onclick = (() => {
        loginForm.style.marginLeft = "-50%";
        loginText.style.marginLeft = "-50%";
    });
    
    loginBtn.onclick = (() => {
        loginForm.style.marginLeft = "0%";
        loginText.style.marginLeft = "0%";
    });
    
    signupLink.onclick = ((e) => {
        e.preventDefault();
        signupBtn.click();
        return false;
    });
});







































































































































































// ====== MEMBERS API ======

// Register a new member
function registerMember() {
    fetch(`${API_BASE}/members/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            first_name: document.getElementById("regFirstName").value,
            last_name: document.getElementById("regLastName").value,
            email: document.getElementById("regEmail").value,
            password: document.getElementById("regPassword").value,
            phone_number: document.getElementById("regPhone").value
        })
    })
    .then(res => res.json())
    .then(data => document.getElementById("regResponse").innerText = JSON.stringify(data))
    .catch(err => console.error("Error:", err));
}

// Get member profile
function getMember() {
    let memberId = document.getElementById("memberId").value;
    fetch(`${API_BASE}/members/${memberId}`)
    .then(res => res.json())
    .then(data => document.getElementById("memberResponse").innerText = JSON.stringify(data))
    .catch(err => console.error("Error:", err));
}

// Update Member Profile
// Update Member Profile
function updateMemberProfile() {
    let memberId = document.getElementById("updateMemberId").value;

    if (!memberId) {
        alert("Please search for a member first.");
        return;
    }

    let updatedData = {
        first_name: document.getElementById("updateFirstName").value || null,
        last_name: document.getElementById("updateLastName").value || null,
        email: document.getElementById("updateEmail").value || null,
        phone_number: document.getElementById("updatePhone").value || null,
        password: document.getElementById("updatePassword").value || null
    };

    fetch(`${API_BASE}/members/${memberId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
    })
    .then(res => res.json())
    .then(data => document.getElementById("updateResponse").innerText = JSON.stringify(data))
    .catch(err => console.error("Error:", err));
}


function searchMember() {
    let value = document.getElementById("searchValue").value.trim(); // Trim spaces

    if (!value) {
        alert("Please enter a value to search for.");
        return;
    }

    let apiURL = `${API_BASE}/members/${encodeURIComponent(value)}`;
    console.log(`🔍 [VERBOSE] Sending Search Request to: ${apiURL}`);

    fetch(apiURL)
        .then(res => res.json())
        .then(data => {
            console.log("🔍 [VERBOSE] API Response:", data);

            if (data.error || data.length === 0) {
                document.getElementById("searchResponse").innerText = "Member not found.";
                return;
            }

            // If multiple members are returned, let the user choose
            if (Array.isArray(data) && data.length > 1) {
                let selectHTML = `<select id="memberSelect" onchange="populateUpdateForm()">`;
                data.forEach(member => {
                    selectHTML += `<option value="${member.id}">${member.first_name} ${member.last_name} (${member.email})</option>`;
                });
                selectHTML += `</select>`;
                document.getElementById("searchResponse").innerHTML = "Multiple members found: " + selectHTML;
            } else {
                // Only one member found, populate form
                populateUpdateForm(data[0]);
            }
        })
        .catch(err => console.error("❌ [VERBOSE] Error Fetching Member:", err));
}

// Populate the form with user details
function populateUpdateForm(memberData = null) {
    let selectedId = document.getElementById("memberSelect") ? document.getElementById("memberSelect").value : null;

    if (selectedId && !memberData) {
        fetch(`${API_BASE}/members/${selectedId}`)
            .then(res => res.json())
            .then(member => {
                fillUpdateForm(member);
            })
            .catch(err => console.error("❌ [VERBOSE] Error fetching member details:", err));
    } else if (memberData) {
        fillUpdateForm(memberData);
    }
}

// Fill the update form with member details
function fillUpdateForm(member) {
    document.getElementById("updateMemberId").value = member.id;
    document.getElementById("updateFirstName").value = member.first_name || "";
    document.getElementById("updateLastName").value = member.last_name || "";
    document.getElementById("updateEmail").value = member.email || "";
    document.getElementById("updatePhone").value = member.phone_number || "";
    document.getElementById("updatePassword").value = "";  // Leave blank for security

    document.getElementById("searchResponse").innerText = "Member found! Edit details and save.";
}



// Renew membership
function renewMembership() {
    let memberId = document.getElementById("renewMemberId").value;
    fetch(`${API_BASE}/members/${memberId}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            plan: document.getElementById("newPlan").value
        })
    })
    .then(res => res.json())
    .then(data => document.getElementById("renewResponse").innerText = JSON.stringify(data))
    .catch(err => console.error("Error:", err));
}

// ====== CLASS API ======

// Add a new class
function addClass() {
    fetch(`${API_BASE}/classes/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: document.getElementById("className").value,
            description: document.getElementById("classDescription").value,
            capacity: document.getElementById("classCapacity").value,
            duration_minutes: document.getElementById("classDuration").value
        })
    })
    .then(res => res.json())
    .then(data => document.getElementById("classResponse").innerText = JSON.stringify(data))
    .catch(err => console.error("Error:", err));
}

// Get all classes
function getClasses() {
    fetch(`${API_BASE}/classes`)
    .then(res => res.json())
    .then(data => document.getElementById("classesResponse").innerText = JSON.stringify(data))
    .catch(err => console.error("Error:", err));
}

// Schedule a class
function scheduleClass() {
    fetch(`${API_BASE}/class-schedule/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            class_id: document.getElementById("scheduleClassId").value,
            trainer_id: document.getElementById("scheduleTrainerId").value,
            start_time: document.getElementById("scheduleStart").value,
            end_time: document.getElementById("scheduleEnd").value,
            room_number: document.getElementById("scheduleRoom").value
        })
    })
    .then(res => res.json())
    .then(data => document.getElementById("scheduleResponse").innerText = JSON.stringify(data))
    .catch(err => console.error("Error:", err));
}

// ====== TRAINERS API ======

// Assign a trainer
function assignTrainer() {
    fetch(`${API_BASE}/trainers/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            class_id: document.getElementById("assignTrainerClassId").value,
            trainer_id: document.getElementById("assignTrainerId").value
        })
    })
    .then(res => res.json())
    .then(data => document.getElementById("trainerResponse").innerText = JSON.stringify(data))
    .catch(err => console.error("Error:", err));
}

// Track trainer hours
function trackHours() {
    fetch(`${API_BASE}/trainers/track-hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            trainer_id: document.getElementById("trackTrainerId").value,
            date: document.getElementById("workDate").value,
            hours_worked: document.getElementById("workHours").value,
            notes: "Tracked hours"
        })
    })
    .then(res => res.json())
    .then(data => document.getElementById("trackResponse").innerText = JSON.stringify(data))
    .catch(err => console.error("Error:", err));
}

// ====== CLASS REGISTRATION API ======

// Register for a class
function registerForClass() {
    fetch(`${API_BASE}/class-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            schedule_id: document.getElementById("regScheduleId").value,
            member_id: document.getElementById("regMemberId").value
        })
    })
    .then(res => res.json())
    .then(data => document.getElementById("registrationResponse").innerText = JSON.stringify(data))
    .catch(err => console.error("Error:", err));
}

// ====== DATABASE TABLE EXPLORER ======

// Fetch table data and display it
function viewTable() {
    let tableName = document.getElementById("tableSelector").value;
    if (!tableName) {
        alert("Please select a table.");
        return;
    }

    console.log(`Fetching data from: ${API_BASE}/database/${tableName}`); // Debugging log

    fetch(`${API_BASE}/database/${tableName}`)
        .then(response => response.json())
        .then(data => {
            console.log("Fetched Data:", data); // Debugging log

            let tableHead = document.getElementById("tableHead");
            let tableBody = document.getElementById("tableBody");

            // Clear existing table data
            tableHead.innerHTML = "";
            tableBody.innerHTML = "";

            if (data.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='100%'>No data available</td></tr>";
                return;
            }

            // Create table headers
            let headers = Object.keys(data[0]);
            let headerRow = "<tr>";
            headers.forEach(header => {
                headerRow += `<th>${header}</th>`;
            });
            headerRow += "</tr>";
            tableHead.innerHTML = headerRow;

            // Populate table rows
            data.forEach(row => {
                let rowHTML = "<tr>";
                headers.forEach(header => {
                    rowHTML += `<td>${row[header]}</td>`;
                });
                rowHTML += "</tr>";
                tableBody.innerHTML += rowHTML;
            });
        })
        .catch(error => {
            console.error("Error fetching table data:", error);
            alert("Failed to fetch table data. Check API connection.");
        });
}



function loginMember() {
    let email = document.getElementById("loginEmail").value.trim();
    let password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    let apiURL = `${API_BASE}/members/login`;
    console.log(`🔍 [VERBOSE] Sending Login Request to: ${apiURL}`);

    fetch(apiURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        console.log("🔍 [VERBOSE] Login Response:", data);

        if (data.error) {
            document.getElementById("loginResponse").innerText = "❌ " + data.error;
        } else {
            document.getElementById("loginResponse").innerText = `✅ Welcome, ${data.name}!`;
        }
    })
    .catch(err => console.error("❌ [VERBOSE] Error Logging In:", err));
}
