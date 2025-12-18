const { Client } = require('ssh2');

const config = {
    host: '31.97.128.11',
    port: 22,
    username: 'root',
    password: 'Ssalazarca841209+',
    remotePath: '/var/www/cafecolombia'
};

const diagCommands = [
    `cd ${config.remotePath}`,
    'echo "=== Checking dist directory ==="',
    'ls -lah dist/',
    'echo "=== Checking dist/index.html ==="',
    'ls -lah dist/index.html',
    'echo "=== Checking dist/assets ==="',
    'ls -lah dist/assets/ | head -20',
    'echo "=== Checking server.cjs static middleware ==="',
    'grep -A 5 "express.static" api/server.cjs',
    'echo "=== PM2 status ==="',
    'pm2 list',
    'echo "=== Last 30 lines of PM2 logs ==="',
    'pm2 logs cafecolombia --lines 30 --nostream',
];

const conn = new Client();

conn.on('ready', () => {
    console.log('🔌 Connected to VPS for diagnostics');

    const command = diagCommands.join(' && ');

    conn.exec(command, (err, stream) => {
        if (err) {
            console.error('❌ Error:', err);
            conn.end();
            return;
        }

        stream.on('close', (code) => {
            console.log(`\n✅ Diagnostics complete (code: ${code})`);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect(config);
