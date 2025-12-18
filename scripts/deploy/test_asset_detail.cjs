const { Client } = require('ssh2');

const config = {
    host: '31.97.128.11',
    port: 22,
    username: 'root',
    password: 'Ssalazarca841209+',
};

const conn = new Client();

conn.on('ready', () => {
    console.log('Testing asset requests in detail...\n');

    const commands = [
        'cd /var/www/cafecolombia',
        'echo "=== Testing CSS file (full response, first 100 bytes) ==="',
        'curl -v http://localhost:3001/assets/index-DpNqPfrU.css 2>&1 | head -30',
        'echo "\n=== Testing if file actually returned content ==="',
        'curl http://localhost:3001/assets/index-DpNqPfrU.css 2>&1 | head -5',
        'echo "\n=== Testing index.html ==="',
        'curl http://localhost:3001/ 2>&1 | head -20',
        'echo "\n=== Checking if express.static is working ==="',
        'curl -I http://localhost:3001/manifest.webmanifest 2>&1',
        'echo "\n=== Testing from external IP (simulating browser) ==="',
        'curl -I http://31.97.128.11:3001/assets/index-DpNqPfrU.css 2>&1',
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
