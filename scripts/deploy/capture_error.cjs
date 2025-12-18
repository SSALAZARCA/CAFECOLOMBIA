const { Client } = require('ssh2');

const config = {
    host: '31.97.128.11',
    port: 22,
    username: 'root',
    password: 'Ssalazarca841209+',
};

const conn = new Client();

conn.on('ready', () => {
    console.log('Triggering error and capturing logs...\n');

    const commands = [
        'cd /var/www/cafecolombia',
        'echo "=== Clearing old logs ==="',
        'pm2 flush cafecolombia',
        'echo "=== Making request to trigger error ==="',
        'curl http://localhost:3001/assets/index-DpNqPfrU.css > /dev/null 2>&1',
        'sleep 1',
        'echo "\n=== Fresh error log ==="',
        'cat ~/.pm2/logs/cafecolombia-error.log',
        'echo "\n=== Fresh out log ==="',
        'tail -100 ~/.pm2/logs/cafecolombia-out.log',
    ].join(' && ');

    conn.exec(commands, (err, stream) => {
        if (err) {
            console.error('Error:', err);
            conn.end();
            return;
        }

        stream.on('close', (code) => {
            console.log(`\n✅ Done (code: ${code})`);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect(config);
