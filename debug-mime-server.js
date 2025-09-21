// Debug version to log MIME types
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();
const PORT = 3002; // Different port for debug

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: function (req, file, cb) {
    console.log('📋 DEBUG - File received:');
    console.log('  - Original name:', file.originalname);
    console.log('  - MIME type:', file.mimetype);
    console.log('  - Field name:', file.fieldname);
    console.log('  - Size:', file.size);
    
    // Temporarily accept all files for debugging
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Simple test endpoint
app.post('/debug/upload', upload.single('document'), (req, res) => {
  console.log('✅ DEBUG - File accepted successfully');
  console.log('  - File info:', {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path
  });
  
  if (req.file) {
    fs.unlinkSync(req.file.path); // Clean up
  }
  
  res.json({ 
    status: 'success',
    file: {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    }
  });
});

app.listen(PORT, () => {
  console.log(`🔍 Debug server running on http://localhost:${PORT}`);
  console.log(`📤 Test with: curl -F "document=@test.pdf" http://localhost:${PORT}/debug/upload`);
});