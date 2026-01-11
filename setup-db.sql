-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS barangay_report;
USE barangay_report;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL,
  location TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'submitted',
  images JSON DEFAULT (JSON_ARRAY()),
  additional_info TEXT,
  additional_info_images JSON DEFAULT (JSON_ARRAY()),
  admin_feedback TEXT,
  submitted_by VARCHAR(36) NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create report_messages table for conversation history
CREATE TABLE IF NOT EXISTS report_messages (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  report_id VARCHAR(36) NOT NULL,
  sender_id VARCHAR(36) NOT NULL,
  sender_role VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  images JSON DEFAULT (JSON_ARRAY()),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_report_id (report_id),
  INDEX idx_created_at (created_at)
);

-- Create system_logs table for audit and security logging
CREATE TABLE IF NOT EXISTS system_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36),
  user_name TEXT,
  user_role VARCHAR(20),
  action TEXT NOT NULL,
  affected_data TEXT,
  module VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSON,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_user_role (user_role),
  INDEX idx_module (module),
  INDEX idx_timestamp (timestamp),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create memos table for memos and ordinances
CREATE TABLE IF NOT EXISTS memos (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  effective_date DATETIME,
  file_url TEXT,
  issued_by VARCHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_created_at (created_at)
);

-- Insert test users if they don't exist
INSERT IGNORE INTO users (id, username, password) VALUES
('1', 'juan', 'password'),
('2', 'maria', 'password'),
('3', 'pedro', 'password'),
('4', 'ana', 'password'),
('5', 'admin', 'password');
