/**
 * ==============================================================================
 * STUDENT HUB - STUDENT DASHBOARD CONTROLLER
 * Handles all student actions: Dashboard stats, Subjects, Tasks, Goals,
 * Notes, Study Timer, and Profile
 * ==============================================================================
 */

// Global State for the student session
let studentData = {
  profile: null,
  tasks: [],
  goals: [],
  notes: [],
  subjects: [],
  timerInterval: null,
  timerSeconds: 25 * 60,
  timerTotal: 25 * 60,
  isTimerRunning: false,
  timerSessionsCount: 0
};

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Role Guard Check
  const user = enforceRoleGuard("student");
  if (!user) return;

  // 2. Load local student data
  loadStudentData();

  // 3. Load subjects from MySQL
  await loadSubjectsFromDatabase();
  await loadTasksFromDatabase();
  await loadGoalsFromDatabase();
  await loadNotesFromDatabase();

  // 4. Setup Navigation
  initStudentNavigation();

  // 5. Render Initial Views
  renderOverviewDashboard();
  renderSubjects();
  renderTasks();
  renderGoals();
  renderNotes();
  renderProfile();
  initStudyTimer();
});


/**
 * ==============================================================================
 * LOAD STUDENT DATA
 * ==============================================================================
 */

function loadStudentData() {
  studentData.profile =
    JSON.parse(localStorage.getItem("sh_profile")) || {
      name: "Sai Kiran",
      username: "student",
      email: "student@studenthub.local",
      class: "Grade 11 - Science & Technology",
      studentId: "SH-2026-042",
      bio: "Student interested in science, mathematics, coding, and technology.",
      enrolledSubjects: [
        "Mathematics",
        "Science",
        "English",
        "Computer Science"
      ],
      studyHours: 42
    };

  studentData.tasks =
    JSON.parse(localStorage.getItem("sh_student_tasks")) || [];

  studentData.goals =
    JSON.parse(localStorage.getItem("sh_goals")) || [];

  studentData.notes =
    JSON.parse(localStorage.getItem("sh_notes")) || [];

  studentData.subjects =
    JSON.parse(localStorage.getItem("sh_subjects")) || [];

  // Update topbar name
  const topbarName = document.getElementById("topbar-student-name");

  if (topbarName) {
    topbarName.textContent = studentData.profile.name;
  }
}


/**
 * ==============================================================================
 * LOAD SUBJECTS FROM MYSQL
 * ==============================================================================
 */

async function loadSubjectsFromDatabase() {
  try {
    const response = await fetch("/api/subjects");

    if (!response.ok) {
      throw new Error("Failed to load subjects");
    }

    const subjects = await response.json();

    studentData.subjects = subjects.map((sub) => ({
      id: sub.id,
      name: sub.name,
      code: sub.code,
      teacher: sub.teacher,
      enrolled: sub.enrolled_students,
      icon: sub.icon,
      description: sub.description
    }));

    // Optional local cache
    localStorage.setItem(
      "sh_subjects",
      JSON.stringify(studentData.subjects)
    );

    console.log("Subjects loaded from MySQL:", studentData.subjects);

  } catch (error) {
    console.error("Error loading subjects from MySQL:", error);

    // If database request fails, keep any cached subjects
    if (studentData.subjects.length === 0) {
      console.warn("No subjects available.");
    }
  }
}


/**
 * ==============================================================================
 * NAVIGATION
 * ==============================================================================
 */

function initStudentNavigation() {
  const navBtns = document.querySelectorAll(
    ".nav-item-btn[data-tab]"
  );

  const tabPanes = document.querySelectorAll(".tab-pane");

  const pageTitle =
    document.getElementById("current-page-title");

  const menuToggle =
    document.getElementById("menu-toggle-btn");

  const sidebarClose =
    document.getElementById("sidebar-close-btn");

  const sidebar =
    document.getElementById("student-sidebar");

  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");

      switchTab(targetTab);

      if (sidebar) {
        sidebar.classList.remove("active");
      }
    });
  });

  // Mobile sidebar
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.add("active");
    });
  }

  if (sidebarClose && sidebar) {
    sidebarClose.addEventListener("click", () => {
      sidebar.classList.remove("active");
    });
  }

  // Logout
  const logoutBtn =
    document.getElementById("student-logout-btn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logoutUser);
  }

  // URL hash navigation
  const currentHash =
    window.location.hash.replace("#", "");

  if (
    currentHash &&
    document.getElementById(`tab-${currentHash}`)
  ) {
    switchTab(currentHash);
  }
}


