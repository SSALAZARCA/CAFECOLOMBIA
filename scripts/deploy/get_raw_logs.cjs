const { Client } = require('ssh2');

const config = {
    host: '31.97.128.11',
    port: 22,
    username: 'root',
    password: 'Ssalazarca841209+',
};

const conn = new Client();

conn.on('ready', () => {
    console.log('Getting PM2 error log file...\n');

    const commands = [
        'echo "=== Finding PM2 log files ==="',
        'ls -lah ~/.pm2/logs/ | grep cafecolombia',
        'echo "\n=== Reading error log (last 100 lines) ==="',
        'tail -100 ~/.pm2/logs/cafecolombia-error.log',
        'echo "\n=== Reading out log (last 50 lines) ==="',
        'tail -50 ~/.pm2/logs/cafecolombia-out.log',
    ].join(' && ');

    conn.exec(commands, (err, stream) => {
        if (err) {
            console.error('Error:', err);
            conn.end();
            return;
        }

        let fullOutput = '';

        stream.on('close', (code) => {
            console.log(`\n\n=================`);
            console.log('✅ Logs retrieved');
            console.log(`=================\n`);

            // Try to find error patterns
            if (fullOutput.includes('Error:') || fullOutput.includes('TypeError:') || fullOutput.includes('at ')) {
                console.log('🔴 ERRORS FOUND IN LOGS');
            }

            conn.end();
        }).on('data', (data) => {
            const text = data.toString();
            fullOutput += text;
            process.stdout.write(text);
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect(config);
