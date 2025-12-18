const { Client } = require('ssh2');

const config = {
    host: '31.97.128.11',
    port: 22,
    username: 'root',
    password: 'Ssalazarca841209+',
};

const conn = new Client();

conn.on('ready', () => {
    console.log('Testing from external IP simulation...\n');

    const commands = [
        'cd /var/www/cafecolombia',
        'echo "=== Flush logs ==="',
        'pm2 flush cafecolombia',
        'sleep 1',
        'echo "=== Request from external IP (simulating browser) ==="',
        'curl -H "Origin: http://181.48.242.177" -H "User-Agent: Mozilla/5.0" http://31.97.128.11:3001/assets/index-DpNqPfrU.css > /dev/null 2>&1',
        'sleep 2',
        'echo "\n=== ERROR LOGS ==="',
        'tail -100 ~/.pm2/logs/cafecolombia-error.log',
        'echo "\n=== OUT LOGS ==="',
        'tail -50 ~/.pm2/logs/cafecolombia-out.log',
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