function switchTab(tabId) {
  const navBtns =
    document.querySelectorAll(".nav-item-btn[data-tab]");

  const tabPanes =
    document.querySelectorAll(".tab-pane");

  const pageTitle =
    document.getElementById("current-page-title");

  navBtns.forEach((btn) => {
    if (btn.getAttribute("data-tab") === tabId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  tabPanes.forEach((pane) => {
    if (pane.id === `tab-${tabId}`) {
      pane.classList.add("active");
    } else {
      pane.classList.remove("active");
    }
  });

  const titles = {
    dashboard: "Student Dashboard",
    subjects: "My Subjects",
    tasks: "My Tasks",
    goals: "Study Goals",
    notes: "Study Notes",
    timer: "Focus Study Timer",
    profile: "Student Profile"
  };

  if (pageTitle && titles[tabId]) {
    pageTitle.textContent = titles[tabId];
  }

  window.location.hash = tabId;

  if (tabId === "dashboard") {
    renderOverviewDashboard();
  }
}


/**
 * ==============================================================================
 * DASHBOARD OVERVIEW
 * ==============================================================================
 */

function renderOverviewDashboard() {
  const totalTasks =
    studentData.tasks.length;

  const completedTasks =
    studentData.tasks.filter(
      (t) => t.completed
    ).length;

  const activeGoals =
    studentData.goals.filter(
      (g) => !g.completed
    ).length;

  const totalNotes =
    studentData.notes.length;

  const totalTasksElem =
    document.getElementById("dash-total-tasks");

  const completedTasksElem =
    document.getElementById("dash-completed-tasks");

  const activeGoalsElem =
    document.getElementById("dash-active-goals");

  const totalNotesElem =
    document.getElementById("dash-total-notes");

  if (totalTasksElem) {
    totalTasksElem.textContent = totalTasks;
  }

  if (completedTasksElem) {
    completedTasksElem.textContent = completedTasks;
  }

  if (activeGoalsElem) {
    activeGoalsElem.textContent = activeGoals;
  }

  if (totalNotesElem) {
    totalNotesElem.textContent = totalNotes;
  }

  // Overall progress
  const progressPercent =
    totalTasks > 0
      ? Math.round(
          (completedTasks / totalTasks) * 100
        )
      : 0;

  const progressFill =
    document.getElementById(
      "dash-overall-progress-fill"
    );

  const progressText =
    document.getElementById(
      "dash-overall-progress-text"
    );

  if (progressFill) {
    progressFill.style.width =
      `${progressPercent}%`;
  }

  if (progressText) {
    progressText.textContent =
      `${progressPercent}%`;
  }

  // Upcoming tasks
  const miniTaskList =
    document.getElementById("dash-mini-tasks");

  if (miniTaskList) {
    miniTaskList.innerHTML = "";

    const pendingTasks =
      studentData.tasks
        .filter((t) => !t.completed)
        .slice(0, 3);

    if (pendingTasks.length === 0) {
      miniTaskList.innerHTML =
        `<p style="color:#64748b;font-size:0.9rem;">
          No pending tasks right now. Great job! 🎉
        </p>`;
    } else {
      pendingTasks.forEach((task) => {
        const item =
          document.createElement("div");

        item.style.cssText =
          "display:flex;justify-content:space-between;" +
          "padding:0.65rem 0;" +
          "border-bottom:1px solid #f1f5f9;" +
          "font-size:0.9rem;";

        item.innerHTML = `
          <span>📌 ${escapeHtml(task.text)}</span>
          <span style="color:#2563eb;font-weight:600;">
            ${escapeHtml(task.subject || "General")}
          </span>
        `;

        miniTaskList.appendChild(item);
      });
    }
  }

  // Goals preview
  const miniGoalsList =
    document.getElementById("dash-mini-goals");

  if (miniGoalsList) {
    miniGoalsList.innerHTML = "";

    const uncompletedGoals =
      studentData.goals
        .filter((g) => !g.completed)
        .slice(0, 3);

    if (uncompletedGoals.length === 0) {
      miniGoalsList.innerHTML =
        `<p style="color:#64748b;font-size:0.9rem;">
          All study goals completed! Set a new goal below. 🚀
        </p>`;
    } else {
      uncompletedGoals.forEach((goal) => {
        const pct =
          goal.target > 0
            ? Math.round(
                (goal.current / goal.target) * 100
              )
            : 0;

        const item =
          document.createElement("div");

        item.style.cssText =
          "padding:0.5rem 0;" +
          "border-bottom:1px solid #f1f5f9;";

        item.innerHTML = `
          <div style="
            display:flex;
            justify-content:space-between;
            font-size:0.85rem;
            font-weight:600;
            margin-bottom:0.25rem;
          ">
            <span>${escapeHtml(goal.title)}</span>
            <span>${pct}%</span>
          </div>

          <div class="progress-track" style="height:6px;">
            <div
              class="progress-fill"
              style="width:${pct}%;">
            </div>
          </div>
        `;

        miniGoalsList.appendChild(item);
      });
    }
  }
}


/**
 * ==============================================================================
 * SUBJECTS
 * ==============================================================================
 */

function renderSubjects() {
  const grid =
    document.getElementById(
      "student-subjects-grid"
    );

  if (!grid) return;

  grid.innerHTML = "";

  if (studentData.subjects.length === 0) {
    grid.innerHTML = `
      <div class="task-empty-state">
        <span class="empty-icon">📚</span>
        <p>No subjects found.</p>
      </div>
    `;

    return;
  }

  studentData.subjects.forEach((sub) => {
    const card =
      document.createElement("div");

    card.className = "subject-card";
    card.style.margin = "0";

    card.innerHTML = `
      <div class="subject-icon">
        ${sub.icon || "📚"}
      </div>

      <span class="subject-badge">
        ${escapeHtml(sub.code || "SUB101")}
      </span>

      <h3 class="subject-title">
        ${escapeHtml(sub.name)}
      </h3>

      <p class="subject-description">
        ${escapeHtml(
          sub.description ||
          "Comprehensive subject study curriculum."
        )}
      </p>

      <div style="
        font-size:0.85rem;
        color:#64748b;
        margin-bottom:1.25rem;
      ">
        <div>
          <strong>Instructor:</strong>
          ${escapeHtml(sub.teacher || "Faculty")}
        </div>

        <div>
          <strong>Students Enrolled:</strong>
          ${sub.enrolled || 0}
        </div>
      </div>

      <button
        class="subject-btn"
        onclick="openSubjectStudyHelper('${escapeHtml(sub.name)}')">
        View Study Tips
      </button>
    `;

    grid.appendChild(card);
  });
}


function openSubjectStudyHelper(subjectName) {
  const tips = {
    Mathematics:
      "Focus on problem solving: solve at least 3 practice problems per study session without looking at the solutions first.",

    Science:
      "Draw flowcharts and diagrams for processes, and write down key formulas on index cards.",

    English:
      "Annotate key literary themes, look up unfamiliar words, and summarize each chapter in two sentences.",

    "Computer Science":
      "Write code by hand on paper before typing it. Practice debugging with small sample test inputs.",

    History:
      "Create a visual timeline with cause-and-effect connectors for major historical events.",

    Geography:
      "Practice blank map identification and memorize tectonic plate boundaries."
  };

  const advice =
    tips[subjectName] ||
    "Stay consistent with daily 20-minute focused review sessions.";

  alert(
    `📚 ${subjectName} Study Guide\n\nTip: ${advice}`
  );
}


/**
 * ==============================================================================
 * TASKS
 * ==============================================================================
 */

function renderTasks() {
  const taskList =
    document.getElementById(
      "student-task-list"
    );

  const taskCount =
    document.getElementById(
      "student-task-counter"
    );

  const emptyState =
    document.getElementById(
      "student-task-empty"
    );

  if (!taskList) return;

  taskList.innerHTML = "";

  if (studentData.tasks.length === 0) {
    if (emptyState) {
      emptyState.classList.remove("hidden");
    }
  } else {
    if (emptyState) {
      emptyState.classList.add("hidden");
    }
  }

  studentData.tasks.forEach((task) => {
    const li =
      document.createElement("li");

    li.className =
      `task-item ${
        task.completed ? "completed" : ""
      }`;

    const left =
      document.createElement("div");

    left.className =
      "task-item-left";

    const cb =
      document.createElement("input");

    cb.type = "checkbox";
    cb.className = "task-checkbox";
    cb.checked = task.completed;

    const contentDiv =
      document.createElement("div");

    contentDiv.innerHTML = `
      <div class="task-text">
        ${escapeHtml(task.text)}
      </div>

      <div style="
        font-size:0.75rem;
        color:#64748b;
        margin-top:2px;
      ">
        <span style="
          background:#e2e8f0;
          padding:1px 6px;
          border-radius:4px;
          font-weight:600;
        ">
          ${escapeHtml(
            task.subject || "General"
          )}
        </span>

        ${
          task.dueDate
            ? `• Due: ${escapeHtml(task.dueDate)}`
            : ""
        }
      </div>
    `;

    left.appendChild(cb);
    left.appendChild(contentDiv);

    left.addEventListener("click", async () => {
  const newCompleted = !task.completed;

  try {
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        is_completed: newCompleted
      })
    });

    if (!response.ok) {
      throw new Error("Failed to update task");
    }

    task.completed = newCompleted;

    renderTasks();
    renderOverviewDashboard();

  } catch (error) {
    console.error("Error updating task:", error);
    alert("Could not update the task.");
  }
});

    const delBtn =
      document.createElement("button");

    delBtn.className =
      "task-delete-btn";

    delBtn.innerHTML = "🗑️";
    delBtn.title = "Delete task";

    
delBtn.addEventListener("click", async (e) => {
  e.stopPropagation();

  try {
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      throw new Error("Failed to delete task");
    }

    studentData.tasks = studentData.tasks.filter(
      (t) => t.id !== task.id
    );

    renderTasks();
    renderOverviewDashboard();

  } catch (error) {
    console.error("Error deleting task:", error);
    alert("Could not delete the task.");
  }
});

    li.appendChild(left);
    li.appendChild(delBtn);

    taskList.appendChild(li);
  });

  const remaining =
    studentData.tasks.filter(
      (t) => !t.completed
    ).length;

  if (taskCount) {
    taskCount.textContent = remaining;
  }
}


