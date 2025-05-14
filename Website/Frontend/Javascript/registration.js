document.addEventListener("DOMContentLoaded", function () {
  const steps = document.querySelectorAll(".form-step");
  const nextBtns = document.querySelectorAll(".next");
  const prevBtns = document.querySelectorAll(".prev");
  const progressBar = document.getElementById("progress-bar");
  const registerForm = document.getElementById("registration-form");


  // Get API base URL from config
    let apiBaseUrl = '';
    let configLoaded = false;

    fetch('/api/config')
    .then(response => response.json())
    .then(config => {
        apiBaseUrl = config.apiBaseUrl;
        configLoaded = true;
    })
    .catch(error => {
        console.error('Failed to get API config:', error);
    });


  let currentStep = 0;

  function showStep(index) {
      steps.forEach((step, i) => {
          step.classList.toggle("active", i === index);
      });
      progressBar.textContent = `Step ${index + 1} of ${steps.length}`;
  }

  function validateStep(stepIndex) {
      const currentStepElement = steps[stepIndex];
      const requiredFields = currentStepElement.querySelectorAll("[required]");
      let isValid = true;

      requiredFields.forEach(field => {
          const errorDiv = field.nextElementSibling && field.nextElementSibling.classList.contains('error-message')
              ? field.nextElementSibling
              : null;

          if (!field.value.trim() || (field.type === "email" && !field.validity.valid) || (field.type === "tel" && !field.validity.valid) || (field.type === "password" && field.value.length < 8)) {
              field.classList.add("error");
              if (errorDiv) errorDiv.style.display = "block";
              isValid = false;
          } else {
              field.classList.remove("error");
              if (errorDiv) errorDiv.style.display = "none";
          }
      });

      return isValid;
  }

  nextBtns.forEach(btn => {
      btn.addEventListener("click", () => {
          if (validateStep(currentStep) && currentStep < steps.length - 1) {
              currentStep++;
              showStep(currentStep);
          }
      });
  });

  prevBtns.forEach(btn => {
      btn.addEventListener("click", () => {
          if (currentStep > 0) {
              currentStep--;
              showStep(currentStep);
          }
      });
  });

  // Handle form submission
  registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      
      if (!validateStep(currentStep)) {
          alert("Please fill in all required fields");
          return;
      }

      if (!configLoaded) {
        alert("Configuration not loaded yet. Please wait and try again.");
        return;
        }

      const formData = new FormData(registerForm);
      const data = {
          first_name: formData.get("firstName"),
          last_name: formData.get("lastName"),
          email: formData.get("email"),
          password: formData.get("password"),
          phone_number: formData.get("phone"),
          location: formData.get("location"),
          membership_type: formData.get("membership"),
          dob: formData.get("dob"),
          gender: formData.get("gender"),
          address: formData.get("address")
      };

      // Show loading state
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Registering...";

      try {
          const response = await fetch(`${apiBaseUrl}/api/members/register`, {
              method: "POST",
              headers: { 
                  "Content-Type": "application/json",
                  "Accept": "application/json"
              },
              credentials: 'include',
              body: JSON.stringify(data)
          });

          const result = await response.json();

          if (!response.ok) {
              throw new Error(result.error || 'Registration failed');
          }

          // Store user info in session
          sessionStorage.setItem('userId', result.memberId);
          sessionStorage.setItem('userRole', 'member');

          alert("Registration successful! Redirecting to dashboard...");
          window.location.href = "user_dashboard.html";
      } catch (error) {
          console.error("Registration failed:", error);
          alert(error.message || "Something went wrong. Please try again.");
      } finally {
          // Reset button state
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
      }
  });

  // Real-time validation for each input
  const inputs = registerForm.querySelectorAll("input, select");
  inputs.forEach(input => {
      input.addEventListener("input", () => {
          if (input.hasAttribute("required")) {
              const errorDiv = input.nextElementSibling && input.nextElementSibling.classList.contains('error-message')
                  ? input.nextElementSibling
                  : null;
              if (!input.value.trim() || (input.type === "email" && !input.validity.valid) || (input.type === "tel" && !input.validity.valid) || (input.type === "password" && input.value.length < 8)) {
                  input.classList.add("error");
                  if (errorDiv) errorDiv.style.display = "block";
              } else {
                  input.classList.remove("error");
                  if (errorDiv) errorDiv.style.display = "none";
              }
          }
      });
  });

  showStep(currentStep);
});
