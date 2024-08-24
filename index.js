const app = require('./app'); 
const logger = require('./logger');
const port = process.env.PORT;

app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});
