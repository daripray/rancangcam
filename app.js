
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const recordingBase = path.join(__dirname, 'recording');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/recording', express.static(recordingBase));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(recordingBase, req.params.cameraId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

app.post('/upload/:cameraId', upload.fields([{ name: 'video' }, { name: 'thumb' }]), (req, res) => {
  console.log('Upload success: ');
  // console.log(req);
  
  
  res.send({ message: 'Upload success' });
});

app.get('/cameras', (req, res) => {
  if (!fs.existsSync(recordingBase)) return res.json([]);

  const now = Date.now();
  const dirs = fs.readdirSync(recordingBase);

  const cameras = dirs.map(id => {
    const folder = path.join(recordingBase, id);
    const files = fs.readdirSync(folder);

    const videos = files.filter(f => f.endsWith('.webm')).sort();
    const thumbs = files.filter(f => f.endsWith('.jpg')).sort();

    const recordings = videos.map(videoFile => {
      const base = path.basename(videoFile, '.webm');
      const thumbFile = thumbs.find(t => t.includes(base)) || thumbs[0];
      return {
        video: `/recording/${id}/${videoFile}`,
        thumb: thumbFile ? `/recording/${id}/${thumbFile}` : ''
      };
    });

    const latestRecording = recordings.length ? recordings[recordings.length - 1] : null;
    const latestVideoFile = latestRecording ? latestRecording.video.split('/').pop() : null;
    
 // Debugging log
if (latestVideoFile) {
  console.log(`Kamera: ${id}, Modified: ${fs.statSync(path.join(folder, latestVideoFile)).mtimeMs}, Now: ${now}`);
} else {
  console.log(`Kamera: ${id} - Tidak ada video terbaru.`);
}

    const isLive = latestVideoFile
      ? (now - fs.statSync(path.join(folder, latestVideoFile)).mtimeMs < 15000)
      : false;

    return {
      id,
      thumb: latestRecording ? latestRecording.thumb : '',
      live: isLive,
      recordings
    };
  });

  res.json(cameras);
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
