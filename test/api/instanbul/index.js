const express = require('express');
app = express();

app.get('/kill', (req, res) => {
    res.end();
    process.exit();
});
app.listen(3003);

require('../../../dist/entry');