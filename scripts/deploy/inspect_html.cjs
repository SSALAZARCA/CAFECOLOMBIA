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
    'echo "=== Full index.html content ==="',
    'cat dist/index.html',
    'echo "\n=== Assets folder ==="',
    'ls -lah dist/assets/',
    'echo "\n=== Testing HTTP response ==="',
    'curl -v http://localhost:3001/ 2>&1 | head -50',
    'echo "\n=== Testing static JS file ==="',
    'ls dist/assets/*.js | head -1 | xargs -I {} curl -I http://localhost:3001/assets/$(basename {})',
];

const conn = new Client();

conn.on('ready', () => {
    console.log('🔌 Inspecting frontend files...\n');

    conn.exec(commands.join(' && '), (err, stream) => {
        if (err) {
            console.error('❌ Error:', err);
            conn.end();
            return;
        }

        stream.on('close', (code) => {
            console.log(`\n✅ Inspection complete (code: ${code})`);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect(config);
