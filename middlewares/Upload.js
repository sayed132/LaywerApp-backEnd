const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Save files to 'uploads' folder
  },
  filename: (req, file, cb) => {
    const { type } = req.params || { type: "file" }; // Use type from params or default to "file"
    // Use original filename for saving the file
    cb(null, `${type}-${file.originalname}`);
  },
});

const upload = multer({ storage });

module.exports = upload;

