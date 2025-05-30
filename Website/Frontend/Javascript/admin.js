let apiBaseUrl = null;

// Fetch the config when the page loads
fetch('/api/config')
  .then(res => res.json())
  .then(config => {
    apiBaseUrl = config.apiBaseUrl;
  })
  .catch(err => {
    console.error('Failed to load API config:', err);
  });

// Helper to wait for apiBaseUrl to be loaded
function waitForApiBaseUrl() {
  return new Promise((resolve, reject) => {
    if (apiBaseUrl) return resolve(apiBaseUrl);
    const interval = setInterval(() => {
      if (apiBaseUrl) {
        clearInterval(interval);
        resolve(apiBaseUrl);
      }
    }, 50);
    setTimeout(() => {
      clearInterval(interval);
      reject('API base URL not loaded in time');
    }, 3000);
  });
}

// Member Management Functions
function loadMembers() {
  waitForApiBaseUrl().then(apiBaseUrl => {
    fetch(`${apiBaseUrl}/api/members`)
      .then(res => res.json())
      .then(members => {
        allMembers = members;
        renderMemberTable(members);
      })
      .catch(err => {
        console.error("Error loading members:", err);
      });
  });
}

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
      <td>${member.status || 'active'}</td>
      <td>
        <button onclick="editMember(${member.id})">Edit</button>
        <button onclick="deleteMember(${member.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Staff Management Functions
