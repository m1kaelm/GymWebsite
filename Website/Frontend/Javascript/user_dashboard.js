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
  waitForApiBaseUrl().then(apiBaseUrl => {
    fetch(`${apiBaseUrl}/api/session`, { credentials: "include" })
      .then(res => {
        if (!res.ok) {
          console.error("User dashboard error:", res.status);
          throw new Error("Failed to load user dashboard");
        }
        return res.json();
      })
      .then(data => {
        const user = data.user;
        localStorage.setItem("userId", user.id);
        localStorage.setItem("userName", user.name);
        localStorage.setItem("role", user.role);
        initDashboard(user.id, user.name);
      })
      .catch(() => {
        window.location.href = "login.html";
      });

    function initDashboard(userId, name) {
      document.getElementById("user-name").textContent = name;

      const tabButtons = document.querySelectorAll(".tab-btn");
      const sections = {
        dashboard: document.getElementById("dashboard-section"),
        profile: document.getElementById("profile-section"),
        membership: document.getElementById("membership-section"),
        classes: document.getElementById("classes-section"),
      };

      tabButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          tabButtons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");

          Object.values(sections).forEach((sec) => (sec.style.display = "none"));
          const target = btn.dataset.tab;
          sections[target].style.display = "block";

          if (target === "dashboard") {
            loadMembershipSummary(userId);
            loadClassSummary(userId);
          }
          if (target === "membership") loadMembership(userId);
          if (target === "classes") loadClasses(userId);
          if (target === "profile") loadProfile(userId);
        });
      });

      document.getElementById("profile-form").addEventListener("submit", (e) => {
        e.preventDefault();
        
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        
        // Check if passwords match when either is filled
        if (password || confirmPassword) {
          if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
          }
        }

        const updateData = {
          first_name: document.getElementById("firstName").value,
          last_name: document.getElementById("lastName").value,
          email: document.getElementById("email").value,
          phone_number: document.getElementById("phone").value,
        };

        // Only include password if it's not empty
        if (password) {
          updateData.password = password;
        }

        fetch(`${apiBaseUrl}/api/members/${userId}/update`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        })
          .then((res) => res.json())
          .then((msg) => {
            alert(msg.message || "Updated!");
            // Clear password fields after successful update
            document.getElementById("password").value = "";
            document.getElementById("confirmPassword").value = "";
          })
          .catch((error) => {
            alert("Failed to update profile: " + error.message);
          });
      });

      function loadProfile(id) {
        fetch(`${apiBaseUrl}/api/members/${id}`)
          .then((res) => res.json())
          .then((data) => {
            const member = Array.isArray(data) ? data[0] : data;
            document.getElementById("firstName").value = member.first_name || "";
            document.getElementById("lastName").value = member.last_name || "";
            document.getElementById("email").value = member.email || "";
            document.getElementById("phone").value = member.phone_number || "";
          })
          .catch(() => alert("Failed to load profile."));
      }

      let membershipListenersAdded = false;
      function loadMembership(id) {
        fetch(`${apiBaseUrl}/api/members/${id}/subscription`)
          .then((res) => res.json())
          .then((data) => {
            document.getElementById("plan-name").textContent = data.plan_name || "N/A";
            document.getElementById("plan-start-date").textContent = data.start_date || "N/A";
            
            // Format and display renewal date
            const renewalDate = data.end_date ? new Date(data.end_date).toLocaleDateString() : "N/A";
            document.getElementById("plan-end-date").textContent = renewalDate;
            
            // Set status with appropriate styling
            const statusElement = document.getElementById("membership-status");
            statusElement.textContent = data.payment_status || "Active";
            
            // Add status-specific styling
            statusElement.className = ""; // Clear existing classes
            if (data.payment_status === "cancelled") {
              statusElement.classList.add("status-cancelled");
            } else if (data.payment_status === "pending") {
              statusElement.classList.add("status-pending");
            } else {
              statusElement.classList.add("status-active");
            }
            
            // Show confirm payment button if status is pending
            const confirmPaymentBtn = document.getElementById("confirm-payment-btn");
            if (data.payment_status === "pending") {
              confirmPaymentBtn.style.display = "inline-block";
            } else {
              confirmPaymentBtn.style.display = "none";
            }
            
            // Enable/disable buttons based on membership status
            const renewBtn = document.getElementById("renew-membership-btn");
            const upgradeBtn = document.getElementById("upgrade-membership-btn");
            const cancelBtn = document.getElementById("cancel-membership-btn");
            if (data.payment_status === "cancelled") {
              renewBtn.disabled = false;  // Keep renew enabled
              upgradeBtn.disabled = false;  // Keep upgrade enabled
              cancelBtn.disabled = true;   // Only disable cancel button
            } else {
              renewBtn.disabled = false;
              upgradeBtn.disabled = false;
              cancelBtn.disabled = false;
            }

            // Add event listeners only once
            if (!membershipListenersAdded) {
              confirmPaymentBtn.addEventListener("click", () => {
                confirmMembershipPayment(id);
              });
              renewBtn.addEventListener("click", () => {
                if (confirm("Are you sure you want to renew your membership?")) {
                  renewMembership(id);
                }
              });
              upgradeBtn.addEventListener("click", () => {
                showUpgradeModal(id);
              });
              cancelBtn.addEventListener("click", () => {
                if (confirm("Are you sure you want to cancel your membership? This action cannot be undone.")) {
                  cancelMembership(id);
                }
              });
              document.getElementById("close-modal").addEventListener("click", () => {
                document.getElementById("upgrade-modal").style.display = "none";
              });
              membershipListenersAdded = true;
            }
          })
          .catch(() => alert("Failed to load membership details."));
      }

      function renewMembership(userId) {
        fetch(`${apiBaseUrl}/api/members/${userId}/renew`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        })
          .then((res) => res.json())
          .then((data) => {
            alert(data.message || "Membership renewed successfully!");
            loadMembership(userId);
          })
          .catch((error) => {
            alert("Failed to renew membership: " + error.message);
          });
      }

      function showUpgradeModal(userId) {
        const modal = document.getElementById("upgrade-modal");
        const plansContainer = document.getElementById("available-plans");
        
        // Fetch available plans
        fetch(`${apiBaseUrl}/api/membership_plans`)
          .then((res) => res.json())
          .then((plans) => {
            plansContainer.innerHTML = "";
            plans.forEach((plan) => {
              const planElement = document.createElement("div");
              planElement.className = "plan-option";
              planElement.innerHTML = `
                <h4>${plan.name}</h4>
                <p>${plan.description}</p>
                <p><strong>Price:</strong> $${plan.price}/month</p>
                <button onclick="upgradeMembership(${userId}, ${plan.id})">Select Plan</button>
              `;
              plansContainer.appendChild(planElement);
            });
            modal.style.display = "block";
          })
          .catch((error) => {
            alert("Failed to load membership plans: " + error.message);
          });
      }

      window.upgradeMembership = function(userId, planId) {
        fetch(`${apiBaseUrl}/api/members/${userId}/upgrade`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ plan_id: planId })
        })
          .then(async (res) => {
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({ error: "Failed to upgrade membership" }));
              throw new Error(errorData.error || "Failed to upgrade membership");
            }
            return res.json();
          })
          .then((data) => {
            alert(data.message || "Membership upgraded successfully!");
            document.getElementById("upgrade-modal").style.display = "none";
            loadMembership(userId);
          })
          .catch((error) => {
            console.error("Upgrade error:", error);
            alert(error.message || "Failed to upgrade membership. Please try again.");
            alert("Failed to upgrade membership: " + error.message);
          });
      };

      function cancelMembership(userId) {
        fetch(`${apiBaseUrl}/api/members/${userId}/cancel-membership`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        })
          .then((res) => res.json())
          .then((data) => {
            alert(data.message || "Membership cancelled successfully!");
            loadMembership(userId);
          })
          .catch((error) => {
            alert("Failed to cancel membership: " + error.message);
          });
      }

      function loadClasses(userId) {
        // First get registered classes
        fetch(`${apiBaseUrl}/api/class-registrations/${userId}`)
          .then((res) => res.json())
          .then((registeredData) => {
            const list = document.getElementById("registered-classes-list");
            list.innerHTML = "";

            let registeredClassIds = [];
            if (Array.isArray(registeredData)) {
              registeredClassIds = registeredData.map(cls => cls.schedule_id);
            } else {
              // Show error in the UI
              document.getElementById("registered-classes-list").innerHTML = "<li>Error loading registered classes</li>";
              document.getElementById("available-classes-list").innerHTML = "<li>Error loading available classes</li>";
              return;
            }

            if (!Array.isArray(registeredData) || registeredData.length === 0) {
              list.innerHTML = "<li>No registered classes.</li>";
            } else {
              registeredData.forEach((cls) => {
                const li = document.createElement("li");
                const startTime = new Date(cls.start_time).toLocaleString();
                li.innerHTML = `
                  <div class="class-info">
                    <strong>${cls.class_name}</strong>
                    <p>Room: ${cls.room_number}</p>
                    <p>Time: ${startTime}</p>
                    <p>Registered on: ${new Date(cls.registration_date).toLocaleDateString()}</p>
                  </div>
                  <button onclick="cancelClass(${cls.schedule_id})">Cancel</button>
                `;
                list.appendChild(li);
              });
            }

            // Then get available classes
            return fetch(`${apiBaseUrl}/api/class-schedule`)
              .then((res) => res.json())
              .then((availableData) => {
                const list = document.getElementById("available-classes-list");
                list.innerHTML = "";

                if (!Array.isArray(availableData) || availableData.length === 0) {
                  list.innerHTML = "<li>No available classes.</li>";
                  return;
                }

                availableData.forEach((cls) => {
                  const li = document.createElement("li");
                  const isRegistered = registeredClassIds.includes(cls.schedule_id);
                  const startTime = new Date(cls.start_time).toLocaleString();
                  li.innerHTML = `
                    <div class="class-info">
                      <strong>${cls.class_name}</strong>
                      <p>Room: ${cls.room_number}</p>
                      <p>Time: ${startTime}</p>
                      <p>Trainer: ${cls.trainer_name}</p>
                    </div>
                    <button onclick="attendClass(${cls.schedule_id})" ${isRegistered ? 'disabled' : ''}>
                      ${isRegistered ? 'Already Registered' : 'Attend'}
                    </button>
                  `;
                  list.appendChild(li);
                });
              });
          })
          .catch((error) => {
            console.error("Error loading classes:", error);
            document.getElementById("registered-classes-list").innerHTML = "<li>Error loading registered classes</li>";
            document.getElementById("available-classes-list").innerHTML = "<li>Error loading available classes</li>";
          });
      }

      function loadClassSummary(id) {
        fetch(`${apiBaseUrl}/api/class-registrations/${id}`)
          .then((res) => res.json())
          .then((data) => {
            const list = document.getElementById("summary-classes");
            list.innerHTML = "";

            if (!Array.isArray(data) || data.length === 0) {
              list.innerHTML = "<li>No upcoming classes.</li>";
              return;
            }

            data.slice(0, 5).forEach((cls) => {
              const li = document.createElement("li");
              const startTime = new Date(cls.start_time).toLocaleString();
              li.textContent = `${cls.class_name} - ${startTime}`;
              list.appendChild(li);
            });
          })
          .catch(() => {
            document.getElementById("summary-classes").innerHTML = "<li>Error loading classes</li>";
          });
      }

      function loadMembershipSummary(id) {
        fetch(`${apiBaseUrl}/api/members/${id}/subscription`)
          .then((res) => res.json())
          .then((data) => {
            document.getElementById("summary-end-date").textContent = data.end_date || "N/A";
          })
          .catch(() => {
            document.getElementById("summary-end-date").textContent = "Error";
          });
      }

      window.attendClass = function (scheduleId) {
        fetch(`${apiBaseUrl}/api/class-register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schedule_id: scheduleId, member_id: userId }),
        })
          .then((res) => res.json())
          .then((msg) => {
            alert(msg.message || "Class registered.");
            loadClasses(userId);
          });
      };

      window.cancelClass = function (scheduleId) {
        fetch(`${apiBaseUrl}/api/class-register/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schedule_id: scheduleId, member_id: userId }),
        })
          .then((res) => res.json())
          .then((msg) => {
            alert(msg.message || "Class canceled.");
            loadClasses(userId);
          });
      };

      function confirmMembershipPayment(userId) {
        fetch(`${apiBaseUrl}/api/members/${userId}/confirm-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        })
          .then((res) => res.json())
          .then((data) => {
            alert(data.message || "Payment confirmed!");
            loadMembership(userId);
          })
          .catch((error) => {
            alert("Failed to confirm payment: " + error.message);
          });
      }

      // Initial default tab
      sections.dashboard.style.display = "block";
      loadMembershipSummary(userId);
      loadClassSummary(userId);

      document.getElementById('show-schedule-section').addEventListener('click', () => {
        // ...existing code to show/hide sections...
        populateClassTypeDropdown();
        populateTrainerDropdown();
      });

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
            // Optionally reload the schedule table here
          })
          .catch(err => {
            alert('Failed to schedule class.');
            console.error(err);
          });
      });
    }
  });
});
