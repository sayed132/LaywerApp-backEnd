const express = require('express');
const upload = require('../middlewares/Upload');
const { uploadFileController, dynamicUploadController, showFileController, multipleUploadController } = require('../controllers/FileUpload.controller');
const router = express.Router();

//upload single file route
router.post('/:type', upload.single('file'), dynamicUploadController);

//upload up to 10 files route
router.post('/:type/multiple', upload.array('files', 10), multipleUploadController);

//show file route
router.get('/:filename', showFileController);

module.exports = router;
