
const express = require('express');
const cookieParser = require('cookie-parser')
const app = express();

app.use(express.json()); // A middleware that tells Express.js, Whenever a request comes in, parse JSON body first before it reaches my routes.
app.use(cookieParser())

// Define a simple route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Importing the auth routes
const authRouter = require('./routes/auth.routes');

app.use('/api/auth', authRouter);

module.exports = app;
