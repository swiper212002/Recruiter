const express = require('express');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/api');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

mongoose.connect('mongodb://localhost:27017/cs60_recruitment', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(5000, () => console.log('Server running on port 5000')))
  .catch(err => console.error(err));