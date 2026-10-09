/**
 * ==============================================================================
 * STUDENT HUB - JAVASCRIPT
 * Simple, beginner-friendly interactions for the Student Hub website
 * ==============================================================================
 */

// Wait for the HTML document to fully load before running scripts
document.addEventListener("DOMContentLoaded", () => {
  initMobileNavigation();
  initTaskManager();
  initContactForm();
  initSmoothScrollSpy();
});

/* ==============================================================================
   1. MOBILE NAVIGATION TOGGLE
   Allows mobile users to toggle the menu open and closed
   ============================================================================== */
function initMobileNavigation() {
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");

  if (!navToggle || !navLinks) return;

  // Toggle mobile navigation menu open/close
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

  // Close the mobile menu when any navigation link is clicked
  const links = navLinks.querySelectorAll(".nav-link");
  links.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
    });
  });
}

/* ==============================================================================
   2. ACTIVE LINK HIGHLIGHTING (SCROLL SPY)
   Highlights the current navigation link based on scroll position
   ============================================================================== */
function initSmoothScrollSpy() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    const scrollY = window.pageYOffset;

    sections.forEach((current) => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 100;
      const sectionId = current.getAttribute("id");

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${sectionId}`) {
            link.classList.add("active");
          }
        });
      }
    });
  });
}

/* ==============================================================================
   3. SUBJECT CARDS INTERACTION
   Simple educational alert when exploring a subject
   ============================================================================== */
function showSubjectAlert(subjectName) {
  const tips = {
    "Mathematics": "📐 Math Study Tip: Practice 3-5 problems every day to build lasting problem-solving intuition!",
    "Science": "🔬 Science Study Tip: Connect concepts with real-world observations and draw diagrams for processes!",
    "English": "📖 English Study Tip: Read 20 minutes daily and write concise chapter summaries to enhance comprehension!",
    "Computer Science": "💻 CS Study Tip: Code every day! Break large problems into small, testable functions."
  };

  const message = tips[subjectName] || `Welcome to ${subjectName}! Keep up the great work!`;
  alert(`✨ ${subjectName} Hub\n\n${message}`);
}

/* ==============================================================================
   4. TASK MANAGER
   Simple, complete task manager with Add, Toggle, and Delete
   ============================================================================== */
function initTaskManager() {
  const taskForm = document.getElementById("task-form");
  const taskInput = document.getElementById("task-input");
  const taskList = document.getElementById("task-list");
  const taskCounter = document.getElementById("tasks-remaining");
  const emptyState = document.getElementById("task-empty-state");
  const clearCompletedBtn = document.getElementById("clear-completed-btn");

  if (!taskForm || !taskInput || !taskList) return;

  // Initial starter tasks if none exist
  const defaultTasks = [
    { id: 1, text: "Review Mathematics Chapter 3 notes", completed: false },
    { id: 2, text: "Write English essay outline", completed: true },
    { id: 3, text: "Practice Computer Science coding exercises", completed: false }
  ];

  // Retrieve saved tasks from localStorage or use defaults
  let tasks = loadTasksFromStorage() || defaultTasks;

  // Render tasks on first load
  renderTasks();

  // Add Task Event
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent page reload

    const taskText = taskInput.value.trim();

    // Validation: do not allow empty task
    if (taskText === "") {
      taskInput.focus();
      taskInput.placeholder = "⚠️ Please type a task first!";
      setTimeout(() => {
        taskInput.placeholder = "e.g., Complete Mathematics problem set 4...";
      }, 2000);
      return;
    }

    // Create new task object
    const newTask = {
      id: Date.now(),
      text: taskText,
      completed: false
    };

    tasks.push(newTask);
    saveTasksToStorage(tasks);
    renderTasks();

    // Reset input
    taskInput.value = "";
    taskInput.focus();
  });

  // Clear completed tasks button
  if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener("click", () => {
      tasks = tasks.filter((task) => !task.completed);
      saveTasksToStorage(tasks);
      renderTasks();
    });
  }

  // Render all tasks to the DOM
  function renderTasks() {
    taskList.innerHTML = "";

    if (tasks.length === 0) {
      emptyState.classList.remove("hidden");
    } else {
      emptyState.classList.add("hidden");
    }

    // Create HTML elements for each task
    tasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = `task-item ${task.completed ? "completed" : ""}`;

      // Left area (checkbox + text)
      const leftDiv = document.createElement("div");
      leftDiv.className = "task-item-left";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-checkbox";
      checkbox.checked = task.completed;
      checkbox.setAttribute("aria-label", `Mark "${task.text}" as done`);

      const span = document.createElement("span");
      span.className = "task-text";
      span.textContent = task.text;

      leftDiv.appendChild(checkbox);
      leftDiv.appendChild(span);

      // Toggle completion status on click
      leftDiv.addEventListener("click", () => {
        task.completed = !task.completed;
        saveTasksToStorage(tasks);
        renderTasks();
      });

      // Right area (delete button)
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "task-delete-btn";
      deleteBtn.innerHTML = "🗑️";
      deleteBtn.title = "Delete task";
      deleteBtn.setAttribute("aria-label", `Delete task "${task.text}"`);

      // Delete task on click
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Avoid triggering leftDiv click
        tasks = tasks.filter((t) => t.id !== task.id);
        saveTasksToStorage(tasks);
        renderTasks();
      });

      li.appendChild(leftDiv);
      li.appendChild(deleteBtn);
      taskList.appendChild(li);
    });

    // Update remaining count
    const remaining = tasks.filter((t) => !t.completed).length;
    if (taskCounter) {
      taskCounter.textContent = remaining;
    }
  }

  // Local Storage helper functions
  function saveTasksToStorage(taskListData) {
    try {
      localStorage.setItem("student_hub_tasks", JSON.stringify(taskListData));
    } catch (err) {
      console.warn("Local storage not available:", err);
    }
  }

  function loadTasksFromStorage() {
    try {
      const data = localStorage.getItem("student_hub_tasks");
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.warn("Local storage not available:", err);
      return null;
    }
  }
}

/* ==============================================================================
   5. CONTACT FORM
   Handles client-side validation and friendly user feedback
   ============================================================================== */
function initContactForm() {
  const contactForm = document.getElementById("contact-form");
  const nameInput = document.getElementById("contact-name");
  const emailInput = document.getElementById("contact-email");
  const messageInput = document.getElementById("contact-message");

  const nameError = document.getElementById("name-error");
  const emailError = document.getElementById("email-error");
  const messageError = document.getElementById("message-error");

  const formAlert = document.getElementById("form-alert");
  const alertTitle = document.getElementById("alert-title");
  const alertMessage = document.getElementById("alert-message");

  if (!contactForm) return;

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Do not reload the page

    // Reset error messages
    let isValid = true;
    nameError.textContent = "";
    emailError.textContent = "";
    messageError.textContent = "";

    // 1. Validate Name
    const nameVal = nameInput.value.trim();
    if (nameVal === "") {
      nameError.textContent = "Please enter your name.";
      isValid = false;
    } else if (nameVal.length < 2) {
      nameError.textContent = "Name must be at least 2 characters.";
      isValid = false;
    }

    // 2. Validate Email
    const emailVal = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailVal === "") {
      emailError.textContent = "Please enter your email address.";
      isValid = false;
    } else if (!emailRegex.test(emailVal)) {
      emailError.textContent = "Please enter a valid email (e.g., student@example.com).";
      isValid = false;
    }

    // 3. Validate Message
    const messageVal = messageInput.value.trim();
    if (messageVal === "") {
      messageError.textContent = "Please enter your message.";
      isValid = false;
    } else if (messageVal.length < 10) {
      messageError.textContent = "Message should be at least 10 characters long.";
      isValid = false;
    }

    // If all inputs are valid, show confirmation
    if (isValid) {
      if (formAlert && alertTitle && alertMessage) {
        alertTitle.textContent = `Thank you, ${nameVal}! 🎉`;
        alertMessage.textContent = `Your message has been sent successfully. We will reply to ${emailVal} soon.`;
        formAlert.classList.remove("hidden");

        // Scroll smoothly to alert if needed
        formAlert.scrollIntoView({ behavior: "smooth", block: "nearest" });

        // Auto-hide alert after 8 seconds
        setTimeout(() => {
          formAlert.classList.add("hidden");
        }, 8000);
      }

      // Reset form fields
      contactForm.reset();
    }
  });
}
