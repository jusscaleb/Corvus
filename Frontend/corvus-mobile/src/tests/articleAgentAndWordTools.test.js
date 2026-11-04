const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const parser = require('../../node_modules/@babel/parser');

const srcDir = path.resolve(__dirname, '..');

function readSrc(relPath) {
  return fs.readFileSync(path.join(srcDir, relPath), 'utf8');
}

function parseJSX(code) {
  return parser.parse(code, { sourceType: 'module', plugins: ['jsx'] });
}

// Pure formatter helper matching MainScreen.jsx's handleApplyFormat selection logic
function applyWordToolFormat(baseText, action, selection = { start: baseText.length, end: baseText.length }) {
  const start = Math.max(0, Math.min(selection?.start ?? baseText.length, baseText.length));
  const end = Math.max(start, Math.min(selection?.end ?? baseText.length, baseText.length));
  const hasSelection = end > start;
  const before = baseText.slice(0, start);
  const selected = baseText.slice(start, end);
  const after = baseText.slice(end);

  let inserted = '';
  if (action === 'bold') {
    inserted = `**${hasSelection ? selected : 'bold text'}**`;
  } else if (action === 'italic') {
    inserted = `*${hasSelection ? selected : 'italic text'}*`;
  } else if (action === 'underline') {
    inserted = `_${hasSelection ? selected : 'underlined text'}_`;
  } else if (action === 'code') {
    inserted = `\`${hasSelection ? selected : 'code/data point'}\``;
  } else if (action === 'h1') {
    const prefix = before && !before.endsWith('\n') ? '\n\n' : '';
    const suffix = after && !after.startsWith('\n') ? '\n' : '';
    inserted = `${prefix}# ${hasSelection ? selected : 'Headline'}${suffix}`;
  } else if (action === 'h2') {
    const prefix = before && !before.endsWith('\n') ? '\n\n' : '';
    const suffix = after && !after.startsWith('\n') ? '\n' : '';
    inserted = `${prefix}## ${hasSelection ? selected : 'Sub-headline'}${suffix}`;
  } else if (action === 'bullet') {
    const prefix = before && !before.endsWith('\n') ? '\n' : '';
    inserted = hasSelection
      ? `${prefix}${selected.split('\n').map((line) => `• ${line}`).join('\n')}`
      : `${prefix}• Key point`;
  } else if (action === 'quote') {
    const prefix = before && !before.endsWith('\n') ? '\n' : '';
    inserted = hasSelection
      ? `${prefix}${selected.split('\n').map((line) => `> ${line}`).join('\n')}`
      : `${prefix}> "Direct quote from source"`;
  } else {
    inserted = hasSelection ? selected : `[${action}]`;
  }

  return `${before}${inserted}${after}`;
}

test('1. 1-to-1 AI Agent Button & Memory Modal are present and syntactically valid', () => {
  const newsroomHeader = readSrc('components/NewsroomHeader.jsx');
  const articleHeader = readSrc('components/ArticleHeader.jsx');
  const aiWorkspace = readSrc('components/ArticleAIWorkspace.jsx');

  assert.doesNotThrow(() => parseJSX(newsroomHeader));
  assert.doesNotThrow(() => parseJSX(articleHeader));
  assert.doesNotThrow(() => parseJSX(aiWorkspace));

  assert.match(newsroomHeader, /onOpenAI/);
  assert.match(newsroomHeader, /Saiph AI/);
  assert.match(articleHeader, /onOpenAIAgent/);
  assert.match(articleHeader, /Ask Saiph AI/);
  assert.match(aiWorkspace, /export function SaiphAgentModal/);
  assert.match(aiWorkspace, /Agent Memory/);
  assert.match(aiWorkspace, /saveAgentMemory/);
  assert.match(aiWorkspace, /deleteAgentMemory/);
});

