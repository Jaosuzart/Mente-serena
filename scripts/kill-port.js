'use strict';

const { execSync } = require('child_process');

try { require('dotenv').config({ path: '.env.development' }); } catch (_) {}

const PORT = process.env.PORT || 3000;

function killPort(port) {
    const isWindows = process.platform === 'win32';

    try {
        if (isWindows) {
            // Pega o PID que usa a porta
            const result = execSync(
                `netstat -ano | findstr :${port}`,
                { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
            );

            const pids = new Set();
            result.split('\n').forEach(line => {
                if (!line.includes('LISTENING')) return;
                const parts = line.trim().split(/\s+/);
                const pid = parts[parts.length - 1];
                if (pid && /^\d+$/.test(pid) && pid !== '0') {
                    pids.add(pid);
                }
            });

            if (pids.size === 0) {
                console.log(`✅ Porta ${port} livre.`);
                return;
            }

            for (const pid of pids) {
                try {
                    execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
                    console.log(`🔫 Processo PID ${pid} finalizado (porta ${port} liberada).`);
                } catch (_) {
                    console.warn(`⚠️  Não foi possível finalizar PID ${pid} (já encerrado?).`);
                }
            }
        } else {
            execSync(`lsof -ti tcp:${port} | xargs -r kill -9`, { stdio: 'ignore' });
            console.log(`🔫 Porta ${port} liberada.`);
        }
    } catch (err) {
        if (err.status === 1) {
            console.log(`✅ Porta ${port} livre.`);
        } else {
            console.warn(`⚠️  kill-port: ${err.message}`);
        }
    }
}

killPort(PORT);
