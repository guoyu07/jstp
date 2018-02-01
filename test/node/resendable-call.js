'use strict';

const test = require('tap');

const jstp = require('../..');

const app = require('../fixtures/application');

const application = new jstp.Application(app.name, app.interfaces);
const serverConfig = { applications: [application] };

const client = { session: null };

let server;
let connection;

test.beforeEach((done) => {
  server = jstp.net.createServer(serverConfig);
  server.listen(0, () => {
    const port = server.address().port;
    jstp.net.connect(app.name, null, port, 'localhost', (error, conn) => {
      test.assertNot(error, 'must connect to server and perform handshake');
      connection = conn;
      done();
    });
  });
});

test.afterEach((done) => {
  if (connection) {
    connection.close();
    connection = null;
  }
  server.close();
  done();
});

test.test('must resend call if connection was interrupted', (test) => {
  connection.close();
  connection.callMethodWithResend('calculator', 'doNothing', [], (error) => {
    test.assertNot(error, 'must not return an error');
    test.end();
  });

  const port = server.address().port;
  client.session = connection.session;

  jstp.net.connect(app.name, client, port, 'localhost', (error, conn) => {
    test.assertNot(error, 'must reconnect to server');
    connection = conn;
  });
});
