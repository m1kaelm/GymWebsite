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

document.addEventListener("DOMContentLoaded", () => {
  // Check session and load staff info
  waitForApiBaseUrl().then(apiBaseUrl => {
    fetch(`${apiBaseUrl}/api/session`, { credentials: "include" })
      .then(res => {
        if (!res.ok) {
          console.error("Staff dashboard error:", res.status);
          throw new Error("Failed to load staff dashboard");
        }
        return res.json();
      })
      .then(data => {
        const user = data.user;
        if (user.role !== 'staff') {
          window.location.href = "login.html";
          return;
        }
        localStorage.setItem("userId", user.id);
        localStorage.setItem("userName", user.name);
        localStorage.setItem("role", user.role);
        initDashboard(user.id, user.name);
      })
      .catch(() => {
        window.location.href = "login.html";
      });
  });

  function initDashboard(staffId, name) {
    // Set staff name
    document.getElementById("staff-name").textContent = name;

    // Section toggling logic
    const dashboardGrid = document.querySelector('.dashboard-grid');
    const membersSection = document.getElementById('members-section');
    const scheduleSection = document.getElementById('schedule-section');

    function hideAllSections() {
      membersSection.style.display = 'none';
      scheduleSection.style.display = 'none';
      dashboardGrid.style.display = 'flex';
    }

    document.getElementById('show-members-section').addEventListener('click', () => {
      membersSection.style.display = 'block';
      scheduleSection.style.display = 'none';
      dashboardGrid.style.display = 'none';
    });
    document.getElementById('show-schedule-section').addEventListener('click', () => {
      membersSection.style.display = 'none';
      scheduleSection.style.display = 'block';
      dashboardGrid.style.display = 'none';
      populateClassTypeDropdown();
      populateTrainerDropdown();
      loadScheduleTable();
    });

    // Add click handlers for dashboard cards
    document.querySelectorAll('.dashboard-card .btn-update').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = btn.getAttribute('href');
        if (target) {
          window.location.href = target;
        }
      });
    });
  }
});