function loadStaff() {
  waitForApiBaseUrl().then(apiBaseUrl => {
    fetch(`${apiBaseUrl}/api/database/staff`)
      .then(res => res.json())
      .then(data => {
        const tbody = document.querySelector("#staff-table tbody");
        tbody.innerHTML = "";
        if (!Array.isArray(data) || !data.length) {
          tbody.innerHTML = "<tr><td colspan='7'>No staff records found.</td></tr>";
          return;
        }
        data.forEach(staff => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${staff.id}</td>
            <td>${staff.first_name} ${staff.last_name}</td>
            <td>${staff.email}</td>
            <td>${staff.phone_number || ""}</td>
            <td>${staff.position || ""}</td>
            <td>${staff.status || 'active'}</td>
            <td>
              <button onclick="editStaff(${staff.id})">Edit</button>
              <button onclick="deleteStaff(${staff.id})">Delete</button>
            </td>
          `;
          tbody.appendChild(row);
        });
      })
      .catch(err => {
        const tbody = document.querySelector("#staff-table tbody");
        tbody.innerHTML = "<tr><td colspan='7'>Failed to load staff data.</td></tr>";
        console.error("Error loading staff:", err);
      });
  });
}

// Membership Management Functions
function loadMemberships() {
  waitForApiBaseUrl().then(apiBaseUrl => {
    fetch(`${apiBaseUrl}/api/membership_plans`)
      .then(res => res.json())
      .then(data => {
        const tbody = document.querySelector("#memberships-table tbody");
        tbody.innerHTML = "";
        if (!Array.isArray(data) || !data.length) {
          tbody.innerHTML = "<tr><td colspan='7'>No plans found.</td></tr>";
          return;
        }
        data.forEach(plan => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${plan.id}</td>
            <td>${plan.name}</td>
            <td>${plan.description}</td>
            <td>${plan.duration_months}</td>
            <td>${plan.price}</td>
            <td>${plan.status}</td>
            <td>
              <button onclick="editPlan(${plan.id})">Edit</button>
              <button onclick="deletePlan(${plan.id})">Delete</button>
            </td>
          `;
          tbody.appendChild(row);
        });
      })
      .catch(err => {
        console.error("Error loading memberships:", err);
      });
  });
}

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
    if (id === "manage-staff") loadStaff();
    if (id === "manage-trainers") loadTrainers();
    if (id === "manage-classes") loadClasses();
    if (id === "manage-memberships") loadMemberships();
  }

  // Database Table Functions
  function handleTableLoad() {
    const tableName = tableSelect.value;
    if (!tableName) return;

    waitForApiBaseUrl().then(apiBaseUrl => {
      fetch(`${apiBaseUrl}/api/database/${tableName}`)
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
    });
  }

  // Member Management Functions
  function handleSearch() {
    const type = document.getElementById("search-type").value;
    const query = document.getElementById("search-input").value.trim();

    if (!query) return renderMemberTable(allMembers);

    let apiColumn = type;
    if (type === "phone") apiColumn = "phone_number";

    waitForApiBaseUrl().then(apiBaseUrl => {
      fetch(`${apiBaseUrl}/api/members/search?column=${encodeURIComponent(apiColumn)}&value=${encodeURIComponent(query)}`)
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
    });
  }

  // Trainer Management Functions
  function loadTrainers() {
    waitForApiBaseUrl().then(apiBaseUrl => {
      fetch(`${apiBaseUrl}/api/database/trainers`)
        .then(res => res.json())
        .then(data => {
          const tbody = document.querySelector("#trainers-table tbody");
          tbody.innerHTML = "";
          if (!Array.isArray(data) || !data.length) {
            tbody.innerHTML = "<tr><td colspan='7'>No trainers found.</td></tr>";
            return;
          }
          data.forEach(trainer => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${trainer.id}</td>
              <td>${trainer.first_name} ${trainer.last_name}</td>
              <td>${trainer.email}</td>
              <td>${trainer.phone_number || ""}</td>
              <td>${trainer.specialisation || ""}</td>
              <td>${trainer.status || 'active'}</td>
              <td>
                <button onclick="editTrainer(${trainer.id})">Edit</button>
                <button onclick="deleteTrainer(${trainer.id})">Delete</button>
              </td>
            `;
            tbody.appendChild(row);
          });
        })
        .catch(err => {
          const tbody = document.querySelector("#trainers-table tbody");
          tbody.innerHTML = "<tr><td colspan='7'>Failed to load trainers.</td></tr>";
          console.error("Error loading trainers:", err);
        });
    });
  }

  // Class Management Functions
  function loadClasses() {
    loadClassTypes();
    loadScheduleTable();
    populateClassTypeDropdown();
    populateTrainerDropdown();
  }

  function loadClassTypes() {
    waitForApiBaseUrl().then(apiBaseUrl => {
      fetch(`${apiBaseUrl}/api/class-types`)
        .then(res => res.json())
        .then(data => {
          const tbody = document.querySelector("#class-types-table tbody");
          tbody.innerHTML = "";
          if (!Array.isArray(data) || !data.length) {
            tbody.innerHTML = "<tr><td colspan='4'>No class types found.</td></tr>";
            return;
          }
          data.forEach(cls => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${cls.id}</td>
              <td>${cls.name}</td>
              <td>${cls.description || ""}</td>
              <td>
                <button onclick="editClassType(${cls.id})">Edit</button>
                <button onclick="deleteClassType(${cls.id})">Delete</button>
              </td>
            `;
            tbody.appendChild(row);
          });
        })
        .catch(err => {
          console.error("Error loading class types:", err);
          const tbody = document.querySelector("#class-types-table tbody");
          tbody.innerHTML = "<tr><td colspan='4'>Failed to load class types.</td></tr>";
        });
    });
  }

  function loadScheduleTable() {
    waitForApiBaseUrl().then(apiBaseUrl => {
      fetch(`${apiBaseUrl}/api/class-schedule`)
        .then(res => res.json())
        .then(schedules => {
          const tbody = document.querySelector('#schedule-table tbody');
          tbody.innerHTML = '';
          if (!Array.isArray(schedules) || !schedules.length) {
            tbody.innerHTML = "<tr><td colspan='7'>No scheduled classes found.</td></tr>";
            return;
          }
          schedules.forEach(sch => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${sch.schedule_id}</td>
              <td>${sch.class_name || ''}</td>
              <td>${sch.trainer_name || ''}</td>
              <td>${sch.room_number || ''}</td>
              <td>${sch.start_time ? new Date(sch.start_time).toLocaleString() : ''}</td>
              <td>${sch.end_time ? new Date(sch.end_time).toLocaleString() : ''}</td>
              <td>
                <button onclick="editSchedule(${sch.schedule_id})">Edit</button>
                <button onclick="deleteSchedule(${sch.schedule_id})">Delete</button>
              </td>
            `;
            tbody.appendChild(tr);
          });
        })
        .catch(err => {
          console.error('Error loading schedule:', err);
          const tbody = document.querySelector('#schedule-table tbody');
          tbody.innerHTML = "<tr><td colspan='7'>Failed to load schedule.</td></tr>";
        });
    });
  }

  function populateClassTypeDropdown(targetId = 'class-type-select') {
    waitForApiBaseUrl().then(apiBaseUrl => {
      fetch(`${apiBaseUrl}/api/class-types`)
        .then(res => res.json())
        .then(types => {
          const select = document.getElementById(targetId);
          select.innerHTML = '';
          types.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name;
            select.appendChild(option);
          });
        });
    });
  }

  function populateTrainerDropdown(targetId = 'trainer-select') {
    waitForApiBaseUrl().then(apiBaseUrl => {
      fetch(`${apiBaseUrl}/api/trainers`)
        .then(res => res.json())
        .then(trainers => {
          const select = document.getElementById(targetId);
          select.innerHTML = '';
          trainers.forEach(trainer => {
            const option = document.createElement('option');
            option.value = trainer.id;
            option.textContent = trainer.first_name + ' ' + trainer.last_name;
            select.appendChild(option);
          });
        });
    });
  }
});

// Member Actions
function editMember(id) {
  waitForApiBaseUrl().then(apiBaseUrl => {
    fetch(`${apiBaseUrl}/api/members/${id}`)
      .then(res => res.json())
      .then(member => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content">
            <h2>Edit Member</h2>
            <form id="edit-member-form">
              <input type="text" id="edit-firstname" value="${member.first_name}" required>
              <input type="text" id="edit-lastname" value="${member.last_name}" required>
              <input type="email" id="edit-email" value="${member.email}" required>
              <input type="tel" id="edit-phone" value="${member.phone_number || ''}">
              <button type="submit">Save Changes</button>
              <button type="button" onclick="this.closest('.modal').remove()">Cancel</button>
            </form>
          </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('edit-member-form').addEventListener('submit', function(e) {
          e.preventDefault();
          const updatedMember = {
            first_name: document.getElementById('edit-firstname').value,
            last_name: document.getElementById('edit-lastname').value,
            email: document.getElementById('edit-email').value,
            phone_number: document.getElementById('edit-phone').value
          };

          fetch(`${apiBaseUrl}/api/members/${id}/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedMember)
          })
            .then(res => res.json())
            .then(data => {
              alert(data.message || 'Member updated successfully!');
              modal.remove();
              loadMembers();
            })
            .catch(err => {
              console.error('Failed to update member:', err);
              alert('Failed to update member.');
            });
        });
      });
  });
}

