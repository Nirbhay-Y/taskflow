const express = require("express");
const User = require("../model/Useschema");
const bcrypt = require("bcrypt")
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const validator = require('validator');

const cors = require("cors");
const authentication = require("../middleware/authentication");

router.use(cors({
  origin: 'http://localhost:3000', // Allow your frontend's origin
  credentials: true
}));

router.use(express.json());

router.put('/Editask/:id', async (req, res) => {
  const taskId = req.params.id;
  const { title, description, customDate, customTime } = req.body;

  try {
    // Find the user who owns the task
    const user = await User.findOne({ 'tasks._id': taskId });

    if (!user) {
      return res.status(404).json({ message: 'User or Task not found' });
    }

    // Find the specific task from user's task list
    const task = user.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update task fields
    task.title = title;
    task.description = description;
    task.customDate = customDate;
    task.customTime = customTime;

    await user.save(); // Save the updated user document
    res.status(200).json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.delete('/tasks/:id', authentication, async (req, res) => {
  try {
    const taskId = req.params.id;

    // Pull the task from the embedded array
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { tasks: { _id: taskId } } },
      { new: true }
    );

    // Check if the task was actually removed
    const taskExists = updatedUser.tasks.find(task => task._id.toString() === taskId);
    if (taskExists) {
      return res.status(401).json({ error: 'Task not deleted due to unknown issue' });
    }

    res.json({ message: 'Task deleted successfully', taskId });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Server error' });
  }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "yadavnirbhayV642@gmail.com",
    pass: "xhph msji hovz awoh"
  }
});

router.post("/send-tasks", async (req, res) => {
  const { userId, userEmail } = req.body;

  try {

    if (!userId || !userEmail || !validator.isEmail(userEmail)) {
      return res.status(401).json({ error: "Invalid or missing user ID or email address." });
    }

    const user = await User.findById(userId);

    if (!user || !user.tasks || user.tasks.length === 0) {
      return res.status(401).json({ error: "No tasks found." });
    }

    const taskList = user.tasks
      .map((task) => `<li>1) Task:${task.title} <br/>2) Description:${task.description}<br/>3) Date: ${task.customDate} <br/>4) Time: ${task.customTime}</li>`)
      .join("");

    const mailOptions = {
      from: "yadavnirbhayV642@gmail.com",
      to: userEmail,
      subject: "Your Task List - TaskFlow",
      html: `
          <p>Hello ${user.Name},</p>
          <p>Here is your task list:</p>
          <ul>${taskList}</ul>
          <p>Thank you for using TaskFlow!</p>
        
        `
    };
    
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Tasks sent to your email!" });

  } catch (error) {
    console.error(error);
    res.status(401).json({ error: "Failed to send tasks." });
  }
});


router.put('/update-profile', async (req, res) => {
  const { Name, Email } = req.body;

  try {
    const user = await User.findOne({ Email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.Name = Name;  // Capitalized as per schema
    await user.save();

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});



router.post('/change-password', async (req, res) => {
  const { Email, oldPassword, newPassword } = req.body;

  try {
    const user = await User.findOne({ Email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.Password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect old password' });

    user.Password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error changing password' });
  }
});


router.post('/register', async (req, res) => {

  const { Name, Email, Phone, Password } = req.body;
  if (!Name || !Email || !Phone || !Password) {
    return res.status(401).send({ error: "Please fill all details" });
  }

  try {
    const emailExist = await User.findOne({ Email: Email });
    if (emailExist) {
      return res.status(401).send({ error: "Emial already exist" });
    }

    const user = new User({ Name, Email, Phone, Password });
    // middleware is calling in Useschema.js before saving
    const userData = await user.save();

    if (userData) {
      return res.status(200).send({ message: "Registration successfully" });
    } else {
      return res.status(401).send({ error: "Failed to registration" });
    }

  } catch (error) {
    res.status(401).send({ error: "Something error is there" })
  }
})

router.post('/login', async (req, res) => {

  const { Email, Password } = req.body;
  if (!Email || !Password) {
    return res.status(401).send({ error: "Please fill all details" });
  }

  try {
    const userFound = await User.findOne({ Email: Email });
    if (userFound) {
      const passMatch = await bcrypt.compare(Password, userFound.Password);
      if (passMatch) {
        const tokennir = await userFound.generateAuthToken();
        return res.status(200).send({
          message: "Login successfully", token: tokennir, user: {
            _id: userFound._id,
            name: userFound.Name,
            email: userFound.Email
          }
        });
      } else {
        return res.status(401).json({ error: "Invalid Password" });
      }
    } else {
      return res.status(401).json({ error: "User not found" });
    }

  } catch (error) {
    res.status(401).json({ error: "Something went wrong during login" });
  }
});

router.get('/about', authentication, (req, res) => {
  res.send(req.user)
});

router.post('/task', authentication, async (req, res) => {
  try {
    const { title, description, customDate, customTime } = req.body;

    if (!title || !description || !customDate || !customTime) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Clean up any old invalid tasks
    req.user.tasks = req.user.tasks.filter(
      (task) => task.title && task.description && task.customDate && task.customTime
    );

    req.user.tasks.push({ title, description, customDate, customTime });
    await req.user.save();

    const newTask = req.user.tasks[req.user.tasks.length - 1];
    res.status(200).json(newTask);
  } catch (error) {
    console.error("Server error while adding task:", error);
    res.status(500).json({ message: "Server error", error });
  }
});



// GET /api/tasks — Fetch all tasks of the logged-in user
router.get('/tasks', authentication, async (req, res) => {
  try {
    res.status(200).json(req.user.tasks);
  } catch (error) {
    res.status(401).json({ message: "Server error", error });
  }
});

module.exports = router;