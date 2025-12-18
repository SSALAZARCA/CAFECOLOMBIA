const { Client } = require('ssh2');

const config = {
    host: '31.97.128.11',
    port: 22,
    username: 'root',
    password: 'Ssalazarca841209+',
};

const conn = new Client();

conn.on('ready', () => {
    console.log('Testing HTTP response from server...\n');

    const cmd = 'curl -v http://localhost:3001/ 2>&1';

    conn.exec(cmd, (err, stream) => {
        if (err) {
            console.error('Error:', err);
            conn.end();
            return;
        }

        let output = '';

        stream.on('close', () => {
            console.log('\n=== HTTP Response ===');
            console.log(output);

            // Check if HTML is being served
            if (output.includes('<html') || output.includes('<!doctype')) {
                console.log('\n✅ HTML is being served');
            } else {
                console.log('\n❌ HTML not found in response');
            }

            conn.end();
        }).on('data', (data) => {
            output += data.toString();
        });
    });
}).connect(config);