function saveStudentTasks() {
  localStorage.setItem(
    "sh_student_tasks",
    JSON.stringify(studentData.tasks)
  );
}




async function loadGoalsFromDatabase() {
  try {
    const response = await fetch("/api/goals", {
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error("Failed to load goals");
    }

    const goals = await response.json();

    studentData.goals = goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      subject:
        studentData.subjects.find(
          (s) => s.id === goal.subject_id
        )?.name || "General",
      subjectId: goal.subject_id,
      targetDate: goal.target_date
        ? String(goal.target_date).split("T")[0]
        : "",
      current: Number(goal.current_units) || 0,
      target: Number(goal.target_units) || 10,
      completed: Boolean(goal.is_completed)
    }));

    renderGoals();
    renderOverviewDashboard();

    
console.log("Goals loaded from MySQL:", studentData.goals);

} catch (error) {
  console.error("Error loading goals:", error);
  alert("Goals error: " + error.message);
}

}


async function loadTasksFromDatabase() {
  try {
    const response = await fetch("/api/tasks", {
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error("Failed to load tasks");
    }

    const tasks = await response.json();

    studentData.tasks = tasks.map((task) => ({
      id: task.id,
      text: task.title,
      subject: task.subject || "General",
      subjectId: task.subject_id,
      dueDate: task.due_date
        ? String(task.due_date).split("T")[0]
        : "",
      completed: Boolean(task.is_completed)
    }));

    renderTasks();
    renderOverviewDashboard();

    console.log("Tasks loaded from MySQL:", studentData.tasks);

  } catch (error) {
    console.error("Error loading tasks:", error);
  }
}


// Student Task Form
const studentTaskForm =
  document.getElementById(
    "student-task-form"
  );

if (studentTaskForm) {
  studentTaskForm.addEventListener(
    "submit",
    async (e) => {
      e.preventDefault();

      const input =
        document.getElementById(
          "student-task-input"
        );

      const subjectSelect =
        document.getElementById(
          "student-task-subject"
        );

      const dueDateInput =
        document.getElementById(
          "student-task-date"
        );

      const text =
        input.value.trim();

      if (!text) {
        return;
      }

      // Get logged-in student
      // Get logged-in student
const user = getCurrentUser();

if (!user) {
  alert("Student login information was not found.");
  return;
}

user.id = 2;

      // Find subject ID from MySQL subject list
      let subjectId = null;

      if (
        subjectSelect &&
        subjectSelect.value
      ) {
        const selectedSubject =
          studentData.subjects.find(
            (subject) =>
              subject.name ===
              subjectSelect.value
          );

        if (selectedSubject) {
          subjectId =
            selectedSubject.id;
        }
      }

      try {
        // Send task to backend
        const response =
          await fetch(
            "/api/tasks",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                user_id: user.id,
                subject_id: subjectId,
                title: text,
                due_date:
                  dueDateInput &&
                  dueDateInput.value
                    ? dueDateInput.value
                    : null
              })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to create task"
          );
        }

        // Add returned database task to screen
        const newTask = {
          id: data.id,
          text: data.title,
          subject:
            data.subject ||
            subjectSelect?.value ||
            "General",
          subjectId:
            data.subject_id,
          dueDate:
            data.due_date
              ? String(
                  data.due_date
                ).split("T")[0]
              : "",
          completed:
            Boolean(
              data.is_completed
            )
        };

        studentData.tasks.unshift(
          newTask
        );

        renderTasks();
        renderOverviewDashboard();

        // Clear form
        input.value = "";

        if (dueDateInput) {
          dueDateInput.value = "";
        }

        input.focus();

        console.log(
          "Task saved to MySQL:",
          newTask
        );

      } catch (error) {
        console.error(
          "Error creating task:",
          error
        );

        alert(
          "Could not save task to the database."
        );
      }
    }
  );
}




