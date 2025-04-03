const API_BASE = "http://localhost:3000/api";
const trainerId = 1; // Example: Replace with session or cookie value

document.addEventListener("DOMContentLoaded", () => {
  loadTodayClasses();
  loadTrainerHours();
});

function loadTodayClasses() {
  fetch(`${API_BASE}/class-schedule`)
    .then(res => res.json())
    .then(data => {
      const today = new Date().toISOString().slice(0, 10);
      const filtered = data.filter(
        session => session.trainer_id === trainerId &&
                   session.start_time.startsWith(today)
      );

      const list = filtered.map(
        c => `<li>Class #${c.class_id} - ${formatTime(c.start_time)}</li>`
      ).join("");

      document.querySelector(".dashboard-card ul").innerHTML = list || "<li>No classes today</li>";
    });
}

function loadTrainerHours() {
  fetch(`${API_BASE}/trainers/${trainerId}/hours`)
    .then(res => res.json())
    .then(data => {
      console.log("Logged hours:", data);
      // You can display summary like total hours this week, etc.
    });
}

function formatTime(dateTimeStr) {
  const t = new Date(dateTimeStr);
  return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
