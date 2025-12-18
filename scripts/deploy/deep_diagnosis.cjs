const { Client } = require('ssh2');

const config = {
    host: '31.97.128.11',
    port: 22,
    username: 'root',
    password: 'Ssalazarca841209+',
};

const conn = new Client();

conn.on('ready', () => {
    console.log('🔍 Deep server diagnosis...\n');

    const commands = [
        'cd /var/www/cafecolombia',
        'echo "=== 1. PM2 Status ==="',
        'pm2 list cafecolombia',
        'echo "\n=== 2. Server Process Info ==="',
        'ps aux | grep "api/server.cjs" | grep -v grep',
        'echo "\n=== 3. Listening Ports ==="',
        'netstat -tlnp | grep 3001',
        'echo "\n=== 4. Dist Directory Structure ==="',
        'ls -lah dist/',
        'echo "\n=== 5. Assets Directory ==="',
        'ls -lah dist/assets/ | head -10',
        'echo "\n=== 6. Test index.html access ==="',
        'curl -I http://localhost:3001/ 2>&1 | head -20',
        'echo "\n=== 7. Test CSS file access ==="',
        'curl -I http://localhost:3001/assets/index-DpNqPfrU.css 2>&1',
        'echo "\n=== 8. Test JS file access ==="',
        'curl -I http://localhost:3001/assets/index-CpPL9qG3.js 2>&1',
        'echo "\n=== 9. PM2 Logs (last 30 lines) ==="',
        'pm2 logs cafecolombia --lines 30 --nostream 2>&1 | tail -50',
        'echo "\n=== 10. Check server.cjs static config ==="',
        'grep -A 10 "STATIC FILES" api/server.cjs',
    ].join(' && ');

    conn.exec(commands, (err, stream) => {
        if (err) {
            console.error('❌ Error:', err);
            conn.end();
            return;
        }

        let output = '';

        stream.on('close', (code) => {
            console.log(`\n✅ Diagnosis complete (exit code: ${code})`);

            // Analysis
            console.log('\n📊 ANALYSIS:');
            if (output.includes('HTTP/1.1 200')) {
                console.log('✅ Server responding to HTTP requests');
            }
            if (output.includes('404') || output.includes('Not Found')) {
                console.log('⚠️  404 errors detected in asset requests');
            }
            if (output.includes('online') || output.includes('LISTEN')) {
                console.log('✅ Server is running and listening');
            }

            conn.end();
        }).on('data', (data) => {
            const text = data.toString();
            output += text;
            process.stdout.write(text);
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect(config);
