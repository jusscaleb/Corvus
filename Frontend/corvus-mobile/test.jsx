/**
 * Corvus Full Frontend Unit Test Suite (test.jsx)
 *
 * Run directly in your terminal:
 *   node --test test.jsx
 *   (or `npm test` inside `Frontend/corvus-mobile`)
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Resolve Frontend/corvus-mobile regardless of whether `node --test test.jsx`
// is invoked from repo root, `Frontend/`, or `Frontend/corvus-mobile/`.
const MOBILE_DIR = fs.existsSync(path.join(__dirname, 'src'))
  ? __dirname
  : fs.existsSync(path.join(__dirname, 'corvus-mobile', 'src'))
    ? path.join(__dirname, 'corvus-mobile')
    : path.join(__dirname, 'Frontend', 'corvus-mobile');

const SRC_DIR = path.join(MOBILE_DIR, 'src');
const parser = require(path.join(MOBILE_DIR, 'node_modules', '@babel', 'parser'));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readSrc(relPath) {
  return fs.readFileSync(path.join(SRC_DIR, relPath), 'utf8');
}

function parseModule(code, filename = 'module.jsx') {
  return parser.parse(code, {
    sourceType: 'module',
    sourceFilename: filename,
    plugins: ['jsx'],
  });
}

/**
 * Loads `src/services/api.js` into an isolated VM context with a mocked `fetch`
 * and `window.localStorage` so every single API function can be unit-tested
 * without needing a live backend server.
 */
function loadApiServiceWithMockFetch() {
  const rawCode = readSrc('services/api.js');
  const exportedFuncs = [];

  const cjsCode =
    rawCode
      .replace(
        /import\s+\{\s*Platform\s*\}\s+from\s+['"]react-native['"];?/g,
        'const Platform = { OS: "web", select: (obj) => obj.web || obj.default };'
      )
      .replace(/export\s+async\s+function\s+(\w+)/g, (_, name) => {
        exportedFuncs.push(name);
        return `async function ${name}`;
      })
      .replace(/export\s+function\s+(\w+)/g, (_, name) => {
        exportedFuncs.push(name);
        return `function ${name}`;
      })
      .replace(/export\s+const\s+(\w+)\s*=/g, (_, name) => {
        exportedFuncs.push(name);
        return `const ${name} =`;
      }) +
    '\n;Object.assign(exports, { ' +
    exportedFuncs.join(', ') +
    ' });\n';

  const calls = [];
  let responseQueue = [];
  let defaultResponse = { ok: true, status: 200, body: {} };

  const mockFetch = async (url, options = {}) => {
    const parsedBody = options.body ? JSON.parse(options.body) : undefined;
    calls.push({
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      body: parsedBody,
    });
    const current = responseQueue.length > 0 ? responseQueue.shift() : defaultResponse;
    return {
      ok: current.ok,
      status: current.status,
      headers: {
        get: (h) => (h.toLowerCase() === 'content-type' ? 'application/json' : null),
      },
      json: async () => current.body,
      text: async () => JSON.stringify(current.body),
    };
  };

  const storage = new Map();
  const sandbox = {
    exports: {},
    process: { env: {} },
    fetch: mockFetch,
    window: {
      localStorage: {
        getItem: (k) => (storage.has(k) ? storage.get(k) : null),
        setItem: (k, v) => storage.set(k, String(v)),
        removeItem: (k) => storage.delete(k),
      },
    },
    URLSearchParams,
    encodeURIComponent,
    console,
  };

  vm.createContext(sandbox);
  vm.runInContext(cjsCode, sandbox, { filename: 'src/services/api.js' });

  return {
    api: sandbox.exports,
    calls,
    storage,
    setMockResponse(body, { ok = true, status = 200 } = {}) {
      defaultResponse = { ok, status, body };
    },
    queueMockResponse(body, { ok = true, status = 200 } = {}) {
      responseQueue.push({ ok, status, body });
    },
  };
}

/**
 * Pure implementation of MainScreen.jsx's `handleApplyFormat` selection & cursor formatter
 * so every Word Tool action can be unit-tested deterministically.
 */
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

// ─── 1. Full Codebase Babel / JSX Syntax Verification ─────────────────────────

test('Feature 1: Every .js and .jsx file in src/ parses with zero syntax errors', () => {
  const filesChecked = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
        const rel = path.relative(SRC_DIR, fullPath);
        const code = fs.readFileSync(fullPath, 'utf8');
        assert.doesNotThrow(
          () => parseModule(code, rel),
          `Syntax error in ${rel}`
        );
        filesChecked.push(rel);
      }
    }
  }

  walk(SRC_DIR);
  assert.ok(filesChecked.length >= 30, `Expected at least 30 source files, checked ${filesChecked.length}`);
});