/**
 * ==============================================================================
 * STUDY GOALS
 * ==============================================================================
 */

function renderGoals() {
  const list =
    document.getElementById(
      "student-goals-list"
    );

  if (!list) return;

  list.innerHTML = "";

  if (studentData.goals.length === 0) {
    list.innerHTML = `
      <div class="task-empty-state">
        <span class="empty-icon">🎯</span>
        <p>
          No study goals set yet!
          Add your first goal below.
        </p>
      </div>
    `;

    return;
  }

  studentData.goals.forEach((goal) => {
    const pct =
      goal.target > 0
        ? Math.min(
            100,
            Math.round(
              (goal.current / goal.target) * 100
            )
          )
        : 0;

    const card =
      document.createElement("div");

    card.className =
      `goal-card ${
        goal.completed ? "completed" : ""
      }`;

    card.innerHTML = `
      <div class="goal-info">

        <div class="goal-title">
          ${
            goal.completed
              ? "✅ "
              : ""
          }

          ${escapeHtml(goal.title)}
        </div>

        <div class="goal-meta">

          <span>
            📚 ${escapeHtml(
              goal.subject || "General"
            )}
          </span>

          <span>
            📅 Target:
            ${escapeHtml(
              goal.targetDate || "No date"
            )}
          </span>

          <span>
            📊 Progress:
            <strong>
              ${goal.current} /
              ${goal.target}
              (${pct}%)
            </strong>
          </span>

        </div>

        <div
          class="progress-track"
          style="margin-top:0.65rem;"
        >
          <div
            class="progress-fill ${
              pct === 100
                ? "green"
                : ""
            }"
            style="width:${pct}%;"
          ></div>
        </div>

      </div>

      <div class="goal-actions">

        <button
          class="btn-sm btn-view"
          onclick="updateGoalProgress(${goal.id}, 5)"
        >
          +5
        </button>

        <button
          class="btn-sm btn-edit"
          onclick="toggleGoalComplete(${goal.id})"
        >
          ${
            goal.completed
              ? "Reopen"
              : "Done"
          }
        </button>

        <button
          class="btn-sm btn-delete"
          onclick="deleteGoal(${goal.id})"
        >
          Delete
        </button>

      </div>
    `;

    list.appendChild(card);
  });
}


