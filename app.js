require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const logger = require("./logger");
const morgan = require("morgan");
const cors = require('cors');
// const helmet = require('helmet'); // Add helmet for security

// Connect to the database
require("./Models/Database.js").connectDatabase();

// Import route handlers
const leadRouter = require('./routes/Lead-routes');
const agentRouter = require('./routes/agent-routes.js');
const queryRouter = require('./routes/Query-routes');
const cropRouter = require('./routes/Crop-routes');
const userRolesRouter = require('./routes/UserRoles-routes');
const diseaseRouter = require('./routes/Disease-routes');
const tagsRouter = require('./routes/Tags-routes');
const sourceRouter = require('./routes/Sources-routes');
const callRouter = require('./routes/Call-routes');

const app = express();

// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('trust proxy', true);

// Morgan logging format
const morganFormat = ":method :url :status :response-time ms";

// Use morgan for logging HTTP requests
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

// Middleware setup
// app.use(helmet()); // Add helmet middleware for security
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// Route handlers
app.use('/agent', agentRouter); // For agent routes
app.use('/lead', leadRouter); // For lead routes
app.use('/query', queryRouter); // For query routes
app.use('/crop', cropRouter); // For crop routes
app.use('/userRoles', userRolesRouter); // For user roles routes    
app.use('/disease', diseaseRouter); // For disease routes    
app.use('/tags', tagsRouter); // For tags routes    
app.use('/source', sourceRouter); // For source routes    
app.use('/call', callRouter); // For call routes

// Handle 404 errors
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handling
const ErrorHandler = require("./utils/errorHandler.js");
const {generatedErrors} = require("./middlewares/errors.js");
app.all("*", (req, res, next) => {
  next(new ErrorHandler(`Requested URL Not Found: ${req.url}`, 404));
});
app.use(generatedErrors);

module.exports = app;
