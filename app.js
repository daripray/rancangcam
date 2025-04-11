
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
  res.send({ message: 'Upload success' });
});

app.get('/cameras', (req, res) => {
  if (!fs.existsSync(recordingBase)) return res.json([]);

  const now = Date.now();
  const dirs = fs.readdirSync(recordingBase);
  const cameras = dirs.map(id => {
    const folder = path.join(recordingBase, id);
    const files = fs.readdirSync(folder).sort((a, b) => fs.statSync(`${folder}/${b}`).mtimeMs - fs.statSync(`${folder}/${a}`).mtimeMs);

    const latestVideo = files.find(f => f.endsWith('.webm'));
    const latestThumb = files.find(f => f.endsWith('.jpg'));
    const videoPath = latestVideo ? `/recording/${id}/${latestVideo}` : null;
    const thumbPath = latestThumb ? `/recording/${id}/${latestThumb}` : null;

    const isLive = latestVideo ? (now - fs.statSync(`${folder}/${latestVideo}`).mtimeMs < 60000) : false;

    return { id, latestVideo: videoPath, latestThumb: thumbPath, isLive };
  });

  res.json(cameras);
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