function deleteMember(id) {
  if (confirm("Are you sure you want to delete this member?")) {
    waitForApiBaseUrl().then(apiBaseUrl => {
      fetch(`${apiBaseUrl}/api/members/${id}`, {
        method: "DELETE"
      })
        .then(res => res.json())
        .then(data => {
          alert(data.message || "Member deleted.");
          loadMembers();
        })
        .catch(err => {
          console.error("Failed to delete member:", err);
          alert("Failed to delete member.");
        });
    });
  }
}

// Staff Actions
function editStaff(id) {
  waitForApiBaseUrl().then(apiBaseUrl => {
    fetch(`${apiBaseUrl}/api/database/staff?id=${id}`)
      .then(res => res.json())
      .then(staff => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content">
            <h2>Edit Staff</h2>
            <form id="edit-staff-form">
              <input type="text" id="edit-firstname" value="${staff.first_name}" required>
              <input type="text" id="edit-lastname" value="${staff.last_name}" required>
              <input type="email" id="edit-email" value="${staff.email}" required>
              <input type="tel" id="edit-phone" value="${staff.phone_number || ''}">
              <input type="text" id="edit-position" value="${staff.position || ''}">
              <button type="submit">Save Changes</button>
              <button type="button" onclick="this.closest('.modal').remove()">Cancel</button>
            </form>
          </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('edit-staff-form').addEventListener('submit', function(e) {
          e.preventDefault();
          const updatedStaff = {
            first_name: document.getElementById('edit-firstname').value,
            last_name: document.getElementById('edit-lastname').value,
            email: document.getElementById('edit-email').value,
            phone_number: document.getElementById('edit-phone').value,
            position: document.getElementById('edit-position').value
          };

          fetch(`${apiBaseUrl}/api/staff/${id}/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedStaff)
          })
            .then(res => res.json())
            .then(data => {
              alert(data.message || 'Staff updated successfully!');
              modal.remove();
              loadStaff();
            })
            .catch(err => {
              console.error('Failed to update staff:', err);
              alert('Failed to update staff.');
            });
        });
      });
  });
}

function deleteStaff(id) {
  if (confirm("Are you sure you want to delete this staff member?")) {
    waitForApiBaseUrl().then(apiBaseUrl => {
      fetch(`${apiBaseUrl}/api/staff/${id}`, {
        method: "DELETE"
      })
        .then(res => res.json())
        .then(data => {
          alert(data.message || "Staff deleted.");
          loadStaff();
        })
        .catch(err => {
          console.error("Failed to delete staff:", err);
          alert("Failed to delete staff.");
        });
    });
  }
}

// Trainer Actions
function editTrainer(id) {
  waitForApiBaseUrl().then(apiBaseUrl => {
    fetch(`${apiBaseUrl}/api/database/trainers?id=${id}`)
      .then(res => res.json())
      .then(trainer => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content">
            <h2>Edit Trainer</h2>
            <form id="edit-trainer-form">
              <input type="text" id="edit-firstname" value="${trainer.first_name}" required>
              <input type="text" id="edit-lastname" value="${trainer.last_name}" required>
              <input type="email" id="edit-email" value="${trainer.email}" required>
              <input type="tel" id="edit-phone" value="${trainer.phone_number || ''}">
              <input type="text" id="edit-specialisation" value="${trainer.specialisation || ''}">
              <select id="edit-status">
                <option value="active" ${trainer.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="inactive" ${trainer.status === 'inactive' ? 'selected' : ''}>Inactive</option>
              </select>
              <button type="submit">Save Changes</button>
              <button type="button" onclick="this.closest('.modal').remove()">Cancel</button>
            </form>
          </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('edit-trainer-form').addEventListener('submit', function(e) {
          e.preventDefault();
          const updatedTrainer = {
            first_name: document.getElementById('edit-firstname').value,
            last_name: document.getElementById('edit-lastname').value,
            email: document.getElementById('edit-email').value,
            phone_number: document.getElementById('edit-phone').value,
            specialisation: document.getElementById('edit-specialisation').value,
            status: document.getElementById('edit-status').value
          };

          fetch(`${apiBaseUrl}/api/trainers/${id}/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedTrainer)
          })
            .then(res => res.json())
            .then(data => {
              alert(data.message || 'Trainer updated successfully!');
              modal.remove();
              loadTrainers();
            })
            .catch(err => {
              console.error('Failed to update trainer:', err);
              alert('Failed to update trainer.');
            });
        });
      });
  });
}

