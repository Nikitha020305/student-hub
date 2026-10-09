-- ==============================================================================
-- STUDENT HUB - DATABASE SCHEMA (schema.sql)
-- Relational MySQL Schema for Users, Subjects, Tasks, Goals, and Notes
-- Engine: InnoDB | Character Set: utf8mb4
-- ==============================================================================

-- Create database if it does not already exist
CREATE DATABASE IF NOT EXISTS student_hub
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE student_hub;

-- Disable foreign key checks during schema creation/refresh
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS study_goals;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- 1. USERS TABLE
-- Stores both Student and Admin accounts, profiles, and academic stats
-- ==============================================================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  full_name VARCHAR(100) NOT NULL,
  class_grade VARCHAR(50) DEFAULT NULL,               -- e.g. 'Grade 11 - Science & Tech'
  student_id_number VARCHAR(50) DEFAULT NULL,         -- e.g. 'SH-2026-042'
  department VARCHAR(100) DEFAULT NULL,              -- e.g. 'Academic Administration' (for admin)
  admin_id_number VARCHAR(50) DEFAULT NULL,           -- e.g. 'ADM-901' (for admin)
  avatar VARCHAR(50) DEFAULT '👨‍🎓',
  bio TEXT DEFAULT NULL,
  tasks_completed INT DEFAULT 0,
  progress INT DEFAULT 0,                             -- Progress percentage 0-100
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 2. SUBJECTS TABLE
-- Core academic subjects managed by administrators and studied by students
-- ==============================================================================
CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,                  -- e.g. 'Mathematics'
  code VARCHAR(20) NOT NULL UNIQUE,                   -- e.g. 'MATH101'
  teacher VARCHAR(100) NOT NULL,                      -- e.g. 'Dr. Raman'
  enrolled_students INT DEFAULT 0,
  icon VARCHAR(20) DEFAULT '📚',
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subjects_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 3. TASKS TABLE
-- Tasks and homework items (assigned globally or created by students)
-- ==============================================================================
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,                               -- Assigned student
  subject_id INT DEFAULT NULL,                        -- Related academic subject
  title VARCHAR(255) NOT NULL,                        -- Task description
  due_date DATE DEFAULT NULL,
  status ENUM('Pending', 'In Progress', 'Completed') NOT NULL DEFAULT 'Pending',
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_tasks_user (user_id),
  INDEX idx_tasks_status (status),
  INDEX idx_tasks_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 4. STUDY GOALS TABLE
