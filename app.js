require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const logger = require ("./logger");
const morgan = require ("morgan");
const cors = require('cors')


require("./Models/Database").connectDatabase();

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


const morganFormat = ":method :url :status :response-time ms";

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());


app.use('/', indexRouter); // For API routes
app.use('/api/auth', authRouter); // For API routes

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
