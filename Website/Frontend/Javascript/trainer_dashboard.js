let apiBaseUrl = null;
let calendar = null;

// Fetch the config when the page loads
fetch('/api/config')
  .then(res => res.json())
  .then(config => {
    apiBaseUrl = config.apiBaseUrl;
  })
  .catch(err => {
    console.error('Failed to load API config:', err);
  });

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
  // Get trainer info from localStorage
  const trainerId = localStorage.getItem("userId");
  const trainerName = localStorage.getItem("userName");

  // Display trainer name
  document.getElementById("trainer-name").textContent = trainerName;

  // Initialize all dashboard components
  waitForApiBaseUrl().then(apiBaseUrl => {
    loadTodayClasses(apiBaseUrl, trainerId);
    loadTrainerCalendar(apiBaseUrl, trainerId);
    loadAssignedMembers(apiBaseUrl, trainerId);
    loadScheduleStatus(apiBaseUrl, trainerId);
  });
});

function loadTodayClasses(apiBaseUrl, trainerId) {
  const today = new Date().toISOString().split('T')[0];
  
  fetch(`${apiBaseUrl}/api/class-schedule`)
    .then(res => res.json())
    .then(data => {
      const todayClasses = data.filter(session => 
        String(session.trainer_id) === String(trainerId) &&
        session.start_time.startsWith(today)
      );

      const classesList = document.getElementById("classes-list");
      if (todayClasses.length === 0) {
        classesList.innerHTML = "<li>No classes scheduled for today</li>";
        return;
      }

      classesList.innerHTML = todayClasses.map(cls => `
        <li>
          <strong>${cls.class_name}</strong>
          <br>
          ${formatTime(cls.start_time)} - ${formatTime(cls.end_time)}
          <br>
          Room: ${cls.room_number}
        </li>
      `).join("");
    })
    .catch(err => {
      console.error("Error loading classes:", err);
      document.getElementById("classes-list").innerHTML = "<li>Error loading classes</li>";
    });
}

function loadTrainerCalendar(apiBaseUrl, trainerId) {
  const calendarEl = document.getElementById("trainer-calendar");
  
  fetch(`${apiBaseUrl}/api/class-schedule`)
    .then(res => res.json())
    .then(data => {
      const events = data
        .filter(session => String(session.trainer_id) === String(trainerId))
        .map(session => ({
          title: session.class_name,
          start: session.start_time,
          end: session.end_time,
          extendedProps: {
            room: session.room_number,
            classId: session.class_id
          }
        }));

      calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        height: 400,
        events: events,
        eventClick: function(info) {
          alert(
            `Class: ${info.event.title}\n` +
            `Room: ${info.event.extendedProps.room}\n` +
            `Time: ${formatTime(info.event.start)} - ${formatTime(info.event.end)}`
          );
        }
      });
      calendar.render();
    })
    .catch(err => {
      console.error("Error loading calendar:", err);
      calendarEl.innerHTML = "Error loading calendar";
    });
}

function loadAssignedMembers(apiBaseUrl, trainerId) {
  fetch(`${apiBaseUrl}/api/trainers/${trainerId}/members`)
    .then(res => res.json())
    .then(data => {
      const membersList = document.getElementById("members-list");
      if (data.length === 0) {
        membersList.innerHTML = "<li>No members assigned</li>";
        return;
      }

      membersList.innerHTML = data.map(member => `
        <li>
          <strong>${member.first_name} ${member.last_name}</strong>
          <br>
          ${member.email}
        </li>
      `).join("");
    })
    .catch(err => {
      console.error("Error loading members:", err);
      document.getElementById("members-list").innerHTML = "<li>Error loading members</li>";
    });
}

function loadScheduleStatus(apiBaseUrl, trainerId) {
  const today = new Date().toISOString().split('T')[0];
  
  fetch(`${apiBaseUrl}/api/trainers/${trainerId}/clock-status`, {
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
    .then(data => {
      updateScheduleUI(data);
    })
    .catch(err => {
      console.error("Error loading schedule status:", err);
      alert("Failed to load schedule status. Please refresh the page.");
    });
}

function updateScheduleUI(data) {
  const assignedHours = document.getElementById("assigned-hours");
  const assignedClassesTable = document.getElementById("assigned-classes-table");

  // Update hours
  assignedHours.textContent = data.assignedHours.toFixed(2);

  // Update assigned classes
  const assignedClassesBody = assignedClassesTable.querySelector('tbody');
  assignedClassesBody.innerHTML = '';
  
  if (data.assignedClasses && data.assignedClasses.length > 0) {
    data.assignedClasses.forEach(cls => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(cls.assigned_start).toLocaleTimeString()} - ${new Date(cls.assigned_end).toLocaleTimeString()}</td>
        <td>${cls.class_name}</td>
        <td>${cls.room_number}</td>
      `;
      assignedClassesBody.appendChild(row);
    });
  } else {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="3">No classes assigned for today</td>';
    assignedClassesBody.appendChild(row);
  }
}

function formatTime(dateTimeStr) {
  const date = new Date(dateTimeStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}