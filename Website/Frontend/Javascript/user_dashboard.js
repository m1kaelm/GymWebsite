document.addEventListener("DOMContentLoaded", () => {
  fetch("http://localhost:3000/api/session", { credentials: "include" })
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
      fetch(`http://localhost:3000/api/members/${userId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: document.getElementById("firstName").value,
          last_name: document.getElementById("lastName").value,
          email: document.getElementById("email").value,
          phone_number: document.getElementById("phone").value,
        }),
      })
        .then((res) => res.json())
        .then((msg) => alert(msg.message || "Updated!"));
    });

    function loadProfile(id) {
      fetch(`http://localhost:3000/api/members/${id}`)
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

    function loadMembership(id) {
      fetch(`http://localhost:3000/api/members/${id}/subscription`)
        .then((res) => res.json())
        .then((data) => {
          document.getElementById("plan-name").textContent = data.plan_name || "N/A";
          document.getElementById("plan-start-date").textContent = data.start_date || "N/A";
          document.getElementById("plan-end-date").textContent = data.end_date || "N/A";
        })
        .catch(() => alert("Failed to load membership details."));
    }

    function loadClasses(userId) {
      fetch(`http://localhost:3000/api/class-registrations/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          const list = document.getElementById("registered-classes-list");
          list.innerHTML = "";

          if (!Array.isArray(data) || data.length === 0) {
            list.innerHTML = "<li>No registered classes.</li>";
            return;
          }

          data.forEach((cls) => {
            const li = document.createElement("li");
            li.innerHTML = `
              Class ID: ${cls.schedule_id} – Registered on ${cls.registration_date}
              <button onclick="cancelClass(${cls.schedule_id})">Cancel</button>
            `;
            list.appendChild(li);
          });
        });

      fetch("http://localhost:3000/api/class-schedule")
        .then((res) => res.json())
        .then((data) => {
          const list = document.getElementById("available-classes-list");
          list.innerHTML = "";

          data.forEach((cls) => {
            const li = document.createElement("li");
            li.innerHTML = `
              Class ID: ${cls.id} – Room ${cls.room_number}
              <button onclick="attendClass(${cls.id})">Attend</button>
            `;
            list.appendChild(li);
          });
        });
    }

    function loadClassSummary(id) {
      fetch(`http://localhost:3000/api/class-registrations/${id}`)
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
            li.textContent = `Class ID: ${cls.schedule_id} @ ${cls.registration_date}`;
            list.appendChild(li);
          });
        })
        .catch(() => {
          document.getElementById("summary-classes").innerHTML = "<li>Error loading classes</li>";
        });
    }

    function loadMembershipSummary(id) {
      fetch(`http://localhost:3000/api/members/${id}/subscription`)
        .then((res) => res.json())
        .then((data) => {
          document.getElementById("summary-end-date").textContent = data.end_date || "N/A";
        })
        .catch(() => {
          document.getElementById("summary-end-date").textContent = "Error";
        });
    }

    window.attendClass = function (scheduleId) {
      fetch("http://localhost:3000/api/class-register", {
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
      fetch("http://localhost:3000/api/class-register/cancel", {
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

    // Initial default tab
    sections.dashboard.style.display = "block";
    loadMembershipSummary(userId);
    loadClassSummary(userId);
  }
});
