-- Create a function to automatically archive expired announcements
CREATE OR REPLACE FUNCTION archive_expired_announcements()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE announcements
  SET archived = true
  WHERE archived = false
    AND deadline IS NOT NULL
    AND deadline < NOW();
END;
$$;