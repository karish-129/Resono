-- Create storage bucket for announcement attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcements', 'announcements', true);

-- Create RLS policies for announcement attachments
CREATE POLICY "Anyone can view announcement attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'announcements');

CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'announcements' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'announcements' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add attachments column to announcements table
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;