document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.querySelector(".btn-signout");
  
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault(); // prevent link redirect
  
        // Clear storage and redirect
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "login.html";
      });
    }
  });
  