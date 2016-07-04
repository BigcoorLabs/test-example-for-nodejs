'use strict';

let express = require('express');
let http = require('http');
let bodyParser = require('body-parser');
let morgan = require('morgan');
let moment = require('moment');
let stream = require('stream');

let signal = require('./signal');

let app = express();

//this is only the body size, header size is built-in http module ~80K for HTTP, ~16K for HTTPS
//this is mitigated by Nginx or HAProxy which sets a limit for header size at about 4 ~ 8K
app.set('json spaces', 2);
app.on('start', function () {
  console.log('Application ready to serve requests.');
});
app.use(bodyParser.json());

/*
 * Create and start HTTP server.
 */

let server = http.createServer(app);
server.listen(3000);
server.on('listening', function () {
  console.log('Server listening on http://localhost:%d', this.address().port);
});

morgan.token('CSTDate', function (req,res) {
  return moment().format("D/MM/YYYY:HH:mm:SS ZZ");
});
let morganLogStyle = ':remote-addr - :remote-user :CSTDate ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';
let logStream = new stream.PassThrough();
logStream.on('data', function (data) {
  console.log(data.toString('utf-8'));
});
app.use(morgan(morganLogStyle, {
  stream: logStream
}));

app.get('/test', (req, res) => {
  res.json({
    asArray: [
      {
        first: 'first1',
        second: 'second1'
      },
      {
        first: 'first2',
        second: 'second2'
      }
    ],
    asObject: {
      first: 'first',
      second: 'second'
    },
    asString: 'This is a string.',
    asNumber: 1,
    asBoolean: true
  });
});

function closeHandler() {
  throw new Error('HTTP server closed unexpectedly');
}

server.on('close', closeHandler);

signal.once('exiting', () => {
  console.log('Exit request received');
  server.removeListener('close', closeHandler);
  server.close(() => {
    console.log('HTTP server has been shut down');
  });
});

app.use((err, req, res, next) => {
  if (!err.status) {
    return res.send(err.status);
  }
  signal.abort(err);
});

