const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./db");
const session = require("express-session");
const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET || "change-this-to-a-long-random-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false
  }
}));



const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve your website files
app.use(express.static(__dirname));

// Test backend
app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS test");
    res.json({
      success: true,
      message: "Student Hub backend is connected to MySQL!",
      database: rows[0].test === 1
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Database connection failed"
    });
  }
});

// Get all subjects
app.get("/api/subjects", async (req, res) => {
  try {
    const [subjects] = await db.query(
      `SELECT id, name, code, teacher, enrolled_students, icon, description
       FROM subjects
       ORDER BY id`
    );

    res.json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to load subjects"
    });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    const [users] = await db.query(
      `SELECT *
       FROM users
       WHERE username = ?`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    const user = users[0];

    const passwordCorrect = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    // Never send the password hash to the browser
    delete user.password_hash;

    req.session.userId = user.id;

res.json({
  success: true,
  user
});

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Login failed"
    });
  }
});



app.get("/api/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      message: "Not logged in"
    });
  }

  res.json({
    userId: req.session.userId
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        message: "Could not log out."
      });
    }

    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});




// ============================================================
// TASKS API
// ============================================================


 // Get tasks for the logged-in student
app.get("/api/tasks", async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in first"
      });
    }

    const [tasks] = await db.query(
      `SELECT
        t.id,
        t.user_id,
        t.subject_id,
        t.title,
        t.due_date,
        t.status,
        t.is_completed,
        s.name AS subject
       FROM tasks t
       LEFT JOIN subjects s
         ON t.subject_id = s.id
       WHERE t.user_id = ?
       ORDER BY t.due_date ASC, t.id DESC`,
      [userId]
    );

    res.json(tasks);
  } catch (error) {
    console.error("GET TASKS ERROR:", error);
    res.status(500).json({
      message: "Failed to load tasks"
    });
  }
});


