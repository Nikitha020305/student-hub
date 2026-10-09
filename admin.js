/**
 * ==============================================================================
 * STUDENT HUB - ADMIN DASHBOARD CONTROLLER
 * Handles all Administrator operations:
 * - Overview Statistics & Analytics
 * - Manage Students (CRUD: View, Add, Edit, Delete)
 * - Manage Subjects (CRUD: View, Add, Edit, Delete)
 * - Manage Tasks (CRUD: View, Add, Edit, Delete)
 * - Visual Charts & Analytics (Pure CSS/HTML)
 * - Platform Settings & Demo Reset
 * ==============================================================================
 */

// Global state for Admin
let adminData = {
  students: [],
  subjects: [],
  tasks: [],
  editingStudentId: null,
  editingSubjectId: null,
  editingTaskId: null
};

document.addEventListener("DOMContentLoaded", () => {
  // 1. Role Guard Check: Ensure current user is an Admin
  const user = enforceRoleGuard("admin");
  if (!user) return;

  // 2. Load Data from localStorage
  loadAdminData();

  // 3. Setup Navigation & Shell Controls
  initAdminNavigation();

  // 4. Render Initial Views
  renderAdminOverview();
  renderStudentsTable();
  renderSubjectsList();
  renderAdminTasksTable();
  renderStatisticsCharts();
  initModalListeners();
});

/**
 * Load all Admin dataset from localStorage
 */
function loadAdminData() {
  adminData.students = JSON.parse(localStorage.getItem("sh_students")) || [];
  adminData.subjects = JSON.parse(localStorage.getItem("sh_subjects")) || [];
  adminData.tasks = JSON.parse(localStorage.getItem("sh_admin_tasks")) || [];
}

/**
 * Tab Navigation for Admin Shell
 */
function initAdminNavigation() {
  const navBtns = document.querySelectorAll(".nav-item-btn[data-tab]");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const pageTitle = document.getElementById("admin-page-title");
  const menuToggle = document.getElementById("admin-menu-toggle-btn");
  const sidebarClose = document.getElementById("admin-sidebar-close-btn");
  const sidebar = document.getElementById("admin-sidebar");

  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      switchAdminTab(targetTab);

      if (sidebar) sidebar.classList.remove("active");
    });
  });

  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => sidebar.classList.add("active"));
  }
  if (sidebarClose && sidebar) {
    sidebarClose.addEventListener("click", () => sidebar.classList.remove("active"));
  }

  // Logout button
  const logoutBtn = document.getElementById("admin-logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logoutUser);
  }

  // Check URL hash
  const currentHash = window.location.hash.replace("#", "");
  if (currentHash && document.getElementById(`tab-${currentHash}`)) {
    switchAdminTab(currentHash);
  }
}

