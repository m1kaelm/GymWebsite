document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const sectionButtons = document.querySelectorAll(".btn-update");
  const allSections = document.querySelectorAll(".admin-section");
  const dashboardGrid = document.querySelector(".dashboard-grid");
  const tabNav = document.querySelector(".admin-tabs");
  const tabs = document.querySelectorAll(".admin-tab");
  const searchBtn = document.getElementById("search-button");
  const loadTableBtn = document.getElementById("load-table-btn");
  const tableSelect = document.getElementById("table-select");
  const tableOutput = document.getElementById("table-output");
  let allMembers = [];

  // Event Listeners
  sectionButtons.forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      const targetId = btn.getAttribute("data-target");
      showSection(targetId);
    });
  });

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetId = tab.getAttribute("data-target");
      showSection(targetId);
    });
  });

  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearch);
  }

  if (loadTableBtn) {
    loadTableBtn.addEventListener("click", handleTableLoad);
  }

  

  // Member Management Functions
  function handleSearch() {
    const type = document.getElementById("search-type").value;
    const query = document.getElementById("search-input").value.trim();

    if (!query) return renderMemberTable(allMembers);

    let apiColumn = type;
    if (type === "phone") apiColumn = "phone_number";

    fetch(`http://localhost:3000/api/members/search?column=${encodeURIComponent(apiColumn)}&value=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          renderMemberTable(data);
        } else {
          renderMemberTable([]);
          alert("No members found.");
        }
      })
      .catch(err => {
        console.error("Search failed:", err);
      });
    if (id === "manage-staff") {
      loadStaff();
    }
  }

  

  // Navigation Functions
  function showSection(id) {
    allSections.forEach(s => s.style.display = "none");
    const activeSection = document.getElementById(id);
    if (activeSection) activeSection.style.display = "block";

    if (dashboardGrid) dashboardGrid.style.display = "none";
    if (tabNav) tabNav.style.display = "flex";

    tabs.forEach(tab => {
      tab.classList.toggle("active", tab.getAttribute("data-target") === id);
    });

    if (id === "manage-members") {
      loadMembers();
    }
    // Load trainers and classes if needed
    if (id === "manage-trainers") loadTrainers();
    if (id === "manage-classes") loadClasses();
  }

  // Database Table Functions
  function handleTableLoad() {
    const tableName = tableSelect.value;
    if (!tableName) return;

    fetch(`http://localhost:3000/api/database/${tableName}`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          tableOutput.innerHTML = "<p>Error loading table.</p>";
          return;
        }

        if (data.length === 0) {
          tableOutput.innerHTML = "<p>No records found.</p>";
          return;
        }

        const headers = Object.keys(data[0]);
        const table = document.createElement("table");
        table.classList.add("db-table");

        const thead = table.createTHead();
        const headRow = thead.insertRow();
        headers.forEach(header => {
          const th = document.createElement("th");
          th.textContent = header;
          headRow.appendChild(th);
        });

        const tbody = table.createTBody();
        data.forEach(row => {
          const tr = tbody.insertRow();
          headers.forEach(header => {
            const td = tr.insertCell();
            td.textContent = row[header];
          });
        });

        tableOutput.innerHTML = "";
        tableOutput.appendChild(table);
      })
      .catch(err => {
        console.error("Table load error:", err);
        tableOutput.innerHTML = "<p>Failed to load data.</p>";
      });
  }
});