function saveStudentGoals() {
  localStorage.setItem(
    "sh_goals",
    JSON.stringify(studentData.goals)
  );
}



async function updateGoalProgress(goalId, amount) {
  const goal = studentData.goals.find(
    (g) => g.id === goalId
  );
  if (!goal) return;

  const newCurrent = Math.min(
    goal.target,
    goal.current + amount
  );
  const completed = newCurrent >= goal.target;

  try {
    const response = await fetch(`/api/goals/${goalId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_units: newCurrent,
        is_completed: completed
      })
    });

    if (!response.ok) {
      throw new Error("Failed to update goal progress");
    }

    goal.current = newCurrent;
    goal.completed = completed;

    saveStudentGoals();
    renderGoals();
    renderOverviewDashboard();
  } catch (error) {
    console.error("Error updating goal:", error);
    alert("Could not save goal progress to MySQL.");
  }
}

async function toggleGoalComplete(goalId) {
  const goal = studentData.goals.find(
    (g) => g.id === goalId
  );
  if (!goal) return;

  const completed = !goal.completed;
  const current = completed ? goal.target : goal.current;

  try {
    const response = await fetch(`/api/goals/${goalId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_units: current,
        is_completed: completed
      })
    });

    if (!response.ok) {
      throw new Error("Failed to update goal");
    }

    goal.completed = completed;
    goal.current = current;

    saveStudentGoals();
    renderGoals();
    renderOverviewDashboard();
  } catch (error) {
    console.error("Error completing goal:", error);
    alert("Could not save goal status to MySQL.");
  }
}

