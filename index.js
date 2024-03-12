require("dotenv").config({ path: "./sample.env" });
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let Person;

const PersonSchema = new mongoose.Schema({
  username: String,
  date: Date,
  duration: Number,
  description: String,
  counter: Number,
  logs: Array
});

Person = mongoose.model("Person", PersonSchema);

app.use(cors());
app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} --- ${req.path} --- ${req.ip}`);
  next();
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
  const userName = req.body.username;
  const newPerson = new Person({
    username: userName,
    _id: userName._id,
    counter: 0
  });
  newPerson
    .save()
    .then((data) => {
      res.json(
        {
          username: data.username,
          _id: data._id
        }
      );
    })
    .catch((error) => res.json({ error: error }));
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const userId = req.params._id;
  let { description, duration, date } = req.body;

  try {
    const user = await Person.findById(userId);
    user.description = description;
    user.duration = duration;

    if (!date) {
      date = new Date().toISOString().slice(0, 10);
    }
    user.date = date;

    user.counter = user.counter + 1;

    user.logs.push({ description, duration: Number(duration), date });

    await user.save();

    const addedExercise = user.logs[user.logs.length - 1]; 

    res.json({
      _id: user._id,
      username: user.username,
      description: addedExercise.description,
      duration: addedExercise.duration,
      date: new Date(addedExercise.date).toDateString() 
    });

  } catch (error) {
    res.json({ error: "Invalid id" });
  }
});


app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  try {
    const user = await Person.findById(userId);

    let logs = user.logs;

    if (from && to) {
      logs = logs.filter(log => log.date >= from && log.date <= to);
    }

    if (limit) {
      logs = logs.slice(0, limit);
    }

    const formattedLogs = logs.map(log => ({
      description: log.description,
      duration: log.duration,
      date: (new Date(log.date)).toDateString() 
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: logs.length,
      log: formattedLogs
    });

  } catch (error) {
    res.json({ error: "Invalid id" });
  }
});



app.get("/api/users", async (req, res) => {
  try {
    const users = await Person.find();
    const formattedUsers = users.map(user => ({
      username: user.username,
      _id: user._id
    }));
    res.json(formattedUsers);
  } catch (error) {
    console.error("Hata:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
