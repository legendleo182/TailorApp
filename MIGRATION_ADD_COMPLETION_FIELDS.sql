-- Migration script to add completion fields to bills table
-- Run this in your Supabase SQL editor

-- Add new columns to bills table
ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS is_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS completion_reason text;

-- Update existing bills to have is_completed = false
UPDATE public.bills 
SET is_completed = false 
WHERE is_completed IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.bills.is_completed IS 'Whether the bill work is completed';
COMMENT ON COLUMN public.bills.completion_reason IS 'Reason for completion when marked as complete';