-- Quantifiable learning milestones tracked by students
-- ==============================================================================
CREATE TABLE study_goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subject_id INT DEFAULT NULL,
  title VARCHAR(255) NOT NULL,                        -- e.g. 'Solve 50 Calculus practice questions'
  target_date DATE DEFAULT NULL,
  current_units INT NOT NULL DEFAULT 0,               -- Progress units achieved (e.g. 35)
  target_units INT NOT NULL DEFAULT 10,               -- Target units to reach (e.g. 50)
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_study_goals_user (user_id),
  INDEX idx_study_goals_completed (is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 5. NOTES TABLE
-- Quick revision notes and topic summaries created by students
-- ==============================================================================
CREATE TABLE notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subject_id INT DEFAULT NULL,
  title VARCHAR(255) NOT NULL,                        -- e.g. 'Quadratic Formula & Vertex Form'
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_notes_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- SEED DATA: ONE DEMO ADMIN & ONE DEMO STUDENT
-- Passwords are encrypted with standard bcrypt hashes (cost factor = 10)
-- Demo credentials match existing auth.js models:
--   Student: username='student' | password='student123'
--   Admin:   username='admin'   | password='admin123'
-- ==============================================================================

-- 1. Demo Admin (Password: admin123)
INSERT INTO users (
  id, username, email, password_hash, role, full_name, department, admin_id_number, avatar, status
) VALUES (
  1,
  'admin',
  'admin@studenthub.local',
  '$2b$10$4uVFIoX2RGyOWcsx19WrR.B4NIzEb2.6KrV4HsJQr61iUo1ePcS8u',
  'admin',
  'Dr. Sarah Connor',
  'Academic Administration',
  'ADM-901',
  '👩‍💼',
  'Active'
);

-- 2. Demo Student (Password: student123)
INSERT INTO users (
  id, username, email, password_hash, role, full_name, class_grade, student_id_number, avatar, bio, tasks_completed, progress, status
) VALUES (
  2,
  'student',
  'student@studenthub.local',
  '$2b$10$.sk7FJCyal84SHUraxBEE.NoCIn9LOTPbDnEkSCrXWWma.zaNeNwC',
  'student',
  'Alex Johnson',
  'Grade 11 - Science & Tech',
  'SH-2026-042',
  '👨‍🎓',
  'High school student dedicated to STEM subjects, coding, and continuous learning.',
  8,
  80,
  'Active'
);

-- ==============================================================================
-- SEED DATA: CORE SUBJECTS (Matching existing application models)
-- ==============================================================================
INSERT INTO subjects (id, name, code, teacher, enrolled_students, icon, description) VALUES
(1, 'Mathematics', 'MATH101', 'Dr. Raman', 45, '📐', 'Algebra, Calculus, Geometry, and Statistics.'),
(2, 'Science', 'SCI102', 'Prof. Curie', 42, '🔬', 'Physics, Chemistry, Cell Biology, and Ecology.'),
(3, 'English', 'ENG103', 'Ms. Austin', 50, '📖', 'Literature, Grammar, Essay Writing, and Vocabulary.'),
(4, 'Computer Science', 'CS104', 'Mr. Turing', 38, '💻', 'Algorithms, Web Development, and Python fundamentals.'),
(5, 'History', 'HIST105', 'Mrs. Clark', 35, '🏛️', 'World History, Civilizations, and Modern Era revolutions.'),
(6, 'Geography', 'GEOG106', 'Mr. Mercer', 30, '🌍', 'Physical geography, cartography, climates, and ecosystems.');

-- ==============================================================================
-- SEED DATA: SAMPLE STUDENT TASKS, GOALS, AND NOTES
-- Pre-populated for user_id = 2 ('student')
-- ==============================================================================

-- Sample Tasks
INSERT INTO tasks (user_id, subject_id, title, due_date, status, is_completed) VALUES
(2, 1, 'Review Mathematics Chapter 3 notes', '2026-10-12', 'Pending', FALSE),
(2, 3, 'Write English essay outline on Hamlet', '2026-10-14', 'Completed', TRUE),
(2, 4, 'Practice Computer Science algorithms', '2026-10-08', 'Pending', FALSE),
(2, 2, 'Revise Science lab safety procedures', '2026-10-10', 'Completed', TRUE);

-- Sample Study Goals
INSERT INTO study_goals (user_id, subject_id, title, target_date, current_units, target_units, is_completed) VALUES
(2, 1, 'Solve 50 Calculus practice questions', '2026-10-20', 35, 50, FALSE),
(2, 4, 'Complete Web Dev CSS Flexbox & Grid project', '2026-10-25', 80, 100, FALSE),
(2, 3, 'Read 2 English classic literature novels', '2026-11-05', 2, 2, TRUE);

-- Sample Notes
INSERT INTO notes (user_id, subject_id, title, content) VALUES
(2, 1, 'Quadratic Formula & Vertex Form', 'Remember that vertex x-coordinate is x = -b / (2a). Plug back into original equation to find y. Discriminant b² - 4ac determines number of real roots.'),
(2, 2, 'Newton''s Laws of Motion Summary', '1st Law: Inertia. 2nd Law: F = m * a. 3rd Law: For every action, there is an equal and opposite reaction. Very important for the upcoming physics test.'),
(2, 4, 'Python Data Structures Quick Notes', 'Lists are ordered and mutable: []. Tuples are immutable: (). Dictionaries use key-value pairs: {}. Sets store unique unordered values.');
