
const net = require('net');

const ports = [5432, 5433, 5434];

ports.forEach(port => {
    const client = new net.Socket();
    client.setTimeout(2000);

    console.log(`Checking port ${port}...`);

    client.connect(port, 'localhost', function () {
        console.log(`Port ${port} is OPEN`);
        client.destroy();
    });

    client.on('error', function (e) {
        console.log(`Port ${port} is CLOSED or unreachable: ${e.message}`);
        client.destroy();
    });

    client.on('timeout', function () {
        console.log(`Port ${port} TIMED OUT`);
        client.destroy();
    });
});
