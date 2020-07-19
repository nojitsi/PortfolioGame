const express = require('express');
const env = require('../.env');
const router = require('../routes/routes')
const port = env.PORT;
const app = express();

app.use('/', router);

app.listen(port, () => console.log('\x1b[32m%s\x1b[0m', `App started on ${port} port`));