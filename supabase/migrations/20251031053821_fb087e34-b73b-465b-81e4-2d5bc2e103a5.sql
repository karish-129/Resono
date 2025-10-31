-- Update RLS policy for announcements - only admins and masters can create
DROP POLICY IF EXISTS "Authenticated users can create announcements" ON public.announcements;

CREATE POLICY "Only admins and masters can create announcements"
ON public.announcements FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'master')
);

-- Update RLS policy for updates - only admins and masters can update
DROP POLICY IF EXISTS "Users can update own announcements or admins can update" ON public.announcements;

CREATE POLICY "Admins and masters can update announcements"
ON public.announcements FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'master')
);

-- Masters can delete, admins cannot
DROP POLICY IF EXISTS "Users can delete own announcements or master can delete any" ON public.announcements;

CREATE POLICY "Only masters can delete announcements"
ON public.announcements FOR DELETE
USING (
  public.has_role(auth.uid(), 'master')
);