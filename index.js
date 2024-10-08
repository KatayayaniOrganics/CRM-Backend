const { app, server } = require('./app'); // Ensure this matches the export
const logger = require('./logger');
const port = process.env.PORT || 3000;

app.set('port', port); // Setting the port

server.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
});
