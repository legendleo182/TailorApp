# Quick Fix Guide - Bills Not Showing

## Problem
Bills are not showing up after adding new features. This is because the new database fields don't exist yet.

## Solution 1: Quick Fix (Bills will work, but without completion features)
✅ **DONE** - I've already fixed this. Bills should now show up again.

## Solution 2: Add Completion Features (Optional)
If you want the completion features, run this SQL in your Supabase SQL editor:

```sql
-- Add new columns to bills table
ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS is_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS completion_reason text;

-- Update existing bills to have is_completed = false
UPDATE public.bills 
SET is_completed = false 
WHERE is_completed IS NULL;
```

After running the migration, the completion features will be available.

## Current Status
- ✅ Bills are showing again
- ✅ Count badges are working
- ⏳ Completion features are disabled until migration

## Test
1. Refresh your page
2. Go to Bills section
3. Select a shop
4. Bills should now appear

If bills still don't show, check the browser console for any errors.
