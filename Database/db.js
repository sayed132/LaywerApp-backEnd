const mongoose = require("mongoose");

// database connect
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.SERVER_API, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
   
    });
    console.log("Database connected successfully.");
  } catch (error) {
    console.log("db is not connected");
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectDB;