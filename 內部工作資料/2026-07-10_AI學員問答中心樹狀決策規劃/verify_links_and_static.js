const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const pages = ['index.html', 'ai-student-qa.html'];
const publicExternal = [
  /^https:\/\/docs\.google\.com\/forms\//,
  /^https:\/\/line\.me\//,
  /^https:\/\/orikan347\.github\.io\//,
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
  /^https:\/\/www\.youtube\.com\/embed\//,
  /^https:\/\/www\.instagram\.com\//,
  /^https:\/\/lihi\.cc\//,
  /^mailto:/,
  /^tel:/
];
const ignored = [/^#/, /^javascript:/, /^\$\{/, /^$/];
const issues = [];

function collectRefs(file) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const refs = [];
  const regex = /\b(?:href|src)=["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(html))) refs.push(match[1]);
  return refs;
}

function checkRef(source, ref) {
  if (ignored.some((pattern) => pattern.test(ref))) return;
  if (/^https?:\/\//.test(ref) || /^mailto:|^tel:/.test(ref)) {
    if (!publicExternal.some((pattern) => pattern.test(ref))) {
      issues.push(`${source}: external ref should be reviewed: ${ref}`);
    }
    return;
  }
  const clean = decodeURIComponent(ref.split('#')[0].split('?')[0]);
  if (!clean) return;
  const target = path.resolve(root, clean);
  if (!target.startsWith(root)) {
    issues.push(`${source}: path escapes root: ${ref}`);
    return;
  }
  if (!fs.existsSync(target)) issues.push(`${source}: missing local file: ${ref}`);
}

pages.forEach((page) => {
  collectRefs(page).forEach((ref) => checkRef(page, ref));
});

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const qaHtml = fs.readFileSync(path.join(root, 'ai-student-qa.html'), 'utf8');
const stateMachine = fs.readFileSync(path.join(root, 'lib/state-machine.js'), 'utf8');
[
  ['index has AI QA entry', /ai-student-qa\.html/.test(indexHtml)],
  ['qa has state machine script', /lib\/state-machine\.js/.test(qaHtml)],
  ['qa has four button CSS', /\.option-actions/.test(qaHtml) && /\.option-button/.test(qaHtml)],
  ['qa hides completed option groups', /function retireOptionButtons\(\)/.test(qaHtml) && /\.option-actions\.is-complete\s*\{\s*display:\s*none;/.test(qaHtml)],
  ['qa has product field', /name="product"/.test(qaHtml)],
  ['qa has fourth DISC question', /name="disc_hate_think"/.test(qaHtml)],
  ['qa has course path button above report', qaHtml.indexOf('id="showCoursePathButton"') < qaHtml.indexOf('id="reportCard"')],
  ['qa keeps share download alive long enough', /function downloadBlob\(blob\)/.test(qaHtml) && /setTimeout\(\(\) => URL\.revokeObjectURL\(url\), 1500\)/.test(qaHtml)],
  ['qa has line CTA', /https:\/\/line\.me\/ti\/p\/jzdho94spl/.test(qaHtml)],
  ['qa has signup CTA', /docs\.google\.com\/forms/.test(qaHtml)],
  ['state machine uses no invented target line', !/目標貫通線/.test(stateMachine)],
  ['state machine does not gift the brand slogan', !/銷售力不從心，因為從沒遇過李泰欣。/.test(stateMachine)]
].forEach(([label, ok]) => {
  if (!ok) issues.push(label);
});

const visibleBadPatterns = [
  /<b>|<\/b>/i,
  /\[object Object\]/,
  /你先跟我說清楚/,
  /你想把哪一句話/,
  /目標貫通線/,
  /不是叫你一次全買/,
  /我目前不直接猜/,
  /我先不急著推薦課程/
];
visibleBadPatterns.forEach((pattern) => {
  if (pattern.test(indexHtml) || pattern.test(qaHtml)) issues.push(`visible bad text: ${pattern}`);
});

if (issues.length) {
  console.error(issues.join('\n'));
  process.exit(1);
}

console.log('PASS static links and required UI checks');
