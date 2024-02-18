const express = require('express')
const app = express()
const cors = require('cors')

// body-parser
const bodyParser = require("body-parser");


// importing mongoose
const mongoose = require('mongoose');
require('dotenv').config()

// creating MongoDB connection.
try {
   mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.connection.once('open', () => { 
    console.log("MongoDB database connected");
  });
  
} catch ({ name, message }) {
  console.error(console, `Mongo Connectivity error: ${name}: ${message}`);
  res.json({ error: message })
}

// Creating collections(Schemas) for user, exercises, logs

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});

const exerciseSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: Number,
  date: Date,
  userId: { type: String, default: new Date().toDateString() }
});

const logSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  count: Number,
  userId: {
    type: String,
    required: true
  },
  log: [{
    description: String,
    duration: Number,
    date: Date
  }]

});


// creating user, exercise and log models from respective schemas

const Users = new mongoose.model("Users", userSchema);
const Exercises = new mongoose.model("Exercises", exerciseSchema);
const Logs = new mongoose.model("Logs", logSchema);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  req.body;
  const username = req.body.username;
  const newUser = new Users({ username: username });

  await newUser.save();
  res.json({ username: newUser.username, _id: newUser._id });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  let date = req.body.date;
  const uId = req.body[':_id'];

  // find user from Users model by using _id
  const user = await Users.findById({ _id: uId });

 

  // checking if user exist then we can save users exercise
  if (user === null) {
    res.json("user not found");
  }
  
  // validating the exercise date
  if (date === "" || date === undefined) {
    date = undefined;
  } else if (isNaN(Date.parse(date))) {
    res.json({ error: "Date formatted incorrectly" });
    return;
  } else {
    date = new Date(date).toDateString();
  }

  const newExercise = new Exercises({
  userId: uId,
  username: user.username,
  description: req.body.description,
  duration: Number(req.body.duration),
    date: date
  });
  // saving the exercise
  await newExercise.save();
  res.json({ userId: newExercise.userId, username: newExercise.username, date: newExercise.date, duraton: newExercise.duration, description: newExercise.description });
});


app.get("/api/users/:_id/logs?", async (req, res) => {
  try {
    // if user exists
    const userId = req.params._id;
    const userExist = await Users.find({ _id: userId });
    if (userExist === null) res.json({ error: "User not found" });
    

    console.log(userExist);   
    let [fromDate, toDate, limit] = [req.query.from, req.query.to, req.query.limit];
    let userExercises;
    if (limit) {
      userExercises = await Exercises.find({ userId: userId }).limit(parseInt(limit));
    } else {
      userExercises = await Exercises.find({ userId: userId });
    }  
    userExercises = userExercises.map((item) => {
      return ({
        description: item.description,
        duration: item.duration,
        date: item.date,
      });
    });

    if (!(isNaN(Date.parse(fromDate)) && isNaN(Date.parse(toDate)))) {
      fromDate = Date.parse(fromDate);
      toDate = Date.parse(toDate);
      userExercises = userExercises.filter((item) => { 
        let date = item.date;
        return ((fromDate < date) && (toDate > date))
      });
    }    

    res.json({ _id: userExist[0]._id, count: userExercises.length, username: userExist[0].username,  log: userExercises });
    
  } catch (error) {
    console.error({ "Validator Error": error });
    res.json({ "Validator Error": error });
  }
});

app.get("/api/users", async (req, res) => {
   
  try {
    // quering all the users data 
    const data = await Users.find()
    res.json(data);
    
  } catch (error) {
    console.error({ ValidationError: error });
    res.json({ ValidationError: error });
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
