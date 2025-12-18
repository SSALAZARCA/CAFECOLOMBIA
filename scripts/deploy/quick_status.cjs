const { Client } = require('ssh2');

const config = {
    host: '31.97.128.11',
    port: 22,
    username: 'root',
    password: 'Ssalazarca841209+',
    remotePath: '/var/www/cafecolombia'
};

const commands = [
    `cd ${config.remotePath}`,
    'echo "=== PM2 Status ==="',
    'pm2 list',
    'echo "=== PM2 Logs (last 20 lines) ==="',
    'pm2 logs cafecolombia --lines 20 --nostream',
    'echo "=== Dist folder contents ==="',
    'ls -lah dist/ | head -30',
    'echo "=== Dist/index.html exists? ==="',
    'test -f dist/index.html && echo "YES - index.html exists" || echo "NO - index.html missing"',
    'echo "=== Server listening? ==="',
    'netstat -tlnp | grep 3001',
];

const conn = new Client();

conn.on('ready', () => {
    console.log('🔌 Checking VPS status...\n');

    conn.exec(commands.join(' && '), (err, stream) => {
        if (err) {
            console.error('❌ Error:', err);
            conn.end();
            return;
        }

        stream.on('close', (code) => {
            console.log(`\n✅ Status check complete`);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect(config);
