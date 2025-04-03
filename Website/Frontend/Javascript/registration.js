document.addEventListener("DOMContentLoaded", function () {
    const steps = document.querySelectorAll(".form-step");
    const nextBtns = document.querySelectorAll(".next");
    const prevBtns = document.querySelectorAll(".prev");
    const progressBar = document.getElementById("progress-bar");
  
    let currentStep = 0;
  
    function showStep(index) {
      steps.forEach((step, i) => {
        step.classList.toggle("active", i === index);
      });
      progressBar.textContent = `Step ${index + 1} of ${steps.length}`;
    }
  
    nextBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        if (currentStep < steps.length - 1) {
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
  
    showStep(currentStep);
  });
  