const net = require('net');

global.attempts;

const _createTunnel = (remoteServer, localServer, code) => createTunnel => {
  const local = net.connect({
    host: localServer.host,
    port: localServer.port
  });
  local.setKeepAlive(true);
  local.on('error', err => {
    console.log('local error', err);
  });

  const remote = net.connect({
    host: remoteServer.host,
    port: remoteServer.port
  });
  remote.setKeepAlive(true);
  remote.once('connect', function() {
    console.log('connected to remote');
    if (code != undefined) {
      remote.write(code);
    }
  });
  remote.on('data', data => {
    //console.log('remote has data', data.toString())
  });

  remote.on('error', function(err) {
    console.log(Date.now(), 'remote connection error. Left attempts: ' + attempts);
    remote.end();
    local.end();
    global.attempts--;
    setTimeout(createTunnel.bind(null, createTunnel), 1000);
    if (global.attempts < 0) {
      process.exit(-1)
    }
  });
  remote.on('end', data => {
    local.end();
    createTunnel(createTunnel);
  });

  local.on('end', (data) => {
    remote.end();
    createTunnel(createTunnel);
  });

  remote.pipe(local).pipe(remote);
};

module.exports = (remoteServer, localServer, attempts = 100, tunnels = 10) => {
  global.attempts = attempts;
  const createTunnel = _createTunnel(remoteServer, localServer);
  while (tunnels--) {
    createTunnel(createTunnel);
  }
};
