const express = require('express');
const env = require('../.env');
const path = require('path');
const projectRoot = process.cwd();
const mainRouter = require('./routes/mainRoutes');
const gameRouter = require('./routes/gameRoutes')
const port = env.PORT;
const app = express();

app.use('/', mainRouter);
app.use('/game', gameRouter);

app.use(express.static(path.join(projectRoot, 'public')));

app.listen(port, () => console.log('\x1b[32m%s\x1b[0m', `App started on ${port} port`));