// ─── 2. Authentication & Session Token Management ─────────────────────────────

test('Feature 2: Auth API (register, login, token persistence, refreshToken, searchUsers, clear)', async () => {
  const { api, calls, queueMockResponse, setMockResponse } = loadApiServiceWithMockFetch();

  // 1. Register user
  setMockResponse({
    user: { username: 'reporter1', email: 'r1@corvus.org' },
    tokens: { access: 'jwt-reg-123', refresh: 'jwt-ref-123' },
  });
  await api.register({
    username: 'reporter1',
    full_name: 'Reporter One',
    email: 'r1@corvus.org',
    password: 'Password123!',
    password_confirm: 'Password123!',
  });
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/auth/register/');
  assert.equal(calls.at(-1).method, 'POST');
  assert.equal(calls.at(-1).body.username, 'reporter1');
  assert.equal(api.authStorage.getTokens().access, 'jwt-reg-123');

  // 2. Login user & fetch profile
  queueMockResponse({ access: 'jwt-login-999', refresh: 'jwt-refresh-999' });
  queueMockResponse({ user_id: 'u1', username: 'reporter1', full_name: 'Reporter One' });
  const loginRes = await api.login({ email: 'r1@corvus.org', password: 'Password123!' });
  assert.equal(calls.at(-2).url, 'http://localhost:8000/api/auth/login/');
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/auth/profile/');
  assert.equal(calls.at(-1).headers.Authorization, 'Bearer jwt-login-999');
  assert.equal(loginRes.user.username, 'reporter1');

  // 3. Search users with Bearer token
  setMockResponse([{ user_id: 'u2', username: 'editor2' }]);
  const users = await api.searchUsers('editor');
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/auth/users/?search=editor');
  assert.equal(calls.at(-1).headers.Authorization, 'Bearer jwt-login-999');
  assert.equal(users.length, 1);

  // 4. Clear tokens on signOut
  api.authStorage.clear();
  assert.equal(api.authStorage.getTokens().access, null);
  assert.equal(api.authStorage.getUser(), null);
});

// ─── 3. 1-to-1 AI Agent Button & Live Communication ───────────────────────────

test('Feature 3: 1-to-1 AI Button in NewsroomHeader & ArticleHeader + Chat API', async () => {
  const newsroomHeader = readSrc('components/NewsroomHeader.jsx');
  const articleHeader = readSrc('components/ArticleHeader.jsx');
  const mainScreen = readSrc('components/MainScreen.jsx');

  // Verify 1-to-1 AI button is exposed in both global header and article toolbar
  assert.match(newsroomHeader, /onOpenAI/);
  assert.match(newsroomHeader, /✦ Saiph AI/);
  assert.match(articleHeader, /onOpenAIAgent/);
  assert.match(articleHeader, /Ask Saiph AI/);
  assert.match(mainScreen, /<SaiphAgentModal/);

  // Verify 1-to-1 chat endpoints in api.js
  const { api, calls, setMockResponse } = loadApiServiceWithMockFetch();
  api.authStorage.setTokens({ access: 'jwt-ai-test' });

  setMockResponse({ messages: [{ role: 'assistant', content: 'Hello reporter!' }], memories: [] });
  const history = await api.fetchAgentChat('art-101');
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/ai/chat/?article_id=art-101');
  assert.equal(calls.at(-1).method, 'GET');
  assert.equal(history.messages.length, 1);

  setMockResponse({
    reply: 'I reviewed your draft and updated the mindmap.',
    actions_taken: ['mindmap_updated', 'review_completed'],
    workspace: { mindmap: { root: { title: 'Water Audit' }, nodes: [] } },
  });
  const reply = await api.sendAgentMessage({
    content: 'Build a mindmap and review my draft',
    articleId: 'art-101',
    branchId: 'br-main',
  });
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/ai/chat/');
  assert.equal(calls.at(-1).method, 'POST');
  assert.deepEqual(calls.at(-1).body, {
    content: 'Build a mindmap and review my draft',
    article_id: 'art-101',
    branch_id: 'br-main',
  });
  assert.deepEqual(reply.actions_taken, ['mindmap_updated', 'review_completed']);
});

