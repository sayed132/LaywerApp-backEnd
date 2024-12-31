const express = require("express");
const app = express();
const dotenv = require("dotenv");
const connectDB = require("./Database/db");
const cors = require("cors");
const path = require("path");
const http = require("http");
const cookieParser = require("cookie-parser");

// router location
const userRouter = require("./routes/User.router");
const caseRouter = require("./routes/Case.router");
const reminderRouter = require("./routes/Reminder.router")
const uploadRouter = require("./routes/UploadFile.router")
const documentRouter = require("./routes/Document.router")
const notificationRouter = require("./routes/Notification.router")
const caseTypeRouter = require("./routes/CaseType.router")
const caseRequestRouter = require("./routes/CaseRequest.router")
const caseReviewRouter = require("./routes/CaseReview.router")





const server = http.createServer(app);

dotenv.config();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: '*' })); // Use specific origins in production
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const port = process.env.PORT || 8020;


// socket creation
const io = require("socket.io")(server, {
  cors: {
    origin: `http://localhost:${port}`, // Allow only specific origin or "*"
    methods: ["GET", "POST"],
    credentials: true,
  },
});
global.io = io;


io.on("connection", (socket) => {
  console.log("A user connected");


  // Handle disconnection and update the user's status
  socket.on("disconnect", async () => {

    if (socket.userId) {
      try {

        console.log(`User ${socket.userId} is offline`);
      } catch (error) {
        console.error("Error updating user status:", error);
      }
    }
  });
});



// api router
app.use("/api", userRouter);
app.use("/api/case", caseRouter);
app.use("/api/reminder", reminderRouter);
app.use("/api/file", uploadRouter);
app.use("/api/document", documentRouter)
app.use("/api/notification", notificationRouter)
app.use("/api/case-type", caseTypeRouter)
app.use("/api/case-request", caseRequestRouter)
app.use("/api/case-review", caseReviewRouter)


server.listen(port, async () => {
  console.log(`Server running on the port http://localhost:${port}`);
  await connectDB();
});

app.get("/", (req, res) => {
  res.send("Welcome to our server");
});