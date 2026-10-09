/**
 * ==============================================================================
 * STUDENT HUB - AUTHENTICATION & DATA STORE (DEMO)
 * Handles client-side simulated login, sessions, role protection, and default data
 * 
 * NOTE: This is a frontend demonstration project using browser localStorage.
 * It is NOT real or secure server authentication.
 * ==============================================================================
 */

// Demo credentials
const DEMO_CREDENTIALS = {
  student: {
    username: "student",
    password: "student123",
    role: "student",
    name: "Alex Johnson",
    email: "student@studenthub.local",
    class: "Grade 11 - Science & Tech",
    studentId: "SH-2026-042",
    avatar: "👨‍🎓"
  },
  admin: {
    username: "admin",
    password: "admin123",
    role: "admin",
    name: "Dr. Sarah Connor",
    email: "admin@studenthub.local",
    department: "Academic Administration",
    adminId: "ADM-901",
    avatar: "👩‍💼"
  }
};

/**
 * Initialize default demo data in localStorage if not already present
 */
function initDemoData() {
  // 1. Initial Students List (for Admin)
  if (!localStorage.getItem("sh_students")) {
    const defaultStudents = [
      { id: 1, name: "Alex Johnson", email: "alex@studenthub.local", class: "Grade 11-A", tasksCompleted: 8, progress: 80, status: "Active" },
      { id: 2, name: "Emma Watson", email: "emma@studenthub.local", class: "Grade 11-A", tasksCompleted: 12, progress: 92, status: "Active" },
      { id: 3, name: "Liam Davis", email: "liam@studenthub.local", class: "Grade 10-B", tasksCompleted: 6, progress: 65, status: "Active" },
      { id: 4, name: "Sophia Martinez", email: "sophia@studenthub.local", class: "Grade 12-A", tasksCompleted: 15, progress: 100, status: "Active" },
      { id: 5, name: "Noah Wilson", email: "noah@studenthub.local", class: "Grade 10-A", tasksCompleted: 4, progress: 45, status: "Inactive" },
      { id: 6, name: "Olivia Brown", email: "olivia@studenthub.local", class: "Grade 11-B", tasksCompleted: 9, progress: 75, status: "Active" }
    ];
    localStorage.setItem("sh_students", JSON.stringify(defaultStudents));
  }

  // 2. Initial Subjects List (for Admin & Students)
  if (!localStorage.getItem("sh_subjects")) {
    const defaultSubjects = [
      { id: 1, name: "Mathematics", code: "MATH101", teacher: "Dr. Raman", enrolled: 45, icon: "📐", description: "Algebra, Calculus, Geometry, and Statistics." },
      { id: 2, name: "Science", code: "SCI102", teacher: "Prof. Curie", enrolled: 42, icon: "🔬", description: "Physics, Chemistry, Cell Biology, and Ecology." },
      { id: 3, name: "English", code: "ENG103", teacher: "Ms. Austin", enrolled: 50, icon: "📖", description: "Literature, Grammar, Essay Writing, and Vocabulary." },
      { id: 4, name: "Computer Science", code: "CS104", teacher: "Mr. Turing", enrolled: 38, icon: "💻", description: "Algorithms, Web Development, and Python fundamentals." },
      { id: 5, name: "History", code: "HIST105", teacher: "Mrs. Clark", enrolled: 35, icon: "🏛️", description: "World History, Civilizations, and Modern Era revolutions." },
      { id: 6, name: "Geography", code: "GEOG106", teacher: "Mr. Mercer", enrolled: 30, icon: "🌍", description: "Physical geography, cartography, climates, and ecosystems." }
    ];
    localStorage.setItem("sh_subjects", JSON.stringify(defaultSubjects));
  }

  // 3. Initial Admin Tasks List
  if (!localStorage.getItem("sh_admin_tasks")) {
    const defaultAdminTasks = [
      { id: 1, student: "Alex Johnson", task: "Complete Calculus Problem Set 3", subject: "Mathematics", dueDate: "2026-10-12", status: "Pending" },
      { id: 2, Emma: "Emma Watson", student: "Emma Watson", task: "Write Lab Report on Chemical Reactions", subject: "Science", dueDate: "2026-10-10", status: "Completed" },
      { id: 3, student: "Liam Davis", task: "Read Shakespeare Hamlet Act 2", subject: "English", dueDate: "2026-10-14", status: "In Progress" },
      { id: 4, student: "Sophia Martinez", task: "Implement Binary Search in Python", subject: "Computer Science", dueDate: "2026-10-08", status: "Completed" },
      { id: 5, student: "Noah Wilson", task: "Draft World War I Research Thesis", subject: "History", dueDate: "2026-10-15", status: "Pending" },
      { id: 6, student: "Olivia Brown", task: "Plate Tectonics Map Analysis", subject: "Geography", dueDate: "2026-10-13", status: "In Progress" }
    ];
    localStorage.setItem("sh_admin_tasks", JSON.stringify(defaultAdminTasks));
  }

  // 4. Initial Student Tasks List (Personal)
  if (!localStorage.getItem("sh_student_tasks")) {
    const defaultStudentTasks = [
      { id: 101, text: "Review Mathematics Chapter 3 notes", subject: "Mathematics", dueDate: "2026-10-12", completed: false },
      { id: 102, text: "Write English essay outline on Hamlet", subject: "English", dueDate: "2026-10-14", completed: true },
      { id: 103, text: "Practice Computer Science algorithms", subject: "Computer Science", dueDate: "2026-10-08", completed: false },
      { id: 104, text: "Revise Science lab safety procedures", subject: "Science", dueDate: "2026-10-10", completed: true }
    ];
    localStorage.setItem("sh_student_tasks", JSON.stringify(defaultStudentTasks));
  }

  // 5. Initial Student Study Goals
  if (!localStorage.getItem("sh_goals")) {
    const defaultGoals = [
      { id: 1, title: "Solve 50 Calculus practice questions", subject: "Mathematics", targetDate: "2026-10-20", current: 35, target: 50, completed: false },
      { id: 2, title: "Complete Web Dev CSS Flexbox & Grid project", subject: "Computer Science", targetDate: "2026-10-25", current: 80, target: 100, completed: false },
      { id: 3, title: "Read 2 English classic literature novels", subject: "English", targetDate: "2026-11-05", current: 2, target: 2, completed: true }
    ];
    localStorage.setItem("sh_goals", JSON.stringify(defaultGoals));
  }

  // 6. Initial Student Notes
  if (!localStorage.getItem("sh_notes")) {
    const defaultNotes = [
      { 
        id: 1, 
        title: "Quadratic Formula & Vertex Form", 
        subject: "Mathematics", 
        date: "Oct 05, 2026", 
        content: "Remember that the vertex x-coordinate is x = -b / (2a). Plug back into original equation to find y. Discriminant b² - 4ac determines number of real roots." 
      },
      { 
        id: 2, 
        title: "Newton's Laws of Motion Summary", 
        subject: "Science", 
        date: "Oct 04, 2026", 
        content: "1st Law: Inertia. 2nd Law: F = m * a. 3rd Law: For every action, there is an equal and opposite reaction. Very important for the upcoming physics test." 
      },
      { 
        id: 3, 
        title: "Python Data Structures Quick Notes", 
        subject: "Computer Science", 
        date: "Oct 02, 2026", 
        content: "Lists are ordered and mutable: []. Tuples are immutable: (). Dictionaries use key-value pairs: {}. Sets store unique unordered values." 
      }
    ];
    localStorage.setItem("sh_notes", JSON.stringify(defaultNotes));
  }

  // 7. Initial Student Profile
  if (!localStorage.getItem("sh_profile")) {
    const defaultProfile = {
      name: "Alex Johnson",
      username: "student",
      email: "student@studenthub.local",
      class: "Grade 11 - Science & Tech",
      studentId: "SH-2026-042",
      bio: "High school student dedicated to STEM subjects, coding, and continuous learning.",
      enrolledSubjects: ["Mathematics", "Science", "English", "Computer Science"],
      studyHours: 42
    };
    localStorage.setItem("sh_profile", JSON.stringify(defaultProfile));
  }
}

// Run data initializer
initDemoData();

/**
 * Get current session user
 */
function getCurrentUser() {
  try {
    const session = localStorage.getItem("student_hub_session");
    return session ? JSON.parse(session) : null;
  } catch (e) {
    console.error("Failed to read user session:", e);
    return null;
  }
}

/**
 * Attempt to log in with username, password, and chosen role
 * Returns { success: boolean, user?: object, message?: string }
 */


async function loginUser(username, password, role) {
  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanUser || !cleanPass) {
    return {
      success: false,
      message: "Please enter your username and password."
    };
  }

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        username: cleanUser,
        password: cleanPass
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        message: data.message || "Invalid username or password."
      };
    }

    const userSession = {
      ...data.user,
      role: data.user.role || role
    };

    localStorage.setItem(
      "student_hub_session",
      JSON.stringify(userSession)
    );

    return {
      success: true,
      user: userSession,
      redirect: userSession.role === "admin"
        ? "admin-dashboard.html"
        : "student-dashboard.html"
    };
  } catch (error) {
    console.error("Login failed:", error);
    return {
      success: false,
      message: "Cannot connect to the server. Please try again."
    };
  }
}

/**
 * Log out user and redirect to login.html
 */
async function logoutUser() {
  try {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include"
    });
  } catch (error) {
    console.error("Logout request failed:", error);
  }

  localStorage.removeItem("student_hub_session");
  window.location.href = "login.html";
}

/**
 * Role protection guard: Checks if the user is authorized for the given page.
 * If unauthorized, redirects appropriately.
 * 
 * @param {"student"|"admin"} requiredRole 
 */
function enforceRoleGuard(requiredRole) {
  const user = getCurrentUser();

  if (!user) {
    // Not logged in at all -> redirect to login
    window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    return null;
  }

  if (user.role !== requiredRole) {
    // Logged in with wrong role -> redirect to their authorized dashboard
    if (user.role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = "student-dashboard.html";
    }
    return null;
  }

  return user;
}
