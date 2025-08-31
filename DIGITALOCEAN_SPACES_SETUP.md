# DigitalOcean Spaces Configuration for File Uploads

This document explains how to configure DigitalOcean Spaces for audio and image uploads in the chat system.

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# DigitalOcean Spaces Configuration
DO_SPACES_ACCESS_KEY=your_spaces_access_key_here
DO_SPACES_SECRET_KEY=your_spaces_secret_key_here
```

## How to Get DigitalOcean Spaces Keys

1. **Log in to DigitalOcean Console**
   - Go to https://cloud.digitalocean.com/

2. **Navigate to Spaces**
   - Click on "Spaces" in the left sidebar
   - You should see your `newgirl` space at `https://newgirl.sfo3.digitaloceanspaces.com`

3. **Generate API Keys**
   - Go to "API" in the left sidebar
   - Click on "Spaces Keys" tab
   - Click "Generate New Key"
   - Give it a name like "NewGirl Chat Uploads"
   - Copy the Access Key and Secret Key

4. **Add to Environment**
   - Add the keys to your `.env` file
   - Restart your backend server

## API Endpoints

### Upload Image
```
POST /chat/upload/image
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>

Form Data:
- image: (file) - Image file (JPEG, PNG, GIF, WebP)
```

**Response:**
```json
{
  "url": "https://newgirl.sfo3.digitaloceanspaces.com/images/user123/uuid.jpg",
  "message": "Image uploaded successfully"
}
```

### Upload Audio
```
POST /chat/upload/audio
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>

Form Data:
- audio: (file) - Audio file (MP3, WAV, OGG, WebM, M4A)
```

**Response:**
```json
{
  "url": "https://newgirl.sfo3.digitaloceanspaces.com/audio/user123/uuid.mp3",
  "message": "Audio uploaded successfully"
}
```

## File Constraints

### Images
- **Allowed formats:** JPEG, PNG, GIF, WebP
- **Max file size:** 10MB
- **Storage path:** `images/{userId}/{uuid}.{extension}`

### Audio
- **Allowed formats:** MP3, WAV, OGG, WebM, M4A
- **Max file size:** 50MB
- **Storage path:** `audio/{userId}/{uuid}.{extension}`

## Usage in Frontend

### Upload Image
```javascript
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('/api/chat/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log('Image URL:', result.url);
```

### Upload Audio
```javascript
const formData = new FormData();
formData.append('audio', audioFile);

const response = await fetch('/api/chat/upload/audio', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log('Audio URL:', result.url);
```

## Security Features

- **Authentication Required:** All uploads require valid JWT token
- **File Type Validation:** Only allowed file types are accepted
- **File Size Limits:** Prevents large file uploads
- **User Isolation:** Files are organized by user ID
- **Public Access:** Uploaded files are publicly accessible via URL
- **Unique Filenames:** UUID prevents filename conflicts

## Error Handling

The upload endpoints will return appropriate HTTP status codes:

- **200:** Upload successful
- **400:** Invalid file type, size, or missing file
- **401:** Authentication required
- **500:** Server error during upload

## File Organization

Files are organized in the DigitalOcean Space as follows:

```
newgirl/
├── images/
│   ├── user123/
│   │   ├── uuid1.jpg
│   │   └── uuid2.png
│   └── user456/
│       └── uuid3.gif
└── audio/
    ├── user123/
    │   ├── uuid4.mp3
    │   └── uuid5.wav
    └── user456/
        └── uuid6.ogg
```

This organization ensures:
- Easy user-based file management
- No filename conflicts
- Scalable storage structure
- Clear separation between file types
