const fs = require('fs');
const path = require('path');
const { createCoverageMap } = require('istanbul-lib-coverage');
const { createContext } = require('istanbul-lib-report');
const reports = require('istanbul-reports');

const root = path.join(__dirname, '..');
const map = createCoverageMap({});

for (const name of ['unit', 'e2e']) {
  const file = path.join(root, 'coverage', name, 'coverage-final.json');
  map.merge(JSON.parse(fs.readFileSync(file, 'utf8')));
}

const dir = path.join(root, 'coverage');
fs.mkdirSync(dir, { recursive: true });
const context = createContext({ dir, coverageMap: map });
reports.create('text-summary').execute(context);

// Floors sit just under the merged unit + HTTP report. `yarn test:cov` fails
// when a change drops the suite below them.
const minimum = {
  statements: 88,
  branches: 84,
  functions: 87,
  lines: 88,
};

const summary = map.getCoverageSummary();
const failures = [];
for (const key of Object.keys(minimum)) {
  const actual = summary[key].pct;
  if (actual < minimum[key]) {
    failures.push(`${key} is ${actual}%, below ${minimum[key]}%`);
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