// Member Management Functions
function searchMembers() {
  const searchInput = document.getElementById('member-search');
  const searchValue = searchInput.value.trim();

  if (!searchValue) return;

  waitForApiBaseUrl().then(apiBaseUrl => {
    fetch(`${apiBaseUrl}/api/members/search?column=email&value=${encodeURIComponent(searchValue)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          displayMemberResults(data);
        } else {
          displayMemberResults([]);
          alert("No members found.");
        }
      })
      .catch(err => {
        console.error("Search failed:", err);
        alert("Failed to search members.");
      });
  });
}

function displayMemberResults(members) {
  const resultsContainer = document.getElementById('member-results');
  if (!resultsContainer) return;

  resultsContainer.innerHTML = '';
  
  if (members.length === 0) {
    resultsContainer.innerHTML = '<p>No members found.</p>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'member-table';
  
  // Create table header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>ID</th>
      <th>Name</th>
      <th>Email</th>
      <th>Phone</th>
      <th>Actions</th>
    </tr>
  `;
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement('tbody');
  members.forEach(member => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${member.id}</td>
      <td>${member.first_name} ${member.last_name}</td>
      <td>${member.email}</td>
      <td>${member.phone_number || 'N/A'}</td>
      <td>
        <button onclick="viewMemberDetails(${member.id})">View</button>
        <button onclick="updateMemberSubscription(${member.id})">Update Subscription</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  resultsContainer.appendChild(table);
}

function viewMemberDetails(memberId) {
  waitForApiBaseUrl().then(apiBaseUrl => {
    fetch(`${apiBaseUrl}/api/members/${memberId}`)
      .then(res => res.json())
      .then(member => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content">
            <h2>Member Details</h2>
            <p><strong>Name:</strong> ${member.first_name} ${member.last_name}</p>
            <p><strong>Email:</strong> ${member.email}</p>
            <p><strong>Phone:</strong> ${member.phone_number || 'N/A'}</p>
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
          </div>
        `;
        document.body.appendChild(modal);
      })
      .catch(err => {
        console.error("Failed to load member details:", err);
        alert("Failed to load member details.");
      });
  });
}

function updateMemberSubscription(memberId) {
  waitForApiBaseUrl().then(apiBaseUrl => {
    // First get current subscription
    fetch(`${apiBaseUrl}/api/members/${memberId}/subscription`)
      .then(res => res.json())
      .then(subscription => {
        // Then get available plans
        return fetch(`${apiBaseUrl}/api/membership_plans`)
          .then(res => res.json())
          .then(plans => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
              <div class="modal-content">
                <h2>Update Subscription</h2>
                <p><strong>Current Plan:</strong> ${subscription.plan_name || 'None'}</p>
                <p><strong>Status:</strong> ${subscription.payment_status || 'N/A'}</p>
                <select id="new-plan-select">
                  ${plans.map(plan => `
                    <option value="${plan.id}">${plan.name} - $${plan.price}/month</option>
                  `).join('')}
                </select>
                <button onclick="confirmSubscriptionUpdate(${memberId})">Update</button>
                <button onclick="this.parentElement.parentElement.remove()">Cancel</button>
              </div>
            `;
            document.body.appendChild(modal);
          });
      })
      .catch(err => {
        console.error("Failed to load subscription details:", err);
        alert("Failed to load subscription details.");
      });
  });
}

function confirmSubscriptionUpdate(memberId) {
  const planId = document.getElementById('new-plan-select').value;
  
  waitForApiBaseUrl().then(apiBaseUrl => {
    fetch(`${apiBaseUrl}/api/members/${memberId}/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || "Subscription updated successfully!");
        document.querySelector('.modal').remove();
      })
      .catch(err => {
        console.error("Failed to update subscription:", err);
        alert("Failed to update subscription.");
      });
  });
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('search-members-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', searchMembers);
  }
});

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

function loadScheduleTable() {
  waitForApiBaseUrl().then(apiBaseUrl => {
    fetch(`${apiBaseUrl}/api/class-schedule`)
      .then(res => res.json())
      .then(schedules => {
        const tbody = document.querySelector('#schedule-table tbody');
        tbody.innerHTML = '';
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
              <button onclick="editSchedule(${sch.schedule_id})" class="btn-edit">Edit</button>
              <button onclick="deleteSchedule(${sch.schedule_id})" class="btn-delete">Delete</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      });
  });
}

function editSchedule(scheduleId) {
  waitForApiBaseUrl().then(apiBaseUrl => {
    // First get the current schedule details
    fetch(`${apiBaseUrl}/api/class-schedule/${scheduleId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(schedule => {
        // Create and show edit modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content">
            <h2>Edit Class Schedule</h2>
            <form id="edit-schedule-form">
              <label for="edit-class-type">Class Type:</label>
              <select id="edit-class-type" required></select>
              
              <label for="edit-trainer">Trainer:</label>
              <select id="edit-trainer" required></select>
              
              <label for="edit-start-time">Start Time:</label>
              <input type="datetime-local" id="edit-start-time" required />
              
              <label for="edit-end-time">End Time:</label>
              <input type="datetime-local" id="edit-end-time" required />
              
              <label for="edit-room">Room Number:</label>
              <input type="text" id="edit-room" required />
              
              <button type="submit">Save Changes</button>
              <button type="button" onclick="this.closest('.modal').remove()">Cancel</button>
            </form>
          </div>
        `;
        document.body.appendChild(modal);

        // Populate dropdowns
        populateClassTypeDropdown('edit-class-type');
        populateTrainerDropdown('edit-trainer');

        // Set current values after a short delay to ensure dropdowns are populated
        setTimeout(() => {
          document.getElementById('edit-class-type').value = schedule.class_type_id;
          document.getElementById('edit-trainer').value = schedule.trainer_id;
          document.getElementById('edit-start-time').value = schedule.start_time.slice(0, 16);
          document.getElementById('edit-end-time').value = schedule.end_time.slice(0, 16);
          document.getElementById('edit-room').value = schedule.room_number;
        }, 100);

        // Handle form submission
        document.getElementById('edit-schedule-form').addEventListener('submit', function(e) {
          e.preventDefault();
          const updatedSchedule = {
            class_type_id: document.getElementById('edit-class-type').value,
            trainer_id: document.getElementById('edit-trainer').value,
            start_time: document.getElementById('edit-start-time').value,
            end_time: document.getElementById('edit-end-time').value,
            room_number: document.getElementById('edit-room').value
          };

          fetch(`${apiBaseUrl}/api/class-schedule/${scheduleId}`, {
            method: 'PUT',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedSchedule)
          })
            .then(res => {
              if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
              }
              return res.json();
            })
            .then(data => {
              alert(data.message || 'Schedule updated successfully!');
              modal.remove();
              loadScheduleTable();
            })
            .catch(err => {
              console.error('Failed to update schedule:', err);
              alert('Failed to update schedule. Please try again.');
            });
        });
      })
      .catch(err => {
        console.error('Failed to load schedule details:', err);
        alert('Failed to load schedule details. Please try again.');
      });
  });
}

function deleteSchedule(scheduleId) {
  if (confirm('Are you sure you want to delete this schedule?')) {
    waitForApiBaseUrl().then(apiBaseUrl => {
      fetch(`${apiBaseUrl}/api/class-schedule/${scheduleId}`, {
        method: 'DELETE'
      })
        .then(res => res.json())
        .then(data => {
          alert(data.message || 'Schedule deleted successfully!');
          loadScheduleTable();
        })
        .catch(err => {
          console.error('Failed to delete schedule:', err);
          alert('Failed to delete schedule.');
        });
    });
  }
}

document.getElementById('add-schedule-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const class_type_id = document.getElementById('class-type-select').value;
  const trainer_id = document.getElementById('trainer-select').value;
  const start_time = document.getElementById('start-time').value;
  const end_time = document.getElementById('end-time').value;
  const room_number = document.getElementById('room-number').value;

  fetch('/api/class-schedule/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ class_type_id, trainer_id, start_time, end_time, room_number })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || 'Class scheduled!');
      loadScheduleTable();
    })
    .catch(err => {
      alert('Failed to schedule class.');
      console.error(err);
    });
}); 