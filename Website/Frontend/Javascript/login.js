document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
  
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
  
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
  
      fetch("http://localhost:3000/api/login", {
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
  