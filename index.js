require('dotenv').load();

const app = require('./server');

const port = process.env.PORT || 3030;

global.rootPath = __dirname;

app.listen(port, () => console.log(`Listening on port ${port}`));
