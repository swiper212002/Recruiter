-- Migration: add access_token and access_token_expiry to candidate_tests
-- Run this against your MySQL database used by the app (adjust database/schema name as needed)
-- Example (from command line):
-- mysql -u <user> -p <database_name> < 001_add_access_token_candidate_tests.sql

ALTER TABLE `candidate_tests`
  ADD COLUMN `access_token` VARCHAR(255) NULL AFTER `score`,
  ADD COLUMN `access_token_expiry` DATETIME NULL AFTER `access_token`;

-- Verify with:
-- DESCRIBE candidate_tests;