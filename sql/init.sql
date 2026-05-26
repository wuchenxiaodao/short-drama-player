CREATE DATABASE IF NOT EXISTS drama_player CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE drama_player;

-- JPA will handle table creation via ddl-auto=update
-- This script sets up the database and grants permissions

CREATE USER IF NOT EXISTS 'drama'@'%' IDENTIFIED BY 'drama123';
GRANT ALL PRIVILEGES ON drama_player.* TO 'drama'@'%';
FLUSH PRIVILEGES;
