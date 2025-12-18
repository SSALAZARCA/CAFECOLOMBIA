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
    'echo "=== Checking dist folder ==="',
    'ls -lah dist/',
    'echo "=== Checking dist/assets folder ==="',
    'ls -lah dist/assets/',
    'echo "=== Finding the specific JS file ==="',
    'find dist/ -name "*CpPL9qG3.js*"',
    'find dist/ -name "*DpNqPfrU.css*"',
    'echo "=== Full tree of dist ==="',
    'tree -L 2 dist/ || find dist/ -type f | head -30',
];

const conn = new Client();

conn.on('ready', () => {
    console.log('Checking dist/assets on VPS...\n');

    conn.exec(commands.join(' && '), (err, stream) => {
        if (err) {
            console.error('Error:', err);
            conn.end();
            return;
        }

        stream.on('close', (code) => {
            console.log(`\n✅ Check complete (code: ${code})`);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect(config);