function renderMemberTable(members) {
  const tbody = document.querySelector("#members-table tbody");
  tbody.innerHTML = "";

  members.forEach(member => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${member.id}</td>
      <td>${member.first_name} ${member.last_name}</td>
      <td>${member.email}</td>
      <td>${member.phone_number}</td>
      <td>
        <button onclick="editMember(${member.id})">Edit</button>
        <button onclick="deleteMember(${member.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function loadMembers() {
  fetch("http://localhost:3000/api/members")
    .then(res => res.json())
    .then(members => {
      allMembers = members;
      renderMemberTable(members);
    })
    .catch(err => {
      console.error("Error loading members:", err);
    });
}

// Member Actions
function editMember(id) {
  alert(`Open edit modal for member #${id}`);
}

function deleteMember(id) {
  if (confirm("Are you sure you want to delete this member?")) {
    fetch(`http://localhost:3000/api/members/${id}`, {
      method: "DELETE"
    })
      .then(res => {
        if (res.ok) {
          document.querySelector("#search-button").click();
        } else {
          alert("Failed to delete member.");
        }
      });
  }
}

function loadStaff() {
  const output = document.getElementById("staff-output");
  output.innerHTML = "<p>Loading staff...</p>";

  fetch("http://localhost:3000/api/database/staff")
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data) || !data.length) {
        output.innerHTML = "<p>No staff records found.</p>";
        return;
      }

      const headers = Object.keys(data[0]);
      const table = document.createElement("table");
      table.classList.add("db-table");

      const thead = table.createTHead();
      const headRow = thead.insertRow();
      headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        headRow.appendChild(th);
      });

      const tbody = table.createTBody();
      data.forEach(row => {
        const tr = tbody.insertRow();
        headers.forEach(header => {
          const td = tr.insertCell();
          td.textContent = row[header];
        });
      });

      output.innerHTML = "";
      output.appendChild(table);
    })
    .catch(err => {
      console.error("Error loading staff:", err);
      output.innerHTML = "<p>Failed to load staff data.</p>";
    });
}

function loadTrainers() {
  fetch("http://localhost:3000/api/trainers")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("trainers-output");
      container.innerHTML = `
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>Specialisation</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${data.map(trainer => `
              <tr>
                <td>${trainer.id}</td>
                <td>${trainer.first_name} ${trainer.last_name}</td>
                <td>${trainer.email}</td>
                <td>${trainer.specialisation || "N/A"}</td>
                <td>
                  <button onclick="trackHours(${trainer.id})">Log Hours</button>
                </td>
              </tr>`).join("")}
          </tbody>
        </table>
      `;
    });
}

function trackHours(trainerId) {
  const hours = prompt("Enter hours worked:");
  if (!hours || isNaN(hours)) return;

  fetch("http://localhost:3000/api/trainers/track-hours", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trainer_id: trainerId,
      date: new Date().toISOString().split("T")[0],
      hours_worked: Number(hours),
      notes: "Logged via admin"
    })
  })
    .then(res => res.json())
    .then(msg => alert(msg.message || "Hours logged."));
}

function loadClasses() {
  fetch("http://localhost:3000/api/classes")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("classes-output");
      container.innerHTML = `
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Capacity</th><th>Duration</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${data.map(cls => `
              <tr>
                <td>${cls.id}</td>
                <td>${cls.name}</td>
                <td>${cls.capacity}</td>
                <td>${cls.duration_minutes} mins</td>
                <td>${cls.trainer_name || 'Unassigned'}</td>
                <td>
                  <button onclick="openScheduleForm(${cls.id})">Schedule</button>
                </td>
              </tr>`).join("")}
          </tbody>
        </table>
      `;
    });
}

function openScheduleForm(classId) {
  const trainerId = prompt("Enter Trainer ID:");
  const start = prompt("Start Time (YYYY-MM-DD HH:MM):");
  const end = prompt("End Time (YYYY-MM-DD HH:MM):");
  const room = prompt("Room Number:");

  if (!trainerId || !start || !end || !room) return;

  fetch("http://localhost:3000/api/class-schedule/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      class_id: classId,
      trainer_id: trainerId,
      start_time: start,
      end_time: end,
      room_number: room
    })
  })
    .then(res => res.json())
    .then(msg => alert(msg.message || "Class scheduled."));
}