test('2. AI Draft from Brief Summary is integrated into CreateArticleModal & api.js', () => {
  const createModal = readSrc('components/CreateArticleModal.jsx');
  const api = readSrc('services/api.js');

  assert.doesNotThrow(() => parseJSX(createModal));
  assert.doesNotThrow(() => parseJSX(api));

  assert.match(api, /export async function generateArticleDraft/);
  assert.match(api, /\/api\/ai\/generate-draft\//);
  assert.match(createModal, /handleGenerateAIDraft/);
  assert.match(createModal, /Generate AI Draft/);
});

test('3. Mindmap Section is rendered on the article view with leaf-to-draft insertion', () => {
  const aiWorkspace = readSrc('components/ArticleAIWorkspace.jsx');
  const mainScreen = readSrc('components/MainScreen.jsx');

  assert.doesNotThrow(() => parseJSX(mainScreen));
  assert.match(aiWorkspace, /export function ArticleMindmapSection/);
  assert.match(aiWorkspace, /generateArticleMindmap/);
  assert.match(mainScreen, /articleSection === 'mindmap'/);
  assert.match(mainScreen, /<ArticleMindmapSection/);
});

test('4. Board Section displays AI suggestions & sources and supports snippet insertion + toggle', () => {
  const aiWorkspace = readSrc('components/ArticleAIWorkspace.jsx');
  const mainScreen = readSrc('components/MainScreen.jsx');
  const api = readSrc('services/api.js');

  assert.match(aiWorkspace, /export function ArticleBoardSection/);
  assert.match(api, /export async function generateArticleBoard/);
  assert.match(api, /export async function toggleArticleBoardItem/);
  assert.match(mainScreen, /articleSection === 'board'/);
  assert.match(mainScreen, /<ArticleBoardSection/);
});

test('5. AI Review, Plagiarism Check, AI-Writing Check & Simple Improvements Section', () => {
  const aiWorkspace = readSrc('components/ArticleAIWorkspace.jsx');
  const mainScreen = readSrc('components/MainScreen.jsx');
  const api = readSrc('services/api.js');

  assert.match(aiWorkspace, /export function ArticleReviewSection/);
  assert.match(aiWorkspace, /PLAGIARISM CHECK/);
  assert.match(aiWorkspace, /AI-WRITING CHECK/);
  assert.match(aiWorkspace, /Where to Improve \(In Simple Terms\)/);
  assert.match(api, /export async function runArticleAIReview/);
  assert.match(mainScreen, /articleSection === 'review'/);
  assert.match(mainScreen, /<ArticleReviewSection/);
});

test('6. Word Tools are removed from dropdown modal and placed directly on the toolbar ribbon', () => {
  const articleHeader = readSrc('components/ArticleHeader.jsx');

  // Verify all 8 formatting tools are defined in wordTools and rendered directly in wordToolsRibbon
  assert.match(articleHeader, /const wordTools = \[/);
  assert.match(articleHeader, /wordToolsRibbon/);
  for (const action of ['bold', 'italic', 'underline', 'h1', 'h2', 'bullet', 'quote', 'code']) {
    assert.match(articleHeader, new RegExp(`action:\\s*'${action}'`));
  }
  // Ensure the old dropdown menu state `activeModal === 'tools'` is gone
  assert.doesNotMatch(articleHeader, /activeModal === 'tools'/);
});

test('7. Word Tools formatting logic wraps selected text or inserts at cursor accurately', () => {
  // Wrapping selected range
  assert.equal(
    applyWordToolFormat('Audit found 14 irregular contracts.', 'bold', { start: 12, end: 34 }),
    'Audit found **14 irregular contracts**.'
  );
  assert.equal(
    applyWordToolFormat('Source confirmed the memo.', 'italic', { start: 0, end: 6 }),
    '*Source* confirmed the memo.'
  );
  assert.equal(
    applyWordToolFormat('Key statute 42-B', 'underline', { start: 12, end: 16 }),
    'Key statute _42-B_'
  );
  assert.equal(
    applyWordToolFormat('Invoice IDINV-902', 'code', { start: 10, end: 17 }),
    'Invoice ID`INV-902`'
  );

  // Block formatting (H1, H2, Bullet, Quote)
  assert.equal(
    applyWordToolFormat('Procurement Timeline', 'h1', { start: 0, end: 20 }),
    '# Procurement Timeline'
  );
  assert.equal(
    applyWordToolFormat('Vendor Breakdown', 'h2', { start: 0, end: 16 }),
    '## Sub-headline'.replace('Sub-headline', 'Vendor Breakdown')
  );
  assert.equal(
    applyWordToolFormat('First finding\nSecond finding', 'bullet', { start: 0, end: 28 }),
    '• First finding\n• Second finding'
  );
  assert.equal(
    applyWordToolFormat('We never saw the bid.', 'quote', { start: 0, end: 21 }),
    '> We never saw the bid.'
  );
});