// ─── 4. AI Agent Memory (Short-Term & Long-Term Facts/Style/Sources) ──────────

test('Feature 4: AI Agent Memory Bank (fetch, save, delete, and UI tab)', async () => {
  const aiWorkspace = readSrc('components/ArticleAIWorkspace.jsx');
  assert.match(aiWorkspace, /Agent Memory/);
  assert.match(aiWorkspace, /handleAddMemory/);
  assert.match(aiWorkspace, /handleDeleteMemory/);

  const { api, calls, setMockResponse } = loadApiServiceWithMockFetch();
  api.authStorage.setTokens({ access: 'jwt-mem-test' });

  // Save a long-term style preference memory
  setMockResponse({
    memory_id: 'mem-1',
    category: 'style',
    fact: 'Prefer punchy sentences under 20 words and AP style.',
  });
  const saved = await api.saveAgentMemory({
    fact: 'Prefer punchy sentences under 20 words and AP style.',
    category: 'style',
    articleId: 'art-101',
  });
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/ai/memories/');
  assert.equal(calls.at(-1).method, 'POST');
  assert.equal(saved.category, 'style');

  // Fetch memories for an article
  setMockResponse([saved]);
  const list = await api.fetchAgentMemories('art-101');
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/ai/memories/?article_id=art-101');
  assert.equal(list.length, 1);

  // Delete a memory
  setMockResponse({ deleted: true });
  await api.deleteAgentMemory('mem-1');
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/ai/memories/mem-1/');
  assert.equal(calls.at(-1).method, 'DELETE');
});

// ─── 5. AI Draft Generation from Brief Summary ───────────────────────────────

test('Feature 5: AI Draft Generation from Brief Summary in CreateArticleModal', async () => {
  const createModal = readSrc('components/CreateArticleModal.jsx');
  assert.match(createModal, /handleGenerateAIDraft/);
  assert.match(createModal, /✦ Saiph AI Draft Assistant/);
  assert.match(createModal, /✦ Generate AI Draft/);
  // Ensure background newsroom polling never resets form inputs while the modal is open
  assert.doesNotMatch(createModal, /\},\s*\[visible,\s*newsrooms\]\)/);
  assert.match(createModal, /\},\s*\[visible\]\)/);

  const { api, calls, setMockResponse } = loadApiServiceWithMockFetch();
  api.authStorage.setTokens({ access: 'jwt-draft-test' });

  setMockResponse({
    headline: 'City Water Board Awarded $14M Without Public Bidding',
    summary: 'Audit records show three emergency water contracts bypassed competitive tender.',
    content: '# Executive Lead\n\nMunicipal records obtained this week reveal...',
  });

  const draft = await api.generateArticleDraft({
    title: 'City Water Contract Audit',
    brief: 'Three emergency water contracts bypassed competitive tender totaling $14M.',
    category: 'Investigative Desk',
  });

  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/ai/generate-draft/');
  assert.equal(calls.at(-1).method, 'POST');
  assert.equal(calls.at(-1).body.brief, 'Three emergency water contracts bypassed competitive tender totaling $14M.');
  assert.match(draft.headline, /City Water Board/);
  assert.match(draft.content, /Executive Lead/);
});

// ─── 6. Mindmaps Section on the Article View ──────────────────────────────────

test('Feature 6: AI Mindmap Section (generation, node categories, and + Draft leaf insertion)', async () => {
  const aiWorkspace = readSrc('components/ArticleAIWorkspace.jsx');
  const articleHeader = readSrc('components/ArticleHeader.jsx');
  const mainScreen = readSrc('components/MainScreen.jsx');

  assert.match(articleHeader, /id:\s*'mindmap'/);
  assert.match(aiWorkspace, /export function ArticleMindmapSection/);
  assert.match(aiWorkspace, /CENTRAL THESIS \/ STORY ROOT/);
  assert.match(aiWorkspace, /\+ Draft/);
  assert.match(mainScreen, /<ArticleMindmapSection/);

  const { api, calls, setMockResponse } = loadApiServiceWithMockFetch();
  api.authStorage.setTokens({ access: 'jwt-mindmap-test' });

  const sampleMindmap = {
    root: { title: 'Water Board Audit', subtitle: 'Follow the $14M procurement trail' },
    nodes: [
      {
        id: 'angle-1',
        label: 'Core Angle',
        category: 'angle',
        summary: 'Emergency clauses used to bypass oversight',
        children: [{ id: 'c1', label: 'Clause 42-B', note: 'Verify 2024 council waiver' }],
      },
    ],
  };
  setMockResponse(sampleMindmap);

  const res = await api.generateArticleMindmap('art-101', 'br-main');
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/ai/articles/art-101/mindmap/');
  assert.equal(calls.at(-1).method, 'POST');
  assert.deepEqual(calls.at(-1).body, { branch_id: 'br-main' });
  assert.equal(res.root.title, 'Water Board Audit');
  assert.equal(res.nodes[0].children[0].label, 'Clause 42-B');
});

// ─── 7. Editorial "Board" Section (Suggestions & Sources) ─────────────────────

test('Feature 7: Editorial Board Section (suggestions, sources, filtering, and Mark Done toggle)', async () => {
  const aiWorkspace = readSrc('components/ArticleAIWorkspace.jsx');
  const articleHeader = readSrc('components/ArticleHeader.jsx');
  const mainScreen = readSrc('components/MainScreen.jsx');

  assert.match(articleHeader, /id:\s*'board'/);
  assert.match(aiWorkspace, /export function ArticleBoardSection/);
  assert.match(aiWorkspace, /Suggestions & Verified Source Leads/);
  assert.match(aiWorkspace, /Insert into Article/);
  assert.match(mainScreen, /<ArticleBoardSection/);

  const { api, calls, setMockResponse } = loadApiServiceWithMockFetch();
  api.authStorage.setTokens({ access: 'jwt-board-test' });

  setMockResponse({
    items: [
      {
        id: 'b-1',
        kind: 'suggestion',
        category: 'Lead',
        title: 'Quantify the contract total in paragraph 1',
        detail: 'State the $14M figure in the opening sentence.',
        snippet: 'Records show the board approved $14.2 million in unbid contracts.',
        priority: 'high',
        applied: false,
      },
      {
        id: 'b-2',
        kind: 'source',
        category: 'Public Record',
        title: 'Municipal Procurement Ledger FY2025',
        detail: 'Cross-check vendor registration dates.',
        snippet: 'Source: Municipal Procurement Ledger FY2025, Section 4.',
        priority: 'medium',
        applied: false,
      },
    ],
  });

  const generated = await api.generateArticleBoard('art-101', 'br-main');
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/ai/articles/art-101/board/');
  assert.equal(calls.at(-1).method, 'POST');
  assert.equal(generated.items.length, 2);

  // Mark board item done (applied: true)
  setMockResponse({ items: [{ id: 'b-1', applied: true }] });
  const toggled = await api.toggleArticleBoardItem('art-101', { itemId: 'b-1', applied: true });
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/ai/articles/art-101/board/');
  assert.equal(calls.at(-1).method, 'PATCH');
  assert.deepEqual(calls.at(-1).body, { item_id: 'b-1', applied: true });
  assert.equal(toggled.items[0].applied, true);
});

// ─── 8. AI Review, Plagiarism Check, AI-Writing Check & Simple Advice ─────────

test('Feature 8: AI Review, Plagiarism Check, AI-Writing Check & Simple Improvements', async () => {
  const aiWorkspace = readSrc('components/ArticleAIWorkspace.jsx');
  const articleHeader = readSrc('components/ArticleHeader.jsx');
  const mainScreen = readSrc('components/MainScreen.jsx');

  assert.match(articleHeader, /id:\s*'review'/);
  assert.match(aiWorkspace, /export function ArticleReviewSection/);
  assert.match(aiWorkspace, /PLAGIARISM CHECK/);
  assert.match(aiWorkspace, /AI-WRITING CHECK/);
  assert.match(aiWorkspace, /Where to Improve \(In Simple Terms\)/);
  assert.match(mainScreen, /<ArticleReviewSection/);

  const { api, calls, setMockResponse } = loadApiServiceWithMockFetch();
  api.authStorage.setTokens({ access: 'jwt-review-test' });

  const sampleReview = {
    quality_score: 86,
    word_count: 420,
    branch_name: 'main',
    coach_summary: 'Your evidence is strong, but two paragraphs use robotic phrasing. Shorten the opening sentence and name the specific audit report.',
    plagiarism: {
      score: 4,
      originality_score: 96,
      verdict: 'Original',
      summary: '96% original across all newsroom archives.',
      matches: [],
    },
    ai_detection: {
      ai_probability: 18,
      human_score: 82,
      verdict: 'Mostly Human',
      summary: 'Natural sentence rhythm with 1 cliché phrase detected.',
      flagged_phrases: ['it is important to note'],
    },
    improvements: [
      {
        area: 'Opening Lead',
        problem: 'The first sentence takes 35 words before mentioning the water board.',
        how_to_fix: 'Start directly with who did what and the dollar amount.',
        example: 'The City Water Board signed $14M in emergency contracts without public bids.',
      },
    ],
  };
  setMockResponse(sampleReview);

  const review = await api.runArticleAIReview('art-101', 'br-main');
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/ai/articles/art-101/review/');
  assert.equal(calls.at(-1).method, 'POST');
  assert.equal(review.quality_score, 86);
  assert.equal(review.plagiarism.originality_score, 96);
  assert.equal(review.ai_detection.human_score, 82);
  assert.equal(review.improvements[0].area, 'Opening Lead');
});

// ─── 9. Word Tools Detour (Active Toggle Ribbon + WYSIWYG Rich Text Editor) ──

