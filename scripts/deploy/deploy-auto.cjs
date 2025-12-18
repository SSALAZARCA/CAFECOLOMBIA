const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Configuration
const config = {
    host: '31.97.128.11',
    port: 22,
    username: 'root',
    password: 'Ssalazarca841209+',
    remotePath: '/var/www/cafecolombia',
    localZip: 'deploy_package.zip'
};

const commands = [
    `mkdir -p ${config.remotePath}`,
    `cd ${config.remotePath}`,
    'if ! command -v unzip &> /dev/null; then apt-get update && apt-get install -y unzip; fi',
    `rm -rf ${config.remotePath}/api`, // Clean api folder to remove bad files
    `unzip -o -q ${config.localZip} && echo "✅ Unzip complete"`, // Quiet unzip
    `rm ${config.localZip}`,
    'echo "🔄 Starting npm install..." && npm install --quiet --ignore-scripts && echo "✅ npm install complete"', // Quiet install without postinstall build
    'echo "🔄 Starting frontend build..." && export NODE_OPTIONS="--max-old-space-size=4096" && npm run build && echo "✅ Frontend build complete"', // Build frontend with increased memory
    'echo "🔄 Starting backend build..." && npm run server:build && echo "✅ Backend build complete"', // Build backend
    'pm2 stop cafecolombia || true',
    'export PORT=3001 && pm2 start api/server.cjs --name "cafecolombia" --update-env',
    'pm2 save',
    'pm2 list'
];

async function zipDirectory() {
    return new Promise((resolve, reject) => {
        console.log('📦 Zipping files...');
        const output = fs.createWriteStream(config.localZip);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`📦 Zip created: ${archive.pointer()} total bytes`);
            resolve();
        });

        archive.on('error', (err) => reject(err));

        archive.pipe(output);

        // Add directories
        archive.directory('api/', 'api');
        archive.directory('scripts/', 'scripts');
        archive.directory('src/', 'src');
        archive.directory('public/', 'public');

        // Add root files
        ['package.json', 'package-lock.json', 'vite.config.ts', 'tsconfig.json', 'index.html', 'postcss.config.js', 'tailwind.config.js'].forEach(file => {
            if (fs.existsSync(file)) archive.file(file, { name: file });
        });

        // Add correct .env for production if available, mapped to .env
        if (fs.existsSync('.env.production')) {
            archive.file('.env.production', { name: '.env' });
            // Also copy to api/.env just in case
            archive.file('.env.production', { name: 'api/.env' });
        } else if (fs.existsSync('.env')) {
            archive.file('.env', { name: '.env' });
            archive.file('.env', { name: 'api/.env' });
        }

        archive.finalize();
    });
}

function uploadFile(conn) {
    return new Promise((resolve, reject) => {
        console.log('🚀 Uploading zip...');
        conn.sftp((err, sftp) => {
            if (err) return reject(err);

            const remoteZipPath = `${config.remotePath}/${config.localZip}`;
            const readStream = fs.createReadStream(config.localZip);
            const writeStream = sftp.createWriteStream(remoteZipPath);

            writeStream.on('close', () => {
                console.log('✅ Upload complete');
                resolve();
            });

            writeStream.on('error', reject);
            readStream.pipe(writeStream);
        });
    });
}

function executeCommands(conn) {
    return new Promise((resolve, reject) => {
        console.log('🔧 Executing remote commands...');
        // Chain commands
        const cmdString = commands.join(' && ');

        conn.exec(cmdString, (err, stream) => {
            if (err) return reject(err);

            stream.on('close', (code, signal) => {
                console.log(`Command stream closed with code: ${code}, signal: ${signal}`);
                if (code === 0) resolve();
                else reject(new Error(`Remote commands failed with code ${code}`));
            }).on('data', (data) => {
                process.stdout.write('REMOTE: ' + data);
            }).stderr.on('data', (data) => {
                process.stderr.write('REMOTE ERR: ' + data);
            });
        });
    });
}

async function deploy() {
    try {
        // 1. Build frontend (optional, assuming already built or running build script separately)
        // Uncomment if you want to build inside this script:
        // require('child_process').execSync('npm run build', { stdio: 'inherit' });

        // 2. Zip
        await zipDirectory();

        // 3. Connect & Upload & Execute
        const conn = new Client();

        await new Promise((resolve, reject) => {
            conn.on('ready', async () => {
                try {
                    console.log('🔌 Connected via SSH');

                    console.log('📁 Creating remote directory...');
                    conn.exec(`mkdir -p ${config.remotePath}`, async (err, stream) => {
                        if (err) throw err;
                        stream.on('data', (data) => process.stdout.write('MKDIR OUT: ' + data))
                            .on('stderr', (data) => process.stderr.write('MKDIR ERR: ' + data))
                            .on('close', async () => {
                                console.log('📁 Directory created or exists.');
                                await uploadFile(conn);
                                await executeCommands(conn);
                                resolve();
                            });
                    });

                } catch (e) {
                    reject(e);
                }
            }).on('error', reject).connect(config);
        });

        console.log('🎉 DEPLOYMENT SUCCESSFUL');
        conn.end();

        // Cleanup
        if (fs.existsSync(config.localZip)) fs.unlinkSync(config.localZip);

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

deploy();
