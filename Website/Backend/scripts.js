const API_BASE = "http://localhost:3000/api";

// Register a new member
function registerMember() {
    fetch(`${API_BASE}/members/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: document.getElementById("regName").value,
            email: document.getElementById("regEmail").value,
            password: document.getElementById("regPassword").value
        })
    })
    .then(res => res.json())
    .then(data => document.getElementById("regResponse").innerText = JSON.stringify(data));
}

// Get member profile
function getMember() {
    let memberId = document.getElementById("memberId").value;
    fetch(`${API_BASE}/members/${memberId}`)
    .then(res => res.json())
    .then(data => document.getElementById("memberResponse").innerText = JSON.stringify(data));
}

// Add a new class
function addClass() {
    fetch(`${API_BASE}/classes/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: document.getElementById("className").value,
            schedule: document.getElementById("classSchedule").value,
            trainer_id: document.getElementById("trainerId").value
        })
    })
    .then(res => res.json())
    .then(data => document.getElementById("classResponse").innerText = JSON.stringify(data));
}

// Get all classes
function getClasses() {
    fetch(`${API_BASE}/classes`)
    .then(res => res.json())
    .then(data => document.getElementById("classesResponse").innerText = JSON.stringify(data));
}

// Assign a trainer
function assignTrainer() {
    fetch(`${API_BASE}/trainers/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            class_id: document.getElementById("assignClassId").value,
            trainer_id: document.getElementById("assignTrainerId").value
        })
    })
    .then(res => res.json())
    .then(data => document.getElementById("assignResponse").innerText = JSON.stringify(data));
}

// Track trainer hours
function trackHours() {
    fetch(`${API_BASE}/trainers/track-hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            trainer_id: document.getElementById("trackTrainerId").value,
            hours: document.getElementById("workHours").value
        })
    })
    .then(res => res.json())
    .then(data => document.getElementById("trackResponse").innerText = JSON.stringify(data));
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
    .then(data => document.getElementById("renewResponse").innerText = JSON.stringify(data));
}