// Create a task
app.post("/api/tasks", async (req, res) => {
  try {
    const {
      user_id,
      subject_id,
      title,
      due_date
    } = req.body;

    if (!user_id || !title) {
      return res.status(400).json({
        message: "user_id and title are required"
      });
    }

    const [result] = await db.query(
      `INSERT INTO tasks
       (user_id, subject_id, title, due_date, status, is_completed)
       VALUES (?, ?, ?, ?, 'Pending', FALSE)`,
      [
        user_id,
        subject_id || null,
        title,
        due_date || null
      ]
    );

    const [rows] = await db.query(
      `SELECT
        t.id,
        t.user_id,
        t.subject_id,
        t.title,
        t.due_date,
        t.status,
        t.is_completed,
        s.name AS subject
       FROM tasks t
       LEFT JOIN subjects s
         ON t.subject_id = s.id
       WHERE t.id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);

  } catch (error) {
    console.error("CREATE TASK ERROR:", error);

    res.status(500).json({
      message: "Failed to create task"
    });
  }
});


// Update task completion
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const {
      is_completed
    } = req.body;

    if (!taskId) {
      return res.status(400).json({
        message: "Invalid task ID"
      });
    }

    const completed =
      Boolean(is_completed);

    const status =
      completed
        ? "Completed"
        : "Pending";

    await db.query(
      `UPDATE tasks
       SET
         is_completed = ?,
         status = ?
       WHERE id = ?`,
      [
        completed,
        status,
        taskId
      ]
    );

    const [rows] = await db.query(
      `SELECT
        t.id,
        t.user_id,
        t.subject_id,
        t.title,
        t.due_date,
        t.status,
        t.is_completed,
        s.name AS subject
       FROM tasks t
       LEFT JOIN subjects s
         ON t.subject_id = s.id
       WHERE t.id = ?`,
      [taskId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error("UPDATE TASK ERROR:", error);

    res.status(500).json({
      message: "Failed to update task"
    });
  }
});



app.put("/api/notes/:id", async (req, res) => {
  try {
    const noteId = Number(req.params.id);
    const { user_id, subject_id, title, content } = req.body;

    if (
      !noteId ||
      !Number(user_id) ||
      !title?.trim() ||
      !content?.trim()
    ) {
      return res.status(400).json({
        message: "Note ID, user ID, title, and content are required"
      });
    }

    const [result] = await db.query(
      `UPDATE notes
       SET subject_id = ?, title = ?, content = ?
       WHERE id = ? AND user_id = ?`,
      [
        subject_id || null,
        title.trim(),
        content.trim(),
        noteId,
        Number(user_id)
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Note not found or no changes made"
      });
    }

    res.json({ message: "Note updated successfully" });
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ message: "Failed to update note" });
  }
});


// Delete task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const taskId = Number(req.params.id);

    if (!taskId) {
      return res.status(400).json({
        message: "Invalid task ID"
      });
    }

    const [result] = await db.query(
      `DELETE FROM tasks
       WHERE id = ?`,
      [taskId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    res.json({
      success: true,
      message: "Task deleted successfully"
    });

  } catch (error) {
    console.error("DELETE TASK ERROR:", error);

    res.status(500).json({
      message: "Failed to delete task"
    });
  }
});



/* ================================
   STUDY GOALS API
================================ */


// Get study goals for the logged-in student
app.get("/api/goals", async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in first"
      });
    }

    const [goals] = await db.query(
      `SELECT
        id, user_id, subject_id, title, target_date,
        current_units, target_units, is_completed
       FROM study_goals
       WHERE user_id = ?
       ORDER BY id DESC`,
      [userId]
    );

    res.json(goals);
  } catch (error) {
    console.error("GET GOALS ERROR:", error);
    res.status(500).json({
      message: "Failed to load study goals"
    });
  }
});


 // Add a study goal for the logged-in student
app.post("/api/goals", async (req, res) => {
  try {
    const userId = req.session.userId;
    const {
      subject_id,
      title,
      target_date,
      target_units
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in first"
      });
    }

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        message: "title is required"
      });
    }

    const [result] = await db.query(
      `INSERT INTO study_goals
       (user_id, subject_id, title, target_date,
        current_units, target_units, is_completed)
       VALUES (?, ?, ?, ?, 0, ?, FALSE)`,
      [
        userId,
        subject_id || null,
        String(title).trim(),
        target_date || null,
        target_units || 10
      ]
    );

    const [rows] = await db.query(
      `SELECT id, user_id, subject_id, title, target_date,
              current_units, target_units, is_completed
       FROM study_goals
       WHERE id = ? AND user_id = ?`,
      [result.insertId, userId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("CREATE GOAL ERROR:", error);
    res.status(500).json({
      message: "Failed to create study goal"
    });
  }
});


 // Update study goal progress and completion
app.put("/api/goals/:id", async (req, res) => {
  try {
    const userId = req.session.userId;
    const goalId = Number(req.params.id);
    const { current_units, is_completed } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in first"
      });
    }

    if (!Number.isInteger(goalId) || goalId <= 0) {
      return res.status(400).json({
        message: "Invalid goal ID"
      });
    }

    const [result] = await db.query(
      `UPDATE study_goals
       SET current_units = ?, is_completed = ?
       WHERE id = ? AND user_id = ?`,
      [
        Math.max(0, Number(current_units) || 0),
        Boolean(is_completed),
        goalId,
        userId
      ]
    );

    if (result.affectedRows === 0) {
      const [existing] = await db.query(
        "SELECT id FROM study_goals WHERE id = ? AND user_id = ?",
        [goalId, userId]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          message: "Study goal not found"
        });
      }
    }

    const [rows] = await db.query(
      `SELECT id, user_id, subject_id, title, target_date,
              current_units, target_units, is_completed
       FROM study_goals
       WHERE id = ? AND user_id = ?`,
      [goalId, userId]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error("UPDATE GOAL ERROR:", error);
    res.status(500).json({
      message: "Failed to update study goal"
    });
  }
});


 // Delete a study goal belonging to the logged-in student
app.delete("/api/goals/:id", async (req, res) => {
  try {
    const userId = req.session.userId;
    const goalId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({
        message: "Please log in first"
      });
    }

    if (!Number.isInteger(goalId) || goalId <= 0) {
      return res.status(400).json({
        message: "Invalid goal ID"
      });
    }

    const [result] = await db.query(
      "DELETE FROM study_goals WHERE id = ? AND user_id = ?",
      [goalId, userId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Study goal not found"
      });
    }

    res.json({
      success: true,
      message: "Study goal deleted"
    });
  } catch (error) {
    console.error("DELETE GOAL ERROR:", error);
    res.status(500).json({
      message: "Failed to delete study goal"
    });
  }
});



/* =========================
   STUDY NOTES API
========================= */


 // Get notes for the logged-in student
app.get("/api/notes", async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in first"
      });
    }

    const [notes] = await db.query(
      `SELECT n.id, n.user_id, n.subject_id, n.title, n.content,
              n.created_at, s.name AS subject
       FROM notes n
       LEFT JOIN subjects s ON n.subject_id = s.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC`,
      [userId]
    );

    res.json(notes);
  } catch (error) {
    console.error("Error loading notes:", error);
    res.status(500).json({
      message: "Failed to load notes"
    });
  }
});

// Add a note
app.post("/api/notes", async (req, res) => {
  try {
    const { user_id, subject_id, title, content } = req.body;

    if (!Number(user_id) || !title?.trim() || !content?.trim()) {
      return res.status(400).json({
        message: "user_id, title, and content are required"
      });
    }

    const [result] = await db.query(
      `INSERT INTO notes (user_id, subject_id, title, content)
       VALUES (?, ?, ?, ?)`,
      [Number(user_id), subject_id || null, title.trim(), content.trim()]
    );

    res.status(201).json({
      id: result.insertId,
      user_id: Number(user_id),
      subject_id: subject_id || null,
      title: title.trim(),
      content: content.trim()
    });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ message: "Failed to create note" });
  }
});

// Delete a note
app.delete("/api/notes/:id", async (req, res) => {
  try {
    const noteId = Number(req.params.id);
    const userId = Number(req.query.user_id);

    if (!noteId || !userId) {
      return res.status(400).json({
        message: "Valid note ID and user_id are required"
      });
    }

    const [result] = await db.query(
      "DELETE FROM notes WHERE id = ? AND user_id = ?",
      [noteId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ message: "Failed to delete note" });
  }
});



app.put("/api/notes/:id", async (req, res) => {
  try {
    const noteId = Number(req.params.id);
    const { user_id, subject_id, title, content } = req.body;
    const userId = Number(user_id);

    if (!noteId || !userId || !title?.trim() || !content?.trim()) {
      return res.status(400).json({
        message: "Note ID, user ID, title, and content are required"
      });
    }

    const [result] = await db.query(
      `UPDATE notes
       SET subject_id = ?, title = ?, content = ?
       WHERE id = ? AND user_id = ?`,
      [subject_id || null, title.trim(), content.trim(), noteId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Note not found or no changes made"
      });
    }

    res.json({ message: "Note updated successfully" });
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({
      message: "Failed to update note"
    });
  }
});








app.listen(PORT, () => {
  console.log(`Student Hub server running at http://localhost:${PORT}`);
});