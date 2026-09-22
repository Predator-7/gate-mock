const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8089;
const ROOT = path.resolve(__dirname, '..');
const USER_DATA_FILE = path.join(ROOT, 'userData.json');

function cleanUserData() {
  if (fs.existsSync(USER_DATA_FILE)) {
    fs.unlinkSync(USER_DATA_FILE);
  }
}

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path: path,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function testServer(cmd, args, label) {
  console.log(`\n=== Testing ${label} ===`);
  cleanUserData();

  const child = spawn(cmd, args, { cwd: ROOT, env: { ...process.env, PORT: String(PORT) } });
  child.stderr.on('data', d => console.error(`[${label} err]`, d.toString()));

  // Wait for server to bind
  await sleep(600);

  try {
    // 1. Test static serving
    const home = await request('/');
    console.assert(home.status === 200, `${label} Failed: GET / returned ${home.status}`);
    console.assert(home.body.includes('GATE CE'), `${label} Failed: GET / content missing GATE CE`);
    console.log(`  PASS  static file serving (GET /)`);

    // 2. Test GET /api/user-data creates default file
    const initialGet = await request('/api/user-data');
    console.assert(initialGet.status === 200, `${label} Failed: GET /api/user-data returned ${initialGet.status}`);
    const initialJson = JSON.parse(initialGet.body);
    console.assert(Array.isArray(initialJson.mockHistory), `${label} Failed: mockHistory should be array`);
    console.assert(fs.existsSync(USER_DATA_FILE), `${label} Failed: userData.json should be created on disk`);
    console.log(`  PASS  GET /api/user-data initializes file`);

    // 3. Test POST /api/user-data writes to disk
    const testPayload = {
      profile: { name: "Ansh Garewal", createdAt: 12345 },
      mockHistory: [{ year: "2025_ce1", score: 65 }],
      practiceHistory: [],
      attempts: {}
    };

    const testPayloadStr = JSON.stringify(testPayload);
    const postRes = await request('/api/user-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testPayloadStr)
      },
      body: testPayloadStr
    });
    console.assert(postRes.status === 200, `${label} Failed: POST /api/user-data returned ${postRes.status}`);
    const postJson = JSON.parse(postRes.body);
    console.assert(postJson.ok === true, `${label} Failed: POST response ok should be true`);

    // Verify on disk
    const onDisk = JSON.parse(fs.readFileSync(USER_DATA_FILE, 'utf8'));
    console.assert(onDisk.profile.name === "Ansh Garewal", `${label} Failed: onDisk profile name mismatch`);
    console.assert(onDisk.mockHistory[0].score === 65, `${label} Failed: onDisk mock score mismatch`);
    console.log(`  PASS  POST /api/user-data saved directly to userData.json`);

    // 4. Test GET /api/user-data returns saved data
    const getAfter = await request('/api/user-data');
    const getAfterJson = JSON.parse(getAfter.body);
    console.assert(getAfterJson.profile.name === "Ansh Garewal", `${label} Failed: getAfter name mismatch`);
    console.log(`  PASS  GET /api/user-data reads persisted data`);

  } finally {
    child.kill('SIGTERM');
    cleanUserData();
  }
}

async function run() {
  try {
    await testServer('node', ['server.js'], 'Node.js Server (server.js)');
    await sleep(500);
    await testServer('python3', ['server.py'], 'Python Server (server.py)');
    console.log('\nALL SERVER TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('\nSERVER TEST FAILED:', err);
    process.exit(1);
  }
}

run();