function switchAdminTab(tabId) {
  const navBtns = document.querySelectorAll(".nav-item-btn[data-tab]");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const pageTitle = document.getElementById("admin-page-title");

  navBtns.forEach((b) => {
    if (b.getAttribute("data-tab") === tabId) {
      b.classList.add("active");
    } else {
      b.classList.remove("active");
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
    dashboard: "Admin Dashboard",
    students: "Manage Students",
    subjects: "Manage Subjects",
    tasks: "Manage Assigned Tasks",
    statistics: "Institutional Statistics",
    settings: "System Settings"
  };
  if (pageTitle && titles[tabId]) {
    pageTitle.textContent = titles[tabId];
  }

  window.location.hash = tabId;

  // Re-render when switching
  if (tabId === "dashboard") renderAdminOverview();
  if (tabId === "statistics") renderStatisticsCharts();
}

/* ==============================================================================
   1. ADMIN DASHBOARD OVERVIEW & STATS
   ============================================================================== */
function renderAdminOverview() {
  const totalStudents = adminData.students.length;
  const totalSubjects = adminData.subjects.length;
  const totalTasks = adminData.tasks.length;
  const completedTasks = adminData.tasks.filter((t) => t.status === "Completed").length;

  // Calculate average student progress
  const totalProgSum = adminData.students.reduce((acc, s) => acc + (s.progress || 0), 0);
  const avgProgress = totalStudents > 0 ? Math.round(totalProgSum / totalStudents) : 0;

  // Update DOM elements
  const elTotalStudents = document.getElementById("stat-total-students");
  const elTotalSubjects = document.getElementById("stat-total-subjects");
  const elTotalTasks = document.getElementById("stat-total-tasks");
  const elCompletedTasks = document.getElementById("stat-completed-tasks");
  const elOverallProgress = document.getElementById("stat-overall-progress");

  if (elTotalStudents) elTotalStudents.textContent = totalStudents;
  if (elTotalSubjects) elTotalSubjects.textContent = totalSubjects;
  if (elTotalTasks) elTotalTasks.textContent = totalTasks;
  if (elCompletedTasks) elCompletedTasks.textContent = completedTasks;
  if (elOverallProgress) elOverallProgress.textContent = `${avgProgress}%`;

  // Mini preview tables on dashboard overview
  renderMiniOverviewTables();
}

function renderMiniOverviewTables() {
  const recentStudentsList = document.getElementById("dash-recent-students");
  if (recentStudentsList) {
    recentStudentsList.innerHTML = "";
    adminData.students.slice(0, 4).forEach((s) => {
      const row = document.createElement("div");
      row.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem;";
      row.innerHTML = `
        <div>
          <strong>${escapeHtml(s.name)}</strong>
          <span style="color: #64748b; font-size: 0.8rem; display: block;">${escapeHtml(s.class)}</span>
        </div>
        <span class="badge ${s.status === "Active" ? "badge-active" : "badge-inactive"}">${escapeHtml(s.status)}</span>
      `;
      recentStudentsList.appendChild(row);
    });
  }

  const recentTasksList = document.getElementById("dash-recent-tasks");
  if (recentTasksList) {
    recentTasksList.innerHTML = "";
    adminData.tasks.slice(0, 4).forEach((t) => {
      const row = document.createElement("div");
      row.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem;";
      row.innerHTML = `
        <div style="max-width: 65%;">
          <strong style="display: block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${escapeHtml(t.task)}</strong>
          <span style="color: #64748b; font-size: 0.8rem;">${escapeHtml(t.student)} • ${escapeHtml(t.subject)}</span>
        </div>
        <span class="badge badge-${t.status.toLowerCase().replace(" ", "")}">${escapeHtml(t.status)}</span>
      `;
      recentTasksList.appendChild(row);
    });
  }
}

/* ==============================================================================
   2. MANAGE STUDENTS
   ============================================================================== */
function renderStudentsTable(filterText = "") {
  const tbody = document.getElementById("students-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";
  const filtered = adminData.students.filter((s) => 
    s.name.toLowerCase().includes(filterText.toLowerCase()) ||
    s.email.toLowerCase().includes(filterText.toLowerCase()) ||
    s.class.toLowerCase().includes(filterText.toLowerCase())
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 2rem;">No students found matching your criteria.</td></tr>`;
    return;
  }

  filtered.forEach((student) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: 0.65rem;">
          <span style="font-size: 1.4rem;">👤</span>
          <div>
            <strong>${escapeHtml(student.name)}</strong>
          </div>
        </div>
      </td>
      <td>${escapeHtml(student.email)}</td>
      <td><span class="topic-pill">${escapeHtml(student.class)}</span></td>
      <td style="font-weight: 600;">${student.tasksCompleted || 0}</td>
      <td>
        <div class="progress-bar-container">
          <div class="progress-track">
            <div class="progress-fill ${student.progress > 80 ? "green" : ""}" style="width: ${student.progress || 0}%;"></div>
          </div>
          <span class="progress-text">${student.progress || 0}%</span>
        </div>
      </td>
      <td>
        <span class="badge ${student.status === "Active" ? "badge-active" : "badge-inactive"}">${escapeHtml(student.status)}</span>
      </td>
      <td>
        <div class="btn-action-group">
          <button class="btn-sm btn-view" onclick="viewStudentDetails(${student.id})">View</button>
          <button class="btn-sm btn-edit" onclick="openEditStudentModal(${student.id})">Edit</button>
          <button class="btn-sm btn-delete" onclick="deleteStudent(${student.id})">Delete</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function saveStudentsData() {
  localStorage.setItem("sh_students", JSON.stringify(adminData.students));
  renderStudentsTable();
  renderAdminOverview();
}

// Student Search Filter
const studentSearchInput = document.getElementById("student-search-input");
if (studentSearchInput) {
  studentSearchInput.addEventListener("input", (e) => {
    renderStudentsTable(e.target.value);
  });
}

// View Student Details Modal
function viewStudentDetails(studentId) {
  const student = adminData.students.find((s) => s.id === studentId);
  if (!student) return;

  const modalBody = document.getElementById("view-student-modal-body");
  modalBody.innerHTML = `
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <div style="font-size: 3.5rem; margin-bottom: 0.5rem;">👨‍🎓</div>
      <h3 style="font-size: 1.35rem; font-weight: 800; color: #0f172a;">${escapeHtml(student.name)}</h3>
      <p style="color: #64748b;">${escapeHtml(student.email)}</p>
    </div>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; font-size: 0.95rem; display: flex; flex-direction: column; gap: 0.75rem;">
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #64748b;">Academic Class:</span>
        <strong>${escapeHtml(student.class)}</strong>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #64748b;">Tasks Completed:</span>
        <strong>${student.tasksCompleted} tasks</strong>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #64748b;">Academic Progress:</span>
        <strong style="color: #2563eb;">${student.progress}%</strong>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #64748b;">Enrollment Status:</span>
        <span class="badge ${student.status === "Active" ? "badge-active" : "badge-inactive"}">${escapeHtml(student.status)}</span>
      </div>
    </div>
  `;
  openModal("view-student-modal");
}

// Open Edit Student Modal
function openEditStudentModal(studentId) {
  const student = adminData.students.find((s) => s.id === studentId);
  if (!student) return;

  adminData.editingStudentId = studentId;
  document.getElementById("modal-student-name").value = student.name;
  document.getElementById("modal-student-email").value = student.email;
  document.getElementById("modal-student-class").value = student.class;
  document.getElementById("modal-student-tasks").value = student.tasksCompleted || 0;
  document.getElementById("modal-student-progress").value = student.progress || 0;
  document.getElementById("modal-student-status").value = student.status || "Active";

  document.getElementById("edit-student-modal-title").textContent = "Edit Student Profile";
  openModal("edit-student-modal");
}

// Open Add Student Modal
function openAddStudentModal() {
  adminData.editingStudentId = null;
  document.getElementById("modal-student-name").value = "";
  document.getElementById("modal-student-email").value = "";
  document.getElementById("modal-student-class").value = "Grade 11-A";
  document.getElementById("modal-student-tasks").value = "0";
  document.getElementById("modal-student-progress").value = "50";
  document.getElementById("modal-student-status").value = "Active";

  document.getElementById("edit-student-modal-title").textContent = "Add New Student";
  openModal("edit-student-modal");
}

// Save Student Form Submit
const studentEditForm = document.getElementById("student-edit-form");
if (studentEditForm) {
  studentEditForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("modal-student-name").value.trim();
    const email = document.getElementById("modal-student-email").value.trim();
    const className = document.getElementById("modal-student-class").value.trim();
    const tasks = parseInt(document.getElementById("modal-student-tasks").value) || 0;
    const progress = parseInt(document.getElementById("modal-student-progress").value) || 0;
    const status = document.getElementById("modal-student-status").value;

    if (!name || !email) return;

    if (adminData.editingStudentId) {
      // Editing existing student
      const student = adminData.students.find((s) => s.id === adminData.editingStudentId);
      if (student) {
        student.name = name;
        student.email = email;
        student.class = className;
        student.tasksCompleted = tasks;
        student.progress = Math.min(100, Math.max(0, progress));
        student.status = status;
      }
    } else {
      // Creating new student
      const newStudent = {
        id: Date.now(),
        name: name,
        email: email,
        class: className,
        tasksCompleted: tasks,
        progress: Math.min(100, Math.max(0, progress)),
        status: status
      };
      adminData.students.unshift(newStudent);
    }

    saveStudentsData();
    closeModal("edit-student-modal");
  });
}

function deleteStudent(studentId) {
  if (confirm("Are you sure you want to delete this student record?")) {
    adminData.students = adminData.students.filter((s) => s.id !== studentId);
    saveStudentsData();
  }
}

/* ==============================================================================
   3. MANAGE SUBJECTS
   ============================================================================== */
function renderSubjectsList() {
  const container = document.getElementById("admin-subjects-grid");
  if (!container) return;

  container.innerHTML = "";
  adminData.subjects.forEach((sub) => {
    const card = document.createElement("div");
    card.className = "subject-card";
    card.style.margin = "0";

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div class="subject-icon">${sub.icon || "📚"}</div>
        <span class="subject-badge">${escapeHtml(sub.code || "CODE")}</span>
      </div>
      <h3 class="subject-title">${escapeHtml(sub.name)}</h3>
      <p class="subject-description">${escapeHtml(sub.description || "Core academic curriculum.")}</p>
      <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 1.25rem;">
        <div><strong>Teacher:</strong> ${escapeHtml(sub.teacher || "Faculty")}</div>
        <div><strong>Enrolled:</strong> ${sub.enrolled || 0} students</div>
      </div>
      <div class="btn-action-group" style="margin-top: auto;">
        <button class="btn-sm btn-edit" style="flex: 1;" onclick="openEditSubjectModal(${sub.id})">Edit</button>
        <button class="btn-sm btn-delete" style="flex: 1;" onclick="deleteSubject(${sub.id})">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function saveSubjectsData() {
  localStorage.setItem("sh_subjects", JSON.stringify(adminData.subjects));
  renderSubjectsList();
  renderAdminOverview();
}

function openAddSubjectModal() {
  adminData.editingSubjectId = null;
  document.getElementById("modal-subject-name").value = "";
  document.getElementById("modal-subject-code").value = "";
  document.getElementById("modal-subject-teacher").value = "";
  document.getElementById("modal-subject-enrolled").value = "30";
  document.getElementById("modal-subject-desc").value = "";
  document.getElementById("edit-subject-modal-title").textContent = "Add New Subject";
  openModal("edit-subject-modal");
}

function openEditSubjectModal(subjectId) {
  const sub = adminData.subjects.find((s) => s.id === subjectId);
  if (!sub) return;

  adminData.editingSubjectId = subjectId;
  document.getElementById("modal-subject-name").value = sub.name;
  document.getElementById("modal-subject-code").value = sub.code || "";
  document.getElementById("modal-subject-teacher").value = sub.teacher || "";
  document.getElementById("modal-subject-enrolled").value = sub.enrolled || 30;
  document.getElementById("modal-subject-desc").value = sub.description || "";
  document.getElementById("edit-subject-modal-title").textContent = "Edit Subject";
  openModal("edit-subject-modal");
}

const subjectEditForm = document.getElementById("subject-edit-form");
if (subjectEditForm) {
  subjectEditForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("modal-subject-name").value.trim();
    const code = document.getElementById("modal-subject-code").value.trim();
    const teacher = document.getElementById("modal-subject-teacher").value.trim();
    const enrolled = parseInt(document.getElementById("modal-subject-enrolled").value) || 0;
    const desc = document.getElementById("modal-subject-desc").value.trim();

    if (!name) return;

    if (adminData.editingSubjectId) {
      const sub = adminData.subjects.find((s) => s.id === adminData.editingSubjectId);
      if (sub) {
        sub.name = name;
        sub.code = code;
        sub.teacher = teacher;
        sub.enrolled = enrolled;
        sub.description = desc;
      }
    } else {
      const icons = {
        Mathematics: "📐",
        Science: "🔬",
        English: "📖",
        "Computer Science": "💻",
        History: "🏛️",
        Geography: "🌍"
      };
      const newSub = {
        id: Date.now(),
        name: name,
        code: code || "SUB101",
        teacher: teacher || "Staff Faculty",
        enrolled: enrolled,
        icon: icons[name] || "📚",
        description: desc || "Academic coursework."
      };
      adminData.subjects.push(newSub);
    }

    saveSubjectsData();
    closeModal("edit-subject-modal");
  });
}

function deleteSubject(subjectId) {
  if (confirm("Are you sure you want to delete this subject?")) {
    adminData.subjects = adminData.subjects.filter((s) => s.id !== subjectId);
    saveSubjectsData();
  }
}

/* ==============================================================================
   4. MANAGE TASKS
   ============================================================================== */
function renderAdminTasksTable() {
  const tbody = document.getElementById("admin-tasks-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";
  if (adminData.tasks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 2rem;">No tasks assigned currently.</td></tr>`;
    return;
  }

  adminData.tasks.forEach((task) => {
    const tr = document.createElement("tr");
    const statusClass = task.status.toLowerCase().replace(" ", "");

    tr.innerHTML = `
      <td><strong>${escapeHtml(task.student)}</strong></td>
      <td>${escapeHtml(task.task)}</td>
      <td><span class="topic-pill">${escapeHtml(task.subject)}</span></td>
      <td>${escapeHtml(task.dueDate || "N/A")}</td>
      <td>
        <span class="badge badge-${statusClass}">${escapeHtml(task.status)}</span>
      </td>
      <td>
        <div class="btn-action-group">
          <button class="btn-sm btn-edit" onclick="openEditTaskModal(${task.id})">Edit</button>
          <button class="btn-sm btn-delete" onclick="deleteAdminTask(${task.id})">Delete</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function saveAdminTasksData() {
  localStorage.setItem("sh_admin_tasks", JSON.stringify(adminData.tasks));
  renderAdminTasksTable();
  renderAdminOverview();
}

function openAddTaskModal() {
  adminData.editingTaskId = null;
  document.getElementById("modal-task-student").value = adminData.students[0]?.name || "Alex Johnson";
  document.getElementById("modal-task-desc").value = "";
  document.getElementById("modal-task-subject").value = "Mathematics";
  document.getElementById("modal-task-date").value = "";
  document.getElementById("modal-task-status").value = "Pending";
  document.getElementById("edit-task-modal-title").textContent = "Assign New Task";
  openModal("edit-task-modal");
}

function openEditTaskModal(taskId) {
  const task = adminData.tasks.find((t) => t.id === taskId);
  if (!task) return;

  adminData.editingTaskId = taskId;
  document.getElementById("modal-task-student").value = task.student;
  document.getElementById("modal-task-desc").value = task.task;
  document.getElementById("modal-task-subject").value = task.subject;
  document.getElementById("modal-task-date").value = task.dueDate || "";
  document.getElementById("modal-task-status").value = task.status;
  document.getElementById("edit-task-modal-title").textContent = "Edit Assigned Task";
  openModal("edit-task-modal");
}

const taskEditForm = document.getElementById("admin-task-edit-form");
if (taskEditForm) {
  taskEditForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const student = document.getElementById("modal-task-student").value.trim();
    const taskDesc = document.getElementById("modal-task-desc").value.trim();
    const subject = document.getElementById("modal-task-subject").value;
    const dueDate = document.getElementById("modal-task-date").value;
    const status = document.getElementById("modal-task-status").value;

    if (!student || !taskDesc) return;

    if (adminData.editingTaskId) {
      const task = adminData.tasks.find((t) => t.id === adminData.editingTaskId);
      if (task) {
        task.student = student;
        task.task = taskDesc;
        task.subject = subject;
        task.dueDate = dueDate;
        task.status = status;
      }
    } else {
      const newTask = {
        id: Date.now(),
        student: student,
        task: taskDesc,
        subject: subject,
        dueDate: dueDate,
        status: status
      };
      adminData.tasks.unshift(newTask);
    }

    saveAdminTasksData();
    closeModal("edit-task-modal");
  });
}

function deleteAdminTask(taskId) {
  if (confirm("Are you sure you want to delete this task?")) {
    adminData.tasks = adminData.tasks.filter((t) => t.id !== taskId);
    saveAdminTasksData();
  }
}

/* ==============================================================================
   5. STATISTICS & CHARTS
   ============================================================================== */
function renderStatisticsCharts() {
  // 1. Task Completion Breakdown
  const totalTasks = adminData.tasks.length;
  const completed = adminData.tasks.filter((t) => t.status === "Completed").length;
  const inProgress = adminData.tasks.filter((t) => t.status === "In Progress").length;
  const pending = adminData.tasks.filter((t) => t.status === "Pending").length;

  const compPct = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
  const progPct = totalTasks > 0 ? Math.round((inProgress / totalTasks) * 100) : 0;
  const pendPct = totalTasks > 0 ? Math.round((pending / totalTasks) * 100) : 0;

  const fillComp = document.getElementById("chart-comp-fill");
  const textComp = document.getElementById("chart-comp-text");
  const fillProg = document.getElementById("chart-prog-fill");
  const textProg = document.getElementById("chart-prog-text");
  const fillPend = document.getElementById("chart-pend-fill");
  const textPend = document.getElementById("chart-pend-text");

  if (fillComp) fillComp.style.width = `${compPct}%`;
  if (textComp) textComp.textContent = `${completed} (${compPct}%)`;
  if (fillProg) fillProg.style.width = `${progPct}%`;
  if (textProg) textProg.textContent = `${inProgress} (${progPct}%)`;
  if (fillPend) fillPend.style.width = `${pendPct}%`;
  if (textPend) textPend.textContent = `${pending} (${pendPct}%)`;

  // 2. Subject Enrollment Meters
  const subjectMeterContainer = document.getElementById("chart-subject-meters");
  if (subjectMeterContainer) {
    subjectMeterContainer.innerHTML = "";
    adminData.subjects.forEach((sub) => {
      const pct = Math.min(100, Math.round(((sub.enrolled || 10) / 60) * 100));
      const item = document.createElement("div");
      item.className = "meter-item";
      item.innerHTML = `
        <div class="meter-header">
          <span>${sub.icon || "📚"} ${escapeHtml(sub.name)}</span>
          <span><strong>${sub.enrolled || 0}</strong> students</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${pct}%;"></div>
        </div>
      `;
      subjectMeterContainer.appendChild(item);
    });
  }
}

/* ==============================================================================
   6. SETTINGS & DEMO RESET
   ============================================================================== */
function resetAllDemoData() {
  if (confirm("Reset all demo data back to default factory state? This will restore original sample records for students, subjects, and tasks.")) {
    localStorage.removeItem("sh_students");
    localStorage.removeItem("sh_subjects");
    localStorage.removeItem("sh_admin_tasks");
    localStorage.removeItem("sh_student_tasks");
    localStorage.removeItem("sh_goals");
    localStorage.removeItem("sh_notes");
    localStorage.removeItem("sh_profile");

    // Re-initialize default dataset
    initDemoData();
    loadAdminData();

    renderAdminOverview();
    renderStudentsTable();
    renderSubjectsList();
    renderAdminTasksTable();
    renderStatisticsCharts();

    alert("✨ Demo data successfully reset to original defaults!");
  }
}

/* ==============================================================================
   7. MODAL UTILITIES
   ============================================================================== */
function initModalListeners() {
  const closeBtns = document.querySelectorAll(".modal-close-btn, .modal-cancel-btn");
  closeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal-overlay");
      if (modal) modal.classList.remove("active");
    });
  });

  const overlays = document.querySelectorAll(".modal-overlay");
  overlays.forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("active");
      }
    });
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

// Utility: Escape HTML string
function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
