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
    const loginForm = document.getElementById("login-form");
  
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
  
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
  
      console.log("Email:", email, "Password:", password);
      
      waitForApiBaseUrl().then(apiBaseUrl => {
        fetch(`${apiBaseUrl}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", 
          body: JSON.stringify({ email, password })
        })
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              alert(data.error);
            } else {
              // Store username and role info in localStorage
              localStorage.setItem("userId", data.userId);
              localStorage.setItem("userName", data.name);
              localStorage.setItem("role", data.role);
  
              switch (data.role) {
                case "admin": window.location.href = "admin_dashboard.html"; break;
                case "trainer": window.location.href = "trainer_dashboard.html"; break;
                case "staff": window.location.href = "staff_dashboard.html"; break;
                default: window.location.href = "user_dashboard.html";
              }
            }
          })
          .catch(err => {
            console.error("Login error:", err);
            alert("Login failed. Try again.");
          });
      });
    });
  });
  