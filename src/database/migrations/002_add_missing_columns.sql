-- Add missing status column to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed'));

-- Add missing duration column to calls table
ALTER TABLE calls ADD COLUMN IF NOT EXISTS duration INTEGER;

-- Add missing company column to contacts table if it doesn't exist
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company VARCHAR(255);
