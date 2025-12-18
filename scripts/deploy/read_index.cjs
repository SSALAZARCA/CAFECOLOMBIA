const { Client } = require('ssh2');

const config = {
    host: '31.97.128.11',
    port: 22,
    username: 'root',
    password: 'Ssalazarca841209+',
};

const conn = new Client();

conn.on('ready', () => {
    console.log('Reading index.html...\n');

    conn.exec('cat /var/www/cafecolombia/dist/index.html', (err, stream) => {
        if (err) {
            console.error('Error:', err);
            conn.end();
            return;
        }

        let content = '';

        stream.on('close', () => {
            console.log(content);
            console.log('\n=================\n');
            conn.end();
        }).on('data', (data) => {
            content += data.toString();
        });
    });
}).connect(config);
