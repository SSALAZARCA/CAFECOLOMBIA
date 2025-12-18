const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '31.97.128.11',
    port: 22,
    username: 'root',
    password: 'Ssalazarca841209+',
};

const conn = new Client();

conn.on('ready', () => {
    console.log('Fetching index.html...\n');

    conn.exec('cat /var/www/cafecolombia/dist/index.html', (err, stream) => {
        if (err) {
            console.error('Error:', err);
            conn.end();
            return;
        }

        let content = '';

        stream.on('close', () => {
            // Save to file for inspection
            fs.writeFileSync('remote_index.html', content);
            console.log('\n✅ Saved to remote_index.html');
            console.log('\n=== CONTENT ===');
            console.log(content);
            conn.end();
        }).on('data', (data) => {
            content += data.toString();
        });
    });
}).connect(config);
