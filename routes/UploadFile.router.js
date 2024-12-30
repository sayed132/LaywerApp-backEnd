const express = require('express');
const upload = require('../middlewares/Upload');
const { uploadFileController, dynamicUploadController, showFileController } = require('../controllers/FileUpload.controller');
const router = express.Router();
// router.post('/upload', upload.single('file'), uploadFileController);
router.post('/:type', upload.single('file'), dynamicUploadController);
router.get('/:filename', showFileController);

module.exports = router;
