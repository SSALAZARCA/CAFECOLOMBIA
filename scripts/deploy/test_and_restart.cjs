const { Client } = require('ssh2');

const config = {
    host: '31.97.128.11',
    port: 22,
    username: 'root',
    password: 'Ssalazarca841209+',
};

const conn = new Client();

conn.on('ready', () => {
    console.log('Testing current server state...\n');

    const commands = [
        'echo "=== 1. PM2 Status ==="',
        'pm2 list | grep cafecolombia',
        'echo "\n=== 2. Server Process ==="',
        'ps aux | grep "api/server.cjs" | grep -v grep',
        'echo "\n=== 3. Test index.html ==="',
        'curl -I http://localhost:3001/ 2>&1 | head -15',
        'echo "\n=== 4. Test CSS ==="',
        'curl -I http://localhost:3001/assets/index-DpNqPfrU.css 2>&1',
        'echo "\n=== 5. Test JS ==="',
        'curl -I http://localhost:3001/assets/index-CpPL9qG3.js 2>&1',
        'echo "\n=== 6. Files exist? ==="',
        'ls -lah /var/www/cafecolombia/dist/assets/ | grep -E "index-"',
        'echo "\n=== 7. PM2 restart ==="',
        'pm2 restart cafecolombia',
        'sleep 2',
        'echo "\n=== 8. Test after restart ==="',
        'curl -I http://localhost:3001/ 2>&1 | head -10',
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
