const {server} = require("./app")
const logger = require('./logger');
const port = process.env.PORT;


server.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});