function deleteTrainer(id) {
  if (confirm("Are you sure you want to delete this trainer?")) {
    waitForApiBaseUrl().then(apiBaseUrl => {
      fetch(`${apiBaseUrl}/api/trainers/${id}`, {
        method: "DELETE"
      })
        .then(res => res.json().then(data => ({ status: res.status, body: data })))
        .then(({ status, body }) => {
          if (status === 200) {
            alert(body.message || "Trainer deleted.");
            loadTrainers();
          } else {
            console.error("Backend error:", body.error);
            alert("Failed to delete trainer: " + (body.error || "Unknown error"));
          }
        })
        .catch(err => {
          console.error("Network error deleting trainer:", err);
          alert("Failed to delete trainer. Network or server error.");
        });
    });
  }
}

// Membership Plan Actions
function editPlan(id) {
  waitForApiBaseUrl().then(apiBaseUrl => {
    fetch(`${apiBaseUrl}/api/membership_plans/${id}`)
      .then(res => res.json())
      .then(plan => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content">
            <h2>Edit Membership Plan</h2>
            <form id="edit-plan-form">
              <input type="text" id="edit-name" value="${plan.name}" required>
              <input type="text" id="edit-description" value="${plan.description || ''}">
              <input type="number" id="edit-duration" value="${plan.duration_months}" required>
              <input type="number" id="edit-price" value="${plan.price}" required>
              <select id="edit-status">
                <option value="active" ${plan.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="inactive" ${plan.status === 'inactive' ? 'selected' : ''}>Inactive</option>
              </select>
              <button type="submit">Save Changes</button>
              <button type="button" onclick="this.closest('.modal').remove()">Cancel</button>
            </form>
          </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('edit-plan-form').addEventListener('submit', function(e) {
          e.preventDefault();
          const updatedPlan = {
            name: document.getElementById('edit-name').value,
            description: document.getElementById('edit-description').value,
            duration_months: document.getElementById('edit-duration').value,
            price: document.getElementById('edit-price').value,
            status: document.getElementById('edit-status').value
          };

          fetch(`${apiBaseUrl}/api/membership_plans/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPlan)
          })
            .then(res => res.json())
            .then(data => {
              alert(data.message || 'Plan updated successfully!');
              modal.remove();
              loadMemberships();
            })
            .catch(err => {
              console.error('Failed to update plan:', err);
              alert('Failed to update plan.');
            });
        });
      });
  });
}

function deletePlan(id) {
  if (confirm("Are you sure you want to delete this plan?")) {
    waitForApiBaseUrl().then(apiBaseUrl => {
      fetch(`${apiBaseUrl}/api/membership_plans/${id}`, {
        method: "DELETE"
      })
        .then(res => res.json())
        .then(data => {
          alert(data.message || "Plan deleted.");
          loadMemberships();
        })
        .catch(err => {
          console.error("Failed to delete plan:", err);
          alert("Failed to delete plan.");
        });
    });
  }
}

// Add event listeners for forms
document.addEventListener('DOMContentLoaded', () => {
  // Add Member Form
  const addMemberForm = document.getElementById('add-member-form');
  if (addMemberForm) {
    addMemberForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const memberData = {
        first_name: document.getElementById('new-member-firstname').value.trim(),
        last_name: document.getElementById('new-member-lastname').value.trim(),
        email: document.getElementById('new-member-email').value.trim(),
        phone_number: document.getElementById('new-member-phone').value.trim(),
        password: document.getElementById('new-member-password').value
      };

      // Validate required fields
      if (!memberData.first_name || !memberData.last_name || !memberData.email || !memberData.password) {
        alert('Please fill in all required fields');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(memberData.email)) {
        alert('Please enter a valid email address');
        return;
      }

      // Show loading state
      const submitButton = document.getElementById('add-member-btn');
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = 'Adding...';
      submitButton.disabled = true;

      waitForApiBaseUrl().then(apiBaseUrl => {
        fetch(`${apiBaseUrl}/api/members/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memberData)
        })
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              throw new Error(data.error);
            }
            alert(data.message || 'Member added successfully!');
            addMemberForm.reset();
            loadMembers();
          })
          .catch(err => {
            console.error('Failed to add member:', err);
            alert(err.message || 'Failed to add member. Please try again.');
          })
          .finally(() => {
            // Reset button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
          });
      });
    });
  }

  // Add Staff Form
  const addStaffForm = document.getElementById('add-staff-form');
  if (addStaffForm) {
    addStaffForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const staffData = {
        first_name: document.getElementById('new-staff-firstname').value.trim(),
        last_name: document.getElementById('new-staff-lastname').value.trim(),
        email: document.getElementById('new-staff-email').value.trim(),
        phone_number: document.getElementById('new-staff-phone').value.trim(),
        position: document.getElementById('new-staff-position').value.trim(),
        password: document.getElementById('new-staff-password').value
      };

      // Validate required fields
      if (!staffData.first_name || !staffData.last_name || !staffData.email || !staffData.password) {
        alert('Please fill in all required fields');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(staffData.email)) {
        alert('Please enter a valid email address');
        return;
      }

      // Show loading state
      const submitButton = document.getElementById('add-staff-btn');
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = 'Adding...';
      submitButton.disabled = true;

      waitForApiBaseUrl().then(apiBaseUrl => {
        fetch(`${apiBaseUrl}/api/staff/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(staffData)
        })
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              throw new Error(data.error);
            }
            alert(data.message || 'Staff added successfully!');
            addStaffForm.reset();
            loadStaff();
          })
          .catch(err => {
            console.error('Failed to add staff:', err);
            alert(err.message || 'Failed to add staff. Please try again.');
          })
          .finally(() => {
            // Reset button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
          });
      });
    });
  }

  // Add Membership Plan Form
  const addPlanForm = document.getElementById('add-membership-form');
  if (addPlanForm) {
    addPlanForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const planData = {
        name: document.getElementById('new-plan-name').value.trim(),
        description: document.getElementById('new-plan-description').value.trim(),
        duration_months: parseInt(document.getElementById('new-plan-duration').value),
        price: parseFloat(document.getElementById('new-plan-price').value),
        status: 'active'
      };

      // Validate required fields
      if (!planData.name || !planData.description || !planData.duration_months || !planData.price) {
        alert('Please fill in all required fields');
        return;
      }

      // Validate numeric fields
      if (isNaN(planData.duration_months) || planData.duration_months <= 0) {
        alert('Please enter a valid duration (positive number)');
        return;
      }

      if (isNaN(planData.price) || planData.price <= 0) {
        alert('Please enter a valid price (positive number)');
        return;
      }

      // Show loading state
      const submitButton = document.getElementById('add-plan-btn');
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = 'Adding...';
      submitButton.disabled = true;

      waitForApiBaseUrl().then(apiBaseUrl => {
        fetch(`${apiBaseUrl}/api/membership_plans`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(planData)
        })
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              throw new Error(data.error);
            }
            alert(data.message || 'Plan added successfully!');
            addPlanForm.reset();
            loadMemberships();
          })
          .catch(err => {
            console.error('Failed to add plan:', err);
            alert(err.message || 'Failed to add plan. Please try again.');
          })
          .finally(() => {
            // Reset button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
          });
      });
    });
  }

  // Add Class Type Form
  const addClassTypeForm = document.getElementById('add-class-type-form');
  if (addClassTypeForm) {
    addClassTypeForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const classData = {
        name: document.getElementById('new-class-name').value.trim(),
        description: document.getElementById('new-class-description').value.trim()
      };

      waitForApiBaseUrl().then(apiBaseUrl => {
        fetch(`${apiBaseUrl}/api/class-types/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(classData)
        })
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              throw new Error(data.error);
            }
            alert(data.message || 'Class type added successfully!');
            addClassTypeForm.reset();
            loadClassTypes();
            populateClassTypeDropdown();
          })
          .catch(err => {
            console.error('Failed to add class type:', err);
            alert(err.message || 'Failed to add class type. Please try again.');
          });
      });
    });
  }

  // Add Schedule Form
  const addScheduleForm = document.getElementById('add-schedule-form');
  if (addScheduleForm) {
    addScheduleForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const scheduleData = {
        class_type_id: document.getElementById('class-type-select').value,
        trainer_id: document.getElementById('trainer-select').value,
        start_time: document.getElementById('start-time').value,
        end_time: document.getElementById('end-time').value,
        room_number: document.getElementById('room-number').value.trim()
      };

      waitForApiBaseUrl().then(apiBaseUrl => {
        fetch(`${apiBaseUrl}/api/class-schedule/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scheduleData)
        })
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              throw new Error(data.error);
            }
            alert(data.message || 'Class scheduled successfully!');
            addScheduleForm.reset();
            loadScheduleTable();
          })
          .catch(err => {
            console.error('Failed to schedule class:', err);
            alert(err.message || 'Failed to schedule class. Please try again.');
          });
      });
    });
  }
});

// Class Type Actions
function editClassType(id) {
  waitForApiBaseUrl().then(apiBaseUrl => {
    fetch(`${apiBaseUrl}/api/class-types/${id}`)
      .then(res => res.json())
      .then(cls => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content">
            <h2>Edit Class Type</h2>
            <form id="edit-class-type-form">
              <input type="text" id="edit-name" value="${cls.name}" required>
              <input type="text" id="edit-description" value="${cls.description || ''}">
              <button type="submit">Save Changes</button>
              <button type="button" onclick="this.closest('.modal').remove()">Cancel</button>
            </form>
          </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('edit-class-type-form').addEventListener('submit', function(e) {
          e.preventDefault();
          const updatedClass = {
            name: document.getElementById('edit-name').value.trim(),
            description: document.getElementById('edit-description').value.trim()
          };

          fetch(`${apiBaseUrl}/api/class-types/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedClass)
          })
            .then(res => res.json())
            .then(data => {
              alert(data.message || 'Class type updated successfully!');
              modal.remove();
              loadClassTypes();
              populateClassTypeDropdown();
            })
            .catch(err => {
              console.error('Failed to update class type:', err);
              alert('Failed to update class type.');
            });
        });
      });
  });
}
function deleteClassType(id) {
  if (confirm("Are you sure you want to delete this class type?")) {
    waitForApiBaseUrl().then(apiBaseUrl => {
      fetch(`${apiBaseUrl}/api/class-types/${id}`, {
        method: "DELETE"
      })
        .then(res => res.json().then(data => ({ status: res.status, body: data })))
        .then(({ status, body }) => {
          if (status === 200) {
            alert(body.message || "Class type deleted.");
            loadClassTypes(); // Refresh table
            populateClassTypeDropdown(); // Update class type selector
          } else {
            console.error("Backend error:", body.error);
            alert("Failed to delete class type: " + (body.error || "Unknown error"));
          }
        })
        .catch(err => {
          console.error("Network error deleting class type:", err);
          alert("Failed to delete class type. Network or server error.");
        });
    });
  }
}


