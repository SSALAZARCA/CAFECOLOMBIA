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
    'echo "=== Checking current dist status ==="',
    'ls -lah dist/ || echo "dist folder does not exist"',
    'echo "=== Rebuilding frontend with export ==="',
    'export NODE_OPTIONS="--max-old-space-size=4096"',
    'npm run build 2>&1 | tee rebuild.log',
    'echo "=== Checking dist after build ==="',
    'ls -lah dist/',
    'echo "=== Checking dist/index.html ==="',
    'cat dist/index.html | head -50',
    'echo "=== Restarting PM2 ==="',
    'pm2 restart cafecolombia',
    'pm2 list',
    'echo "=== Testing frontend ==="',
    'curl -I http://localhost:3001/',
];

const conn = new Client();

conn.on('ready', () => {
    console.log('🔌 Connected to VPS');

    const command = commands.join(' && ');

    conn.exec(command, (err, stream) => {
        if (err) {
            console.error('❌ Error:', err);
            conn.end();
            return;
        }

        let stdout = '';
        let stderr = '';

        stream.on('close', (code) => {
            console.log(`\n⚡ Command completed with code: ${code}`);

            if (code !== 0) {
                console.error('\n❌ Build failed. Check logs above.');
            } else {
                console.log('\n✅ Frontend rebuild complete!');
            }

            conn.end();
        }).on('data', (data) => {
            const text = data.toString();
            stdout += text;
            process.stdout.write(text);
        }).stderr.on('data', (data) => {
            const text = data.toString();
            stderr += text;
            process.stderr.write(text);
        });
    });
}).connect(config);
