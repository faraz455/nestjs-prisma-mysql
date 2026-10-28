const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// Floors are the published fixes for packages that sign tokens or parse
// requests. Other majors of path-to-regexp stay; only the Express 0.1 line
// is on the router.
const minimum = {
  jws: [3, 2, 3],
  'body-parser': [1, 20, 9],
  'proxy-addr': [2, 0, 8],
};

const pathToRegexpFloor = [0, 1, 13];

function parseVersion(version) {
  return String(version)
    .split('.')
    .slice(0, 3)
    .map((part) => Number.parseInt(part, 10));
}

function below(version, floor) {
  const parts = parseVersion(version);
  for (let i = 0; i < floor.length; i += 1) {
    const actual = parts[i] ?? 0;
    if (actual < floor[i]) return true;
    if (actual > floor[i]) return false;
  }
  return false;
}

function collect(dir, found) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === '.bin') continue;
    const full = path.join(dir, entry.name);
    if (entry.name === 'node_modules') {
      collect(full, found);
      continue;
    }
    if (entry.name.startsWith('@')) {
      collect(full, found);
      continue;
    }
    const manifestPath = path.join(full, 'package.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (
        manifest.name === 'jws' ||
        manifest.name === 'body-parser' ||
        manifest.name === 'proxy-addr' ||
        manifest.name === 'path-to-regexp'
      ) {
        found.push({ name: manifest.name, version: manifest.version });
      }
    }
    const nested = path.join(full, 'node_modules');
    if (fs.existsSync(nested)) collect(nested, found);
  }
}

const found = [];
collect(path.join(root, 'node_modules'), found);

const failures = [];
for (const name of Object.keys(minimum)) {
  const copies = found.filter((item) => item.name === name);
  if (copies.length === 0) {
    failures.push(`${name} is not installed`);
    continue;
  }
  for (const copy of copies) {
    if (below(copy.version, minimum[name])) {
      failures.push(
        `${name} ${copy.version} is behind ${minimum[name].join('.')}`,
      );
    }
  }
}

const routers = found.filter((item) => item.name === 'path-to-regexp');
for (const copy of routers) {
  const parts = parseVersion(copy.version);
  if (
    parts[0] === 0 &&
    parts[1] === 1 &&
    below(copy.version, pathToRegexpFloor)
  ) {
    failures.push(
      `path-to-regexp ${copy.version} is behind ${pathToRegexpFloor.join('.')}`,
    );
  }
}

const required = ['jws', 'body-parser', 'path-to-regexp'];
for (const name of required) {
  if (!found.some((item) => item.name === name)) {
    if (!failures.some((line) => line.startsWith(name))) {
      failures.push(`${name} is not installed`);
    }
  }
}

const seen = new Set();
for (const item of found) {
  const line = `${item.name} ${item.version}`;
  if (seen.has(line)) continue;
  seen.add(line);
  console.log(line);
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
