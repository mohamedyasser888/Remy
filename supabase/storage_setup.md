# Supabase Storage Setup Instructions

## Overview
This document provides instructions for setting up the Storage bucket for clothing images.

## Bucket Configuration

### 1. Create Storage Bucket

In the Supabase Dashboard:
1. Navigate to **Storage** in the left sidebar
2. Click **New bucket**
3. Configure:
   - **Name**: `clothes`
   - **Public bucket**: ✅ Enabled (for public read access)
   - **File size limit**: 50 MB (recommended)
   - **Allowed MIME types**: `image/*` (images only)

### 2. Apply Storage Policies

After creating the bucket, you need to apply the following RLS policies to the bucket.

Navigate to **Storage** → **Policies** → **New policy** for the `clothes` bucket.

#### Policy 1: Public Read Access

**Policy Name**: `Public read access`

```sql
-- Allow anyone to read images
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'clothes');
```

**Why**: Allows public access to view images (needed for displaying in the feed)

---

#### Policy 2: Authenticated Users Can Upload to Own Folder

**Policy Name**: `Users can upload to own folder`

```sql
-- Allow authenticated users to upload only to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'clothes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Why**: Users can only upload images to their own folder (`{user_id}/filename.jpg`)

---

#### Policy 3: Authenticated Users Can Update Own Files

**Policy Name**: `Users can update own files`

```sql
-- Allow authenticated users to update only their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'clothes' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'clothes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Why**: Users can update their own images if needed

---

#### Policy 4: Authenticated Users Can Delete Own Files

**Policy Name**: `Users can delete from own folder`

```sql
-- Allow authenticated users to delete only their own files
CREATE POLICY "Users can delete from own folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'clothes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Why**: Users can delete their own images when deleting wardrobe items or posts

---

## File Path Structure

Images are organized by user ID:

```
clothes/
├── {user_id_1}/
│   ├── 1633024800000-abc123.jpg
│   ├── 1633024900000-def456.jpg
│   └── ...
├── {user_id_2}/
│   ├── 1633025000000-ghi789.jpg
│   └── ...
└── ...
```

**Format**: `{user_id}/{timestamp}-{random}.{extension}`

Example: `550e8400-e29b-41d4-a716-446655440000/1696867200000-x9k2p.jpg`

## Testing Storage Setup

After setup, test with these scenarios:

### Test 1: Public Read
```javascript
const { data } = supabase.storage
  .from('clothes')
  .getPublicUrl('any-user-id/any-file.jpg');
console.log(data.publicUrl); // Should return URL
```

### Test 2: Upload to Own Folder (Logged In)
```javascript
const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
const { data, error } = await supabase.storage
  .from('clothes')
  .upload(`${userId}/test-${Date.now()}.jpg`, file);
console.log(error); // Should be null
```

### Test 3: Upload to Another User's Folder (Should Fail)
```javascript
const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
const { data, error } = await supabase.storage
  .from('clothes')
  .upload('other-user-id/test.jpg', file);
console.log(error); // Should return permission error
```

### Test 4: Delete Own File
```javascript
const { error } = await supabase.storage
  .from('clothes')
  .remove([`${userId}/test-file.jpg`]);
console.log(error); // Should be null
```

## Security Notes

1. **Public Read Only**: Images are publicly readable but not listable (users can't browse all images)
2. **User Isolation**: Each user can only write/delete in their own folder
3. **No Anonymous Uploads**: Must be authenticated to upload
4. **Frontend Only Uses Anon Key**: Never use service_role key in the frontend
5. **Automatic Cleanup**: When a user is deleted, their profile is cascade deleted, but you may want to manually clean up Storage files

## Troubleshooting

### Problem: "new row violates row-level security policy"
**Solution**: Ensure you're logged in and uploading to your own folder (`{auth.uid()}/...`)

### Problem: Images not displaying
**Solution**: 
1. Check bucket is set to **Public**
2. Verify public read policy is enabled
3. Ensure image path is correct

### Problem: Can't upload images
**Solution**:
1. Verify user is authenticated
2. Check file path starts with `{user_id}/`
3. Ensure file size is under limit (50 MB)
4. Check MIME type is `image/*`

## Manual Bucket Creation (Alternative)

If you prefer to create the bucket via SQL:

```sql
-- Note: Storage buckets are usually created via Dashboard
-- But this is the underlying structure
INSERT INTO storage.buckets (id, name, public)
VALUES ('clothes', 'clothes', true);
```

Then apply the policies above.
