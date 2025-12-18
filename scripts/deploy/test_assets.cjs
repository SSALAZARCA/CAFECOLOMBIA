const { Client } = require('ssh2');

const config = {
    host: '31.97.128.11',
    port: 22,
    username: 'root',
    password: 'Ssalazarca841209+',
};

const conn = new Client();

conn.on('ready', () => {
    console.log('Testing direct asset access...\n');

    const commands = [
        'echo "=== Test CSS file ==="',
        'curl -I http://localhost:3001/assets/index-DpNqPfrU.css',
        'echo "=== Test JS file ==="',
        'curl -I http://localhost:3001/assets/index-CpPL9qG3.js',
        'echo "=== List actual files in assets ==="',
        'ls -lah /var/www/cafecolombia/dist/assets/',
    ].join(' && ');

    conn.exec(commands, (err, stream) => {
        if (err) {
            console.error('Error:', err);
            conn.end();
            return;
        }

        stream.on('close', (code) => {
            console.log(`\n✅ Test complete (code: ${code})`);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect(config);
