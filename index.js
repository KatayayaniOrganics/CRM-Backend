const app = require('./app'); 
const port = 3000;
// const authRoutes = require('./auth')

// app.use('/api/auth', authRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
