const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public')); // Sajikan file statis dari /public
app.use('/recordings', express.static(path.join(__dirname, 'recordings')));

// Routing langsung tanpa .html
app.get('/camera', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'camera.html'));
});

app.get('/viewer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});

// Konfigurasi upload folder dinamis
app.post('/upload/:id', (req, res, next) => {
  req.timestamp = Date.now();
  next();
}, multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const cameraId = req.params.id;
      const folder = path.join(__dirname, 'recordings', cameraId);
      fs.mkdirSync(folder, { recursive: true });
      cb(null, folder);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const name = `${req.timestamp}${ext}`;
      cb(null, name);
    }
  })
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumb', maxCount: 1 }
]), (req, res) => {
  res.json({ status: 'success' });
});


// API untuk viewer
app.get('/cameras', (req, res) => {
  const basePath = path.join(__dirname, 'recordings');
  const cameras = [];

  if (fs.existsSync(basePath)) {
    fs.readdirSync(basePath).forEach(cameraId => {
      const folder = path.join(basePath, cameraId);
      if (!fs.statSync(folder).isDirectory()) return;

      const files = fs.readdirSync(folder);
      const recordings = [];

      let thumb = null;
      let lastVideoTime = 0;

      files.forEach(file => {
        const ext = path.extname(file);
        const baseName = path.basename(file, ext);

        if (ext === '.webm') {
          const time = parseInt(baseName);
          const thumbFile = files.find(f => f === `${time}.jpg`);

          console.log(`→ file: ${file}`);
          // console.log(`→ timeStr: ${timeStr}`);
          console.log(`→ time: ${time}`);
          console.log(`→ expected thumb: ${time}.jpg`);
          console.log(`→ found thumb: ${thumbFile}`);

          if (thumbFile) {
            recordings.push({
              video: `/recordings/${cameraId}/${file}`,
              thumb: `/recordings/${cameraId}/${thumbFile}`
            });

            if (time > lastVideoTime) {
              lastVideoTime = time;
              thumb = `/recordings/${cameraId}/${thumbFile}`;
            }
          }
        }
      });

      recordings.sort((a, b) => {
        const at = parseInt(a.video.match(/(\d+)\.webm/)[1]);
        const bt = parseInt(b.video.match(/(\d+)\.webm/)[1]);
        return bt - at;
      });

      const isLive = Date.now() - lastVideoTime < 30 * 1000;

      cameras.push({
        basePath: basePath,
        folder: folder,
        id: cameraId,
        live: isLive,
        thumb,
        recordings
      });
    });
  }

  console.log('[API /cameras] Mengirim data kamera:');
  console.dir(cameras, { depth: null });

  res.json(cameras);
});


// Jalankan server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