// Add Trainer Form
const trainerForm = document.getElementById('trainer-form');
if (trainerForm) {
  trainerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const trainerData = {
      first_name: document.getElementById('new-trainer-firstname').value.trim(),
      last_name: document.getElementById('new-trainer-lastname').value.trim(),
      email: document.getElementById('new-trainer-email').value.trim(),
      phone_number: document.getElementById('new-trainer-phone').value.trim(),
      specialisation: document.getElementById('new-trainer-specialisation').value.trim(),
      password: document.getElementById('new-trainer-password').value,
      status: 'active'
    };

    // Validate required fields
    if (!trainerData.first_name || !trainerData.last_name || !trainerData.email || !trainerData.password) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trainerData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Show loading state
    const submitButton = document.getElementById('add-trainer-btn');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Adding...';
    submitButton.disabled = true;

    waitForApiBaseUrl().then(apiBaseUrl => {
      fetch(`${apiBaseUrl}/api/trainers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainerData)
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            throw new Error(data.error);
          }
          alert(data.message || 'Trainer added successfully!');
          trainerForm.reset();
          loadTrainers(); // Refresh the trainers list
        })
        .catch(err => {
          console.error('Failed to add trainer:', err);
          alert(err.message || 'Failed to add trainer. Please try again.');
        })
        .finally(() => {
          // Reset button state
          submitButton.textContent = originalButtonText;
          submitButton.disabled = false;
        });
    });
  });
}
