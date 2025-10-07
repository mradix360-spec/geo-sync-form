# Form Enhancements - Implementation Guide

## ✅ Features Implemented

### 1. Photo/File Attachments
Field data collection now supports file uploads with the following capabilities:

**Storage Setup:**
- Created secure Supabase Storage bucket: `form-attachments`
- 10MB file size limit per upload
- Supported file types: Images (JPEG, PNG, WEBP, HEIC), PDFs, Word documents
- Row-level security ensures users can only access their own files and organization members' files

**Form Builder:**
- New "File Upload" field type
- Configure accepted file types (images, PDFs, documents, or all files)
- Set custom max file size (1-10MB)

**Form Submission:**
- Upload files directly during form submission
- Real-time upload progress
- Preview uploaded files with ability to remove/replace
- Files are automatically linked to form responses
- File paths stored in GeoJSON properties

### 2. Data Validation Rules
Enhanced form fields with advanced validation capabilities:

**Supported Validation Types:**

**Number Fields:**
- Minimum value
- Maximum value
- Example: Age must be between 18 and 65

**Text Fields:**
- Minimum length (characters)
- Maximum length (characters)
- RegEx pattern matching
- Example: License plate format "ABC-1234"

**Built-in Field Types:**
- Email validation
- Phone number validation
- URL validation

**Form Builder:**
- Expandable "Validation Rules" section for each field
- Visual configuration with helpful placeholders
- Validation badge shows number of active rules

**Form Submission:**
- Real-time validation as users type
- Clear error messages below each field
- Prevents submission until all validation passes
- Custom error messages (optional)

## 🎨 UI/UX Features

### Form Builder Enhancements:
- Collapsible validation settings per field
- Badge indicators for configured validations
- New field types: Email, Phone, URL, File Upload
- Select field with comma-separated options
- Clean, organized interface

### Form Submission Enhancements:
- File upload button with drag-and-drop ready styling
- Inline validation feedback
- File preview with remove option
- Upload progress indicators
- Validation error messages in red

## 📝 Usage Examples

### Creating a Form with File Upload:
1. In Form Builder, click "Add Field"
2. Select "File Upload" as field type
3. Configure:
   - Accepted types (e.g., "Images Only")
   - Max file size (e.g., 5MB)
   - Mark as required if needed

### Adding Validation Rules:
1. In Form Builder, expand "Validation Rules" for any field
2. For numbers: Set min/max values
3. For text: Set min/max length or RegEx pattern
4. Validation applies automatically during submission

### Submitting a Form with Files:
1. Click "Choose File" button
2. Select file (validates size and type)
3. File uploads immediately
4. See file name displayed
5. Submit form - file path included in response

## 🔒 Security

**File Upload Security:**
- Users can only access files in their user folder
- Organization members can view each other's files
- File size limits prevent abuse
- MIME type restrictions prevent malicious uploads
- All uploads require authentication

**Data Validation Security:**
- Client-side validation for UX
- Server-side validation recommended (not yet implemented)
- Pattern matching prevents injection attacks
- HTML5 native validation as fallback

## 🚀 Next Steps

**Recommended Future Enhancements:**
1. Server-side validation in edge functions
2. Image preview/thumbnail generation
3. Multiple file uploads per field
4. Conditional logic based on field values
5. Calculated fields using formulas
6. Digital signature capture
7. QR/Barcode scanner integration

## 📊 Data Structure

**File Field in Form Schema:**
```json
{
  "name": "photo",
  "label": "Site Photo",
  "type": "file",
  "required": true,
  "accept": "image/*",
  "maxSize": 5
}
```

**Validation in Form Schema:**
```json
{
  "name": "age",
  "label": "Age",
  "type": "number",
  "required": true,
  "validation": [
    { "type": "min", "value": 18, "message": "Must be 18 or older" },
    { "type": "max", "value": 65 }
  ]
}
```

**Form Response with File:**
```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [-122.4, 37.8] },
  "properties": {
    "site_name": "Location A",
    "photo": "user-id/form-id/photo_1234567890.jpg",
    "notes": "Sample notes"
  }
}
```

## 🐛 Known Limitations

1. Files are uploaded immediately (not on form submit)
2. No batch file upload yet
3. No image compression/optimization
4. Validation messages are English only
5. No file preview for non-image files
6. Maximum 10MB per file (Supabase default)

## 📚 Technical Details

**Dependencies Added:**
- No new dependencies required
- Uses existing Supabase Storage API
- Native HTML5 file input
- React state management

**Files Modified:**
- `src/pages/FormBuilder.tsx` - Enhanced field configuration
- `src/pages/FormSubmit.tsx` - Added file upload and validation logic
- Database migration - Storage bucket and RLS policies

**Database:**
- Storage bucket: `form-attachments`
- RLS policies for secure file access
- File paths stored in `form_responses.geojson.properties`
