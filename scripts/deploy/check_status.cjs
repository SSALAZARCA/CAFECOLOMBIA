const { Client } = require('ssh2');

const config = {
    host: '31.97.128.11',
    port: 22,
    username: 'root',
    password: 'Ssalazarca841209+'
};

const commands = [
    'pm2 list',
    'echo "=== PORTS ==="',
    'netstat -tuln | grep 3001',
    'echo "=== LOGS HEAD ==="',
    'pm2 logs cafecolombia --lines 10 --nostream'
];

async function checkStatus() {
    const conn = new Client();
    await new Promise((resolve, reject) => {
        conn.on('ready', () => {
            console.log('Connected.');
            conn.exec(commands.join(' && '), (err, stream) => {
                if (err) throw err;
                stream.on('close', (code, signal) => {
                    console.log('Stream closed');
                    conn.end();
                    resolve();
                }).on('data', (data) => {
                    process.stdout.write(data);
                }).stderr.on('data', (data) => {
                    process.stderr.write(data);
                });
            });
        }).on('error', (err) => {
            console.error('Connection error:', err);
            reject(err);
        }).connect(config);
    });
}

checkStatus();
