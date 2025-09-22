require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const User = require("./models/User");
const Group = require("./models/Group");

const app = express();
app.use(cors({ origin: "http://localhost:5173" })); // allow Vite dev server
app.use(express.json());

// serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// API: upload single file
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.originalname,
  });
});

// simple user API (store only username & name)
app.post("/api/users", async (req, res) => {
  try {
    const { username, name } = req.body;
    if (!username || !name)
      return res.status(400).json({ error: "username and name required" });
    const existing = await User.findOne({ username });
    if (existing)
      return res.status(409).json({ error: "username already taken" });
    const user = await User.create({ username, name });
    res
      .status(201)
      .json({ id: user._id, username: user.username, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users", async (req, res) => {
  const users = await User.find({}, "username name").limit(100);
  res.json(users);
});

// Create a new group
app.post("/api/groups", async (req, res) => {
  try {
    const { name, createdBy, members } = req.body;
    if (!name || !createdBy || !members || !Array.isArray(members)) {
      return res
        .status(400)
        .json({ error: "Name, createdBy and members array are required" });
    }

    // Add creator to members if not already included
    if (!members.includes(createdBy)) {
      members.push(createdBy);
    }

    const group = await Group.create({
      name,
      createdBy,
      members,
      admins: [createdBy],
    });

    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's groups
app.get("/api/users/:username/groups", async (req, res) => {
  try {
    const { username } = req.params;
    const groups = await Group.find({ members: username });
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// start server + socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});

// in-memory map username -> socketId (simple demo)
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  // join: client sends { username }
  socket.on("join", ({ username }) => {
    if (!username) return;
    onlineUsers.set(username, socket.id);
    socket.data.username = username;
    io.emit("online_users", Array.from(onlineUsers.keys()));
    console.log(`${username} joined`);
  });

  // send_message payload:
  // { from, to?, room?, content, type? }
  socket.on("send_message", (payload) => {
    try {
      if (payload.to) {
        // private message
        const toSocketId = onlineUsers.get(payload.to);
        if (toSocketId) {
          io.to(toSocketId).emit("receive_message", payload);
        }
        // ack to sender (so it shows locally)
        socket.emit("message_sent_ack", payload);
      } else if (payload.room) {
        // room broadcast
        io.to(payload.room).emit("receive_message", payload);
      } else {
        // global broadcast
        socket.broadcast.emit("receive_message", payload);
        socket.emit("message_sent_ack", payload);
      }
    } catch (err) {
      console.error("send_message error", err);
    }
  });

  socket.on("typing", (data) => {
    // forward typing signal (simple)
    if (data.to) {
      const toSocketId = onlineUsers.get(data.to);
      if (toSocketId)
        io.to(toSocketId).emit("typing", { from: socket.data.username });
    } else {
      socket.broadcast.emit("typing", { from: socket.data.username });
    }
  });

  socket.on("disconnect", () => {
    if (socket.data.username) {
      onlineUsers.delete(socket.data.username);
      io.emit("online_users", Array.from(onlineUsers.keys()));
      console.log(`${socket.data.username} disconnected`);
    }
  });

  // Join group room
  socket.on("join_group", (groupId) => {
    socket.join(groupId);
    console.log(`${socket.data.username} joined group ${groupId}`);
  });

  // Leave group room
  socket.on("leave_group", (groupId) => {
    socket.leave(groupId);
    console.log(`${socket.data.username} left group ${groupId}`);
  });
});

// connect to Mongo
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB database"); // log on successful connection
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err); // log on connection failure
  });