function deleteMember(id) {
  if (confirm("Are you sure you want to delete this member?")) {
    fetch(`http://localhost:3000/api/members/${id}`, {
      method: "DELETE"
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || "Member deleted.");
        loadMembers();  // Reload the member list
      })
      .catch(err => {
        console.error("Failed to delete member:", err);
        alert("Failed to delete member.");
      });
  }
}

// Adding New Member
document.getElementById("add-member-btn").addEventListener("click", () => {
  const firstName = document.getElementById("new-member-firstname").value;
  const lastName = document.getElementById("new-member-lastname").value;
  const email = document.getElementById("new-member-email").value;
  const phone = document.getElementById("new-member-phone").value;
  const password = document.getElementById("new-member-password").value;

  fetch("http://localhost:3000/api/members/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone_number: phone,
      password: password
    })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "Member added successfully");
      
      // Load members inside here after adding
      fetch("http://localhost:3000/api/members")
        .then(res => res.json())
        .then(members => {
          allMembers = members;
          renderMemberTable(members);
        })
        .catch(err => {
          console.error("Error loading members:", err);
        });
    })
    .catch(err => {
      console.error("Failed to add member:", err);
      alert("Failed to add member.");
    });
});


// Handle adding new class
document.getElementById("add-class-btn").addEventListener("click", () => {
  const name = document.getElementById("new-class-name").value;
  const description = document.getElementById("new-class-description").value;
  const capacity = document.getElementById("new-class-capacity").value;
  const duration = document.getElementById("new-class-duration").value;

  fetch("http://localhost:3000/api/classes/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name,
      description: description,
      capacity: capacity,
      duration_minutes: duration
    })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message || "Class added successfully");
    loadClasses();  // Reload the classes list
  })
  .catch(err => {
    console.error("Failed to add class:", err);
    alert("Failed to add class.");
  });
});


function deleteClass(id) {
  if (confirm("Are you sure you want to delete this class?")) {
    fetch(`http://localhost:3000/api/classes/${id}`, {
      method: "DELETE"
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || "Class deleted.");
        loadClasses();  // Reload the class list
      })
      .catch(err => {
        console.error("Failed to delete class:", err);
        alert("Failed to delete class.");
      });
  }
}

// Load all classes
function loadClasses() {
  fetch("http://localhost:3000/api/classes")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("classes-output");
      container.innerHTML = `
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Capacity</th><th>Duration</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${data.map(cls => `
              <tr>
                <td>${cls.id}</td>
                <td>${cls.name}</td>
                <td>${cls.capacity}</td>
                <td>${cls.duration_minutes} mins</td>
                <td>
                  <button onclick="openScheduleForm(${cls.id})">Schedule</button>
                  <button onclick="deleteClass(${cls.id})">Delete</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    });
}


// Delete class
function deleteClass(id) {
  if (confirm("Are you sure you want to delete this class?")) {
    fetch(`http://localhost:3000/api/classes/${id}`, {
      method: "DELETE"
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || "Class deleted.");
        loadClasses();  // Reload the classes list
      })
      .catch(err => {
        console.error("Failed to delete class:", err);
        alert("Failed to delete class.");
      });
  }
}


// Open the schedule form
function openScheduleForm(classId) {
  const form = document.getElementById("schedule-class-form");
  form.style.display = "block"; // Show the form

  document.getElementById("schedule-class-btn").onclick = function() {
    const trainerId = document.getElementById("trainer-id").value;
    const startTime = document.getElementById("start-time").value;
    const endTime = document.getElementById("end-time").value;
    const roomNumber = document.getElementById("room-number").value;

    fetch("http://localhost:3000/api/class-schedule/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        class_id: classId,
        trainer_id: trainerId,
        start_time: startTime,
        end_time: endTime,
        room_number: roomNumber
      })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || "Class scheduled.");
        form.style.display = "none";  // Hide the form
        loadClasses();  // Reload the classes list
      })
      .catch(err => {
        console.error("Failed to schedule class:", err);
        alert("Failed to schedule class.");
      });
  };
}
