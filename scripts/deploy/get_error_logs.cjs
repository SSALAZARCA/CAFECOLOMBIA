const { Client } = require('ssh2');

const config = {
    host: '31.97.128.11',
    port: 22,
    username: 'root',
    password: 'Ssalazarca841209+',
};

const conn = new Client();

conn.on('ready', () => {
    console.log('Fetching server error logs...\n');

    const commands = [
        'cd /var/www/cafecolombia',
        'echo "=== PM2 Status ==="',
        'pm2 list',
        'echo "\n=== PM2 Error Logs (last 50 lines) ==="',
        'pm2 logs cafecolombia --err --lines 50 --nostream',
        'echo "\n=== PM2 Out Logs (last 30 lines) ==="',
        'pm2 logs cafecolombia --out --lines 30 --nostream',
        'echo "\n=== Test asset request ==="',
        'curl -v http://localhost:3001/assets/index-DpNqPfrU.css 2>&1 | head -40',
    ].join(' && ');

    conn.exec(commands, (err, stream) => {
        if (err) {
            console.error('Error:', err);
            conn.end();
            return;
        }

        stream.on('close', (code) => {
            console.log(`\n✅ Logs fetched (code: ${code})`);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect(config);