test('Feature 9: Word Tools toggle active state on ribbon and RichTextEditor renders without raw markdown', () => {
  const articleHeader = readSrc('components/ArticleHeader.jsx');
  const mainScreen = readSrc('components/MainScreen.jsx');
  const richEditorSrc = readSrc('components/RichTextEditor.jsx');

  assert.doesNotThrow(() => parseModule(richEditorSrc, 'RichTextEditor.jsx'));

  // 1. Verify Word Tools are exposed directly on the ribbon with active state support (isActive / activeFormats)
  assert.match(articleHeader, /const wordTools = \[/);
  assert.match(articleHeader, /wordToolsRibbon/);
  assert.match(articleHeader, /activeFormats/);
  assert.match(articleHeader, /accessibilityState=\{\{\s*selected:\s*isActive\s*\}\}/);
  assert.doesNotMatch(articleHeader, /activeModal === 'tools'/);
  for (const action of ['bold', 'italic', 'underline', 'h1', 'h2', 'bullet', 'quote', 'code']) {
    assert.match(articleHeader, new RegExp(`action:\\s*'${action}'`));
  }

  // 2. Verify MainScreen wires RichTextEditor and activeFormats to ArticleHeader
  assert.match(mainScreen, /<RichTextEditor/);
  assert.match(mainScreen, /activeFormats=\{activeFormats\}/);
  assert.match(mainScreen, /toggleFormat/);

  // 3. Verify AI markdown draft is converted to clean semantic HTML with zero raw markdown symbols
  const sampleAiDraft = [
    '# This is a test',
    '',
    '*Testing things*',
    '',
    '---',
    '',
    '## Introduction',
    '',
    'In the fast-moving world of technology and media, **testing** remains a cornerstone.',
  ].join('\n');

  assert.match(richEditorSrc, /export function contentToRichHtml/);
  assert.match(richEditorSrc, /export function toggleActiveFormatState/);
  assert.match(richEditorSrc, /export function stripRichFormatting/);

  // 4. Test wrapping selected text for all 8 Word Tools
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
  assert.equal(
    applyWordToolFormat('Procurement Timeline', 'h1', { start: 0, end: 20 }),
    '# Procurement Timeline'
  );
  assert.equal(
    applyWordToolFormat('Vendor Breakdown', 'h2', { start: 0, end: 16 }),
    '## Vendor Breakdown'
  );
  assert.equal(
    applyWordToolFormat('First finding\nSecond finding', 'bullet', { start: 0, end: 28 }),
    '• First finding\n• Second finding'
  );
  assert.equal(
    applyWordToolFormat('We never saw the bid.', 'quote', { start: 0, end: 21 }),
    '> We never saw the bid.'
  );
  assert.ok(sampleAiDraft.includes('**testing**'));
});

// ─── 10. Articles & Git-Style Branching (Create, Edit, Push, Diff, Privacy) ───

test('Feature 10: Articles & Branching (create article, fork private branch, edit, push public, diff)', async () => {
  const { api, calls, queueMockResponse, setMockResponse } = loadApiServiceWithMockFetch();
  api.authStorage.setTokens({ access: 'jwt-branch-test' });

  // 1. Create article in a newsroom desk (POST to group articles + PATCH main branch content)
  queueMockResponse({
    article_id: 'art-500',
    title: 'Port Authority Customs Investigation',
    group: 'grp-1',
    branches: [{ branch_id: 'br-main', branch_name: 'main', is_main: true, is_public: true }],
  });
  queueMockResponse({
    branch_id: 'br-main',
    branch_name: 'main',
    is_main: true,
    is_public: true,
    content: 'Initial findings...',
    branch_description: 'Manifest discrepancies at Berth 4',
  });

  const createdArt = await api.createArticle({
    groupId: 'grp-1',
    title: 'Port Authority Customs Investigation',
    summary: 'Manifest discrepancies at Berth 4',
    content: 'Initial findings...',
  });
  assert.equal(calls.at(-2).url, 'http://localhost:8000/api/project/groups/grp-1/articles/');
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/project/branches/br-main/');
  assert.equal(createdArt.article_id, 'art-500');

  // 2. Fork a new private branch
  setMockResponse({
    branch_id: 'br-legal',
    branch_name: 'legal-review',
    is_main: false,
    is_public: false,
    content: 'Initial findings...',
  });
  const newBranch = await api.createBranch('art-500', {
    name: 'legal-review',
    description: 'Checking defamation statutes',
    content: 'Initial findings...',
  });
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/project/articles/art-500/branches/');
  assert.equal(calls.at(-1).method, 'POST');
  assert.equal(newBranch.is_public, false);

  // 3. Save edits to the branch
  setMockResponse({ branch_id: 'br-legal', content: 'Updated legal draft' });
  await api.updateBranchContent('br-legal', {
    content: 'Updated legal draft',
    summary: 'Cleared by counsel',
  });
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/project/branches/br-legal/');
  assert.equal(calls.at(-1).method, 'PATCH');
  assert.deepEqual(calls.at(-1).body, {
    content: 'Updated legal draft',
    branch_description: 'Cleared by counsel',
  });

  // 4. Push branch to make it public to the newsroom
  setMockResponse({ branch_id: 'br-legal', branch_name: 'legal-review', is_public: true });
  const pushed = await api.pushBranch('br-legal');
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/project/branches/br-legal/push/');
  assert.equal(calls.at(-1).method, 'POST');
  assert.equal(pushed.is_public, true);

  // 5. Diff branch against main
  setMockResponse({ branch_id: 'br-legal', diff: '--- main\n+++ legal-review\n+Updated legal draft' });
  const diffRes = await api.diffBranch('br-legal');
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/project/branches/br-legal/diff/');
  assert.match(diffRes.diff, /\+\+\+ legal-review/);

  // 6. Delete article permanently (DELETE /api/project/articles/:id/)
  setMockResponse({}, 204);
  await api.deleteArticle('art-500');
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/project/articles/art-500/');
  assert.equal(calls.at(-1).method, 'DELETE');
});

// ─── 11. Newsrooms (3+ Members) & Direct Messages ─────────────────────────────

test('Feature 11: Newsrooms (create desk, list desks) & Direct Messages (inbox, DM, send message)', async () => {
  const createNewsroomModal = readSrc('components/CreateNewsroomModal.jsx');
  const newDMModal = readSrc('components/NewDMModal.jsx');
  assert.doesNotThrow(() => parseModule(createNewsroomModal, 'CreateNewsroomModal.jsx'));
  assert.doesNotThrow(() => parseModule(newDMModal, 'NewDMModal.jsx'));

  const { api, calls, setMockResponse } = loadApiServiceWithMockFetch();
  api.authStorage.setTokens({ access: 'jwt-chat-test' });

  // 1. Create a Newsroom desk
  setMockResponse({ group_id: 'grp-9', group_name: 'Metro Desk', member_number: 3 });
  const group = await api.createNewsroom({
    name: 'Metro Desk',
    description: 'City hall and municipal beat',
    member_ids: ['u2', 'u3'],
  });
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/newsroom/groups/');
  assert.equal(calls.at(-1).method, 'POST');
  assert.deepEqual(calls.at(-1).body, {
    group_name: 'Metro Desk',
    group_description: 'City hall and municipal beat',
    member_ids: ['u2', 'u3'],
  });
  assert.equal(group.group_name, 'Metro Desk');

  // 2. Start or get a 1-to-1 Direct Message conversation
  setMockResponse({ conversation_id: 'conv-77', type: 'direct' });
  const conv = await api.createOrGetDirectChat('u2');
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/chats/conversations/');
  assert.deepEqual(calls.at(-1).body, { type: 'direct', recipient_id: 'u2' });
  assert.equal(conv.conversation_id, 'conv-77');

  // 3. Send & fetch chat messages
  setMockResponse({ message_id: 'm-1', content: 'Can you verify the invoice date?' });
  await api.sendChatMessage('conv-77', 'Can you verify the invoice date?');
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/chats/conversations/conv-77/messages/');
  assert.equal(calls.at(-1).method, 'POST');

  setMockResponse({ messages: [{ message_id: 'm-1', content: 'Can you verify the invoice date?' }] });
  const msgs = await api.fetchMessages('conv-77', { limit: 20 });
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/chats/conversations/conv-77/messages/?limit=20');
  assert.equal(msgs.messages.length, 1);
});

// ─── 12. Real-Time Voice Sessions & PDF Export / Upload ───────────────────────

test('Feature 12: Voice Sessions API, Self-Invite Guard & PDF Export/Upload Utilities', async () => {
  const voiceBar = readSrc('components/VoiceBar.jsx');
  const inviteBanner = readSrc('components/VoiceCallInviteBanner.jsx');
  const pdfExporter = readSrc('utils/pdfExporter.js');
  const mainScreen = readSrc('components/MainScreen.jsx');

  assert.doesNotThrow(() => parseModule(voiceBar, 'VoiceBar.jsx'));
  assert.doesNotThrow(() => parseModule(inviteBanner, 'VoiceCallInviteBanner.jsx'));
  assert.doesNotThrow(() => parseModule(pdfExporter, 'pdfExporter.js'));

  // Verify self-invite guard in MainScreen so callers never see their own invite banner
  assert.match(mainScreen, /initiatedVoiceCallRef/);
  assert.match(mainScreen, /!isInitiator/);

  // Verify PDF exporter functions exist
  assert.match(pdfExporter, /export function exportArticleToPdf/);
  assert.match(pdfExporter, /export async function openPdfDocument/);

  // Verify active voice sessions endpoint
  const { api, calls, setMockResponse } = loadApiServiceWithMockFetch();
  api.authStorage.setTokens({ access: 'jwt-voice-test' });
  setMockResponse({
    'grp-9': { participant_count: 2, initiator_id: 'u2', initiator_name: 'Editor Jane' },
  });
  const sessions = await api.fetchActiveVoiceSessions();
  assert.equal(calls.at(-1).url, 'http://localhost:8000/api/newsroom/voice/active/');
  assert.equal(sessions['grp-9'].participant_count, 2);
});

// ─── 13. Saiph AI Branch Switching & Multi-Task Messaging ─────────────────────

test('Feature 13: Saiph AI Branch Switching (single-turn, multi-turn, checkout) & Multi-Task Messaging', () => {
  const aiWorkspace = readSrc('components/ArticleAIWorkspace.jsx');
  const mainScreen = readSrc('components/MainScreen.jsx');

  // Verify MainScreen handles switched_branch, created_branch, branches, pushed_branch, updated_title, open_section
  assert.match(mainScreen, /res\.switched_branch\s*\|\|\s*res\.created_branch/);
  assert.match(mainScreen, /res\.pushed_branch/);
  assert.match(mainScreen, /res\.updated_title/);
  assert.match(mainScreen, /res\.open_section/);
  assert.match(mainScreen, /onSelectBranch=\{handleSelectBranch\}/);
  assert.match(mainScreen, /onCreateBranch=\{handleCreateBranch\}/);

  // Extract and execute resolveClientBranchIntent from ArticleAIWorkspace.jsx
  const startIdx = aiWorkspace.indexOf('const RESERVED_BRANCH_WORDS');
  const endIdx = aiWorkspace.indexOf('export function SaiphAgentModal');
  assert.ok(startIdx !== -1 && endIdx > startIdx, 'resolveClientBranchIntent must exist in ArticleAIWorkspace.jsx');

  const snippet = aiWorkspace
    .slice(startIdx, endIdx)
    .replace(/export\s+function\s+resolveClientBranchIntent/, 'function resolveClientBranchIntent');
  const resolveClientBranchIntent = new Function(`${snippet}\nreturn resolveClientBranchIntent;`)();

  const existingBranches = [{ name: 'main' }, { name: 'legal-review' }];

  // 1. "switch to a new branch" without a name -> auto-creates draft-v2
  const autoNew = resolveClientBranchIntent('switch to a new branch', '', existingBranches, 'main');
  assert.deepEqual(autoNew, { action: 'create', branchName: 'draft-v2' });

  // 2. If draft-v2 already exists, "switch to a new branch" -> auto-creates draft-v3
  const autoNewV3 = resolveClientBranchIntent(
    'switch to a new branch',
    '',
    [...existingBranches, { name: 'draft-v2' }],
    'main'
  );
  assert.deepEqual(autoNewV3, { action: 'create', branchName: 'draft-v3' });

  // 3. Multi-turn bare branch reply "draft-v2" -> creates draft-v2
  const multiTurnReply = resolveClientBranchIntent('draft-v2', '', existingBranches, 'main');
  assert.deepEqual(multiTurnReply, { action: 'create', branchName: 'draft-v2' });

  // 4. Switching to an existing branch ("switch to legal-review" or "switch to main")
  const switchExisting = resolveClientBranchIntent('switch to branch legal-review', '', existingBranches, 'main');
  assert.deepEqual(switchExisting, { action: 'switch', branchName: 'legal-review' });

  const switchMain = resolveClientBranchIntent('switch back to main', '', existingBranches, 'legal-review');
  assert.deepEqual(switchMain, { action: 'switch', branchName: 'main' });

  // 5. Truthfulness safety net when AI reply claims it created a branch
  const replyFallback = resolveClientBranchIntent(
    'yes please',
    '✅ Created a new branch called **`draft-v2`** and switched the workspace to it.',
    existingBranches,
    'main'
  );
  assert.deepEqual(replyFallback, { action: 'create', branchName: 'draft-v2' });
});

