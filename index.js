const app = require('./app'); 
const logger = require('./logger');
const port = process.env.PORT;
const { server, io } = require('./socketapi');

app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});
