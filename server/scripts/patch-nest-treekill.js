/**
 * Re-applies the Windows tree-kill patch after npm install.
 * Prevents "process not found" from crashing nest start --watch when the child already exited.
 * Only runs on Windows.
 */
const path = require('path');
const fs = require('fs');

if (process.platform !== 'win32') return;

const file = path.join(__dirname, '..', 'node_modules', '@nestjs', 'cli', 'lib', 'utils', 'tree-kill.js');
if (!fs.existsSync(file)) return;

let content = fs.readFileSync(file, 'utf8');
if (content.includes('Process may already have exited')) return; // already patched

const old = `function treeKillSync(pid, signal) {
    if (process.platform === 'win32') {
        (0, child_process_1.execSync)('taskkill /pid ' + pid + ' /T /F');
        return;
    }`;

const patched = `function treeKillSync(pid, signal) {
    if (process.platform === 'win32') {
        try {
            (0, child_process_1.execSync)('taskkill /pid ' + pid + ' /T /F');
        } catch (err) {
            // Process may already have exited; taskkill returns "process not found" on Windows.
            if (err.status !== 128 && err.status !== 1) throw err;
            const stderr = (err.stderr && err.stderr.toString()) || '';
            if (stderr && !/not found|no such process/i.test(stderr)) throw err;
        }
        return;
    }`;

if (!content.includes(old)) return;
content = content.replace(old, patched);
fs.writeFileSync(file, content);
console.log('Applied Nest CLI tree-kill patch for Windows (watch mode).');
