const path = require('path');
const fs = require('fs');


const dynamicUploadController = async (req, res, next) => {
  try {
    const { type } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded!" });
    }

    console.log(req.file);

    // Get the current date and time in the desired format
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}:${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;

    // Use the formatted date and time in the filename
    const fileUrl = `${formattedDate}_${req.file.filename}`;

    res.status(200).json({
      message: "File uploaded successfully!",
      fileUrl,
    });
  } catch (error) {
    next(error);
  }
};


const showFileController = async (req, res, next) => {
  try {
    const { filename } = req.params; // Extract the filename from the request params
    const filePath = path.join(__dirname, '../uploads', filename); // Full path to the file

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found!" });
    }

    // Serve the file
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

module.exports = { dynamicUploadController, showFileController };
