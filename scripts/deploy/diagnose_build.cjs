const { Client } = require('ssh2');

const config = {
    host: '31.97.128.11',
    port: 22,
    username: 'root',
    password: 'Ssalazarca841209+',
    remotePath: '/var/www/cafecolombia'
};

const diagCommands = [
    `cd ${config.remotePath}`,
    'echo "=== Node version ==="',
    'node --version',
    'echo "=== NPM version ==="',
    'npm --version',
    'echo "=== Attempting build with full output ==="',
    'export NODE_OPTIONS="--max-old-space-size=4096" && npm run build 2>&1 | tee build_error.log',
    'echo "=== Last 100 lines of build log ==="',
    'tail -100 build_error.log'
];

const conn = new Client();

conn.on('ready', () => {
    console.log('🔌 Connected to remote server');

    const command = diagCommands.join(' && ');

    conn.exec(command, (err, stream) => {
        if (err) {
            console.error('❌ Error executing command:', err);
            conn.end();
            return;
        }

        stream.on('close', (code) => {
            console.log(`\n⚡ Command completed with code: ${code}`);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect(config);