async function deleteGoal(goalId) {
  try {
    const response = await fetch(`/api/goals/${goalId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      throw new Error("Failed to delete goal");
    }

    studentData.goals = studentData.goals.filter(
      (g) => g.id !== goalId
    );

    saveStudentGoals();
    renderGoals();
    renderOverviewDashboard();
  } catch (error) {
    console.error("Error deleting goal:", error);
    alert("Could not delete goal from MySQL.");
  }
}



 // Add Goal Form
const addGoalForm = document.getElementById("add-goal-form");

if (addGoalForm) {
  addGoalForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titleInput = document.getElementById("goal-title-input");
    const subjectSelect = document.getElementById("goal-subject-select");
    const targetInput = document.getElementById("goal-target-input");
    const dateInput = document.getElementById("goal-date-input");

    const title = titleInput.value.trim();
    const target = parseInt(targetInput.value, 10) || 10;

    if (!title) return;

    const selectedSubject = studentData.subjects.find(
      (subject) => subject.name === subjectSelect?.value
    );

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: 2,
          subject_id: selectedSubject?.id || null,
          title,
          target_date: dateInput?.value || null,
          target_units: target
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create goal");
      }

      // Reload goals from MySQL
      await loadGoalsFromDatabase();

      titleInput.value = "";
      targetInput.value = "10";
      if (dateInput) dateInput.value = "";

      alert("Study goal saved to MySQL!");
    } catch (error) {
      console.error("Error creating goal:", error);
      alert("Could not save study goal to the database.");
    }
  });
}


/**
 * ==============================================================================
 * STUDY NOTES
 * ==============================================================================
 */



async function loadNotesFromDatabase() {
  try {
    const response = await fetch("/api/notes", {
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error("Failed to load notes");
    }

    const notes = await response.json();

    studentData.notes = notes.map((note) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      subject: note.subject || "General",
      subjectId: note.subject_id,
      date: note.created_at
        ? new Date(note.created_at).toLocaleDateString()
        : "Recent"
    }));

    renderNotes();
    renderOverviewDashboard();
  } catch (error) {
    console.error("Error loading notes:", error);
  }
}


function renderNotes() {
  const grid =
    document.getElementById(
      "student-notes-grid"
    );

  if (!grid) return;

  grid.innerHTML = "";

  if (studentData.notes.length === 0) {
    grid.innerHTML = `
      <div
        class="task-empty-state"
        style="grid-column:1/-1;"
      >
        <span class="empty-icon">📝</span>
        <p>
          No study notes yet.
          Create your first note below!
        </p>
      </div>
    `;

    return;
  }

  studentData.notes.forEach((note) => {
    const card =
      document.createElement("div");

    card.className =
      "note-card";

    card.innerHTML = `
      <div class="note-header">

        <span class="note-subject">
          ${escapeHtml(
            note.subject || "General"
          )}
        </span>

        
        <div class="note-actions">
          <button
            class="btn-sm btn-edit"
            onclick="editNote(${note.id})"
            title="Edit Note"
          >
            Edit
          </button>

          <button
            class="btn-sm btn-delete"
            onclick="deleteNote(${note.id})"
            title="Delete Note"
          >
            ✕
          </button>
        </div>

      </div>

      <h4 class="note-title">
        ${escapeHtml(note.title)}
      </h4>

      <div class="note-content">
        ${escapeHtml(note.content)}
      </div>

      <div class="note-footer">
        <span>
          📅 ${escapeHtml(
            note.date || "Recent"
          )}
        </span>
      </div>
    `;

    grid.appendChild(card);
  });
}


function saveStudentNotes() {
  localStorage.setItem(
    "sh_notes",
    JSON.stringify(studentData.notes)
  );
}





// Add Note Form

const addNoteForm = document.getElementById("add-note-form");

if (addNoteForm) {
  addNoteForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titleInput = document.getElementById("note-title-input");
    const subjectSelect = document.getElementById("note-subject-select");
    const contentInput = document.getElementById("note-content-input");

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !content) return;

    const selectedSubject = studentData.subjects.find(
      (s) => s.name === subjectSelect?.value
    );

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: 2,
          subject_id: selectedSubject?.id || null,
          title,
          content
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      await loadNotesFromDatabase();

      titleInput.value = "";
      contentInput.value = "";

      alert("Note saved to MySQL!");
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Could not save note to MySQL.");
    }
  });
}
     


/**
 * ==============================================================================
 * STUDY TIMER
 * ==============================================================================
 */

function initStudyTimer() {
  const display =
    document.getElementById(
      "timer-display"
    );

  const startBtn =
    document.getElementById(
      "timer-start-btn"
    );

  const resetBtn =
    document.getElementById(
      "timer-reset-btn"
    );

  const modeButtons =
    document.querySelectorAll(
      ".timer-mode-btn"
    );

  if (
    !display ||
    !startBtn ||
    !resetBtn
  ) {
    return;
  }

  function updateDisplay() {
    const mins =
      Math.floor(
        studentData.timerSeconds / 60
      );

    const secs =
      studentData.timerSeconds % 60;

    display.textContent =
      `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  modeButtons.forEach((btn) => {
    btn.addEventListener(
      "click",
      () => {
        modeButtons.forEach(
          (b) =>
            b.classList.remove(
              "active"
            )
        );

        btn.classList.add("active");

        const minutes =
          parseInt(
            btn.getAttribute(
              "data-mins"
            )
          ) || 25;

        clearInterval(
          studentData.timerInterval
        );

        studentData.isTimerRunning =
          false;

        studentData.timerSeconds =
          minutes * 60;

        studentData.timerTotal =
          minutes * 60;

        startBtn.textContent =
          "Start Session";

        startBtn.classList.remove(
          "btn-timer-secondary"
        );

        startBtn.classList.add(
          "btn-timer-primary"
        );

        updateDisplay();
      }
    );
  });

  startBtn.addEventListener(
    "click",
    () => {
      if (
        studentData.isTimerRunning
      ) {
        clearInterval(
          studentData.timerInterval
        );

        studentData.isTimerRunning =
          false;

        startBtn.textContent =
          "Resume";

      } else {
        studentData.isTimerRunning =
          true;

        startBtn.textContent =
          "Pause";

        studentData.timerInterval =
          setInterval(() => {

            if (
              studentData.timerSeconds >
              0
            ) {
              studentData.timerSeconds--;

              updateDisplay();

            } else {
              clearInterval(
                studentData.timerInterval
              );

              studentData.isTimerRunning =
                false;

              startBtn.textContent =
                "Start Session";

              studentData.timerSessionsCount++;

              const sessionBadge =
                document.getElementById(
                  "timer-session-count"
                );

              if (sessionBadge) {
                sessionBadge.textContent =
                  `${studentData.timerSessionsCount} sessions completed today`;
              }

              alert(
                "⏰ Great job! Your study session is complete. Take a well-deserved short break!"
              );
            }

          }, 1000);
      }
    }
  );

  resetBtn.addEventListener(
    "click",
    () => {
      clearInterval(
        studentData.timerInterval
      );

      studentData.isTimerRunning =
        false;

      studentData.timerSeconds =
        studentData.timerTotal;

      startBtn.textContent =
        "Start Session";

      updateDisplay();
    }
  );

  updateDisplay();
}


/**
 * ==============================================================================
 * PROFILE
 * ==============================================================================
 */

function renderProfile() {
  const prof =
    studentData.profile;

  if (!prof) return;

  const nameElem =
    document.getElementById(
      "profile-display-name"
    );

  const usernameElem =
    document.getElementById(
      "profile-display-username"
    );

  const emailElem =
    document.getElementById(
      "profile-display-email"
    );

  const classElem =
    document.getElementById(
      "profile-display-class"
    );

  const idElem =
    document.getElementById(
      "profile-display-id"
    );

  const bioElem =
    document.getElementById(
      "profile-display-bio"
    );

  if (nameElem) {
    nameElem.textContent =
      prof.name;
  }

  if (usernameElem) {
    usernameElem.textContent =
      prof.username;
  }

  if (emailElem) {
    emailElem.textContent =
      prof.email;
  }

  if (classElem) {
    classElem.textContent =
      prof.class;
  }

  if (idElem) {
    idElem.textContent =
      prof.studentId;
  }

  if (bioElem) {
    bioElem.textContent =
      prof.bio;
  }

  const nameInput =
    document.getElementById(
      "edit-profile-name"
    );

  const emailInput =
    document.getElementById(
      "edit-profile-email"
    );

  const bioInput =
    document.getElementById(
      "edit-profile-bio"
    );

  if (nameInput) {
    nameInput.value =
      prof.name;
  }

  if (emailInput) {
    emailInput.value =
      prof.email;
  }

  if (bioInput) {
    bioInput.value =
      prof.bio;
  }

  const subContainer =
    document.getElementById(
      "profile-enrolled-subjects"
    );

  if (
    subContainer &&
    prof.enrolledSubjects
  ) {
    subContainer.innerHTML = "";

    prof.enrolledSubjects.forEach(
      (subName) => {
        const span =
          document.createElement(
            "span"
          );

        span.className =
          "topic-pill";

        span.style.cssText =
          "background:#eff6ff;color:#2563eb;font-weight:600;";

        span.textContent =
          `✓ ${subName}`;

        subContainer.appendChild(
          span
        );
      }
    );
  }
}


// Profile Save Form
const profileForm =
  document.getElementById(
    "profile-edit-form"
  );

if (profileForm) {
  profileForm.addEventListener(
    "submit",
    (e) => {
      e.preventDefault();

      const nameInput =
        document.getElementById(
          "edit-profile-name"
        );

      const emailInput =
        document.getElementById(
          "edit-profile-email"
        );

      const bioInput =
        document.getElementById(
          "edit-profile-bio"
        );

      studentData.profile.name =
        nameInput.value.trim() ||
        studentData.profile.name;

      studentData.profile.email =
        emailInput.value.trim() ||
        studentData.profile.email;

      studentData.profile.bio =
        bioInput.value.trim() ||
        studentData.profile.bio;

      localStorage.setItem(
        "sh_profile",
        JSON.stringify(
          studentData.profile
        )
      );

      renderProfile();

      const topbarName =
        document.getElementById(
          "topbar-student-name"
        );

      if (topbarName) {
        topbarName.textContent =
          studentData.profile.name;
      }

      alert(
        "✅ Profile updated successfully!"
      );
    }
  );
}


/**
 * ==============================================================================
 * UTILITY
 * ==============================================================================
 */

function escapeHtml(text) {
  if (!text) return "";

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}




async function editNote(noteId) {
  const note = studentData.notes.find(
    (n) => Number(n.id) === Number(noteId)
  );

  if (!note) {
    alert("Note not found.");
    return;
  }

  const title = prompt("Edit note title:", note.title);
  if (title === null) return;

  const content = prompt("Edit note content:", note.content);
  if (content === null) return;

  try {
    const response = await fetch(`/api/notes/${noteId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: 2,
        subject_id: note.subjectId || null,
        title: title.trim(),
        content: content.trim()
      })
    });

    if (!response.ok) {
      throw new Error("Failed to update note");
    }

    alert("Note updated successfully!");
    await loadNotesFromDatabase();
  } catch (error) {
    console.error("Error editing note:", error);
    alert("Could not update note. Please check the server.");
  }
}

window.editNote = editNote;