const dotenv = require('dotenv');
const mongoose = require('mongoose');

//we need to place this general uncaughtException handler in here (at the top)
//in order to listen to all possible uncaughtException events that may occur in our app
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION, shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

//the configuration of the env variables happens once when the server is loaded
//and then they will be available to us every where with proccess.env.OUR_ENV_VAR  
dotenv.config({
  path: './config.env'
});

//DB configuration operation must take place after the env configuration
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

//returns a Promise
mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false
}).then(() => {
  console.log('DB connection successful');
})

//import app only after the configurations are done otherwise they won't be available at app.js 
const app = require('./app');

const port = process.env.PORT

const server = app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION, shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  })
});

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION, shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
})

process.on('SIGTERM', () => {
  console.log('SIGTERM RECIEVED, Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  })
})