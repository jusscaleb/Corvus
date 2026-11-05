import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Platform, TextInput, View, StyleSheet } from 'react-native';

export const DEFAULT_ACTIVE_FORMATS = {
  bold: false,
  italic: false,
  underline: false,
  h1: false,
  h2: false,
  bullet: false,
  quote: false,
  code: false,
};

const INLINE_TAG_MAP = {
  bold: { primary: 'STRONG', aliases: ['STRONG', 'B'], cmd: 'bold' },
  italic: { primary: 'EM', aliases: ['EM', 'I'], cmd: 'italic' },
  underline: { primary: 'U', aliases: ['U'], cmd: 'underline' },
  code: { primary: 'CODE', aliases: ['CODE', 'PRE'], cmd: null },
};

/**
 * Pure helper to compute the next toolbar active-format map when a user clicks a Word Tool button.
 * Inline formats (`bold`, `italic`, `underline`, `code`) toggle independently.
 * Block formats (`h1`, `h2`, `quote`, `bullet`) toggle and clear conflicting heading levels.
 */
export function toggleActiveFormatState(current = DEFAULT_ACTIVE_FORMATS, action) {
  const base = { ...DEFAULT_ACTIVE_FORMATS, ...(current || {}) };
  if (!action || !(action in base)) return base;

  const nextVal = !base[action];
  const next = { ...base, [action]: nextVal };

  if (action === 'h1' && nextVal) {
    next.h2 = false;
    next.quote = false;
  } else if (action === 'h2' && nextVal) {
    next.h1 = false;
    next.quote = false;
  } else if (action === 'quote' && nextVal) {
    next.h1 = false;
    next.h2 = false;
  }
  return next;
}

function escapeHtmlText(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Converts inline markdown (`***bold-italic***`, `**bold**`, `*italic*`, `_underline_`, `` `code` ``)
 * into semantic HTML tags so raw markdown symbols are never displayed in the editor.
 */
export function formatInlineToHtml(rawLine) {
  if (!rawLine) return '';
  let text = escapeHtmlText(rawLine);

  // Code spans first so symbols inside backticks aren't parsed as bold/italic
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold + Italic (***text***)
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold (**text** or __text__)
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  // Italic (*text*)
  text = text.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  // Underline (_text_)
  text = text.replace(/(^|[\s(])_([^_\n]+)_(?=$|[\s.,!?;:)])/g, '$1<u>$2</u>');

  return text;
}

/**
 * Converts Markdown or mixed text into clean semantic HTML for the WYSIWYG editor,
 * reader view, and PDF exporter. Raw markdown symbols (#, **, *, ---) are converted
 * into real typography elements (<h1>, <h2>, <strong>, <em>, <u>, <hr>, <ul><li>, <blockquote>).
 */
export function contentToRichHtml(rawContent) {
  if (!rawContent || !String(rawContent).trim()) return '';
  const str = String(rawContent).replace(/\r\n/g, '\n');

  // If content is already rich HTML without raw markdown headings, normalize it
  const looksLikeHtml = /<(?:h[1-6]|p|div|ul|ol|li|blockquote|strong|b|em|i|u|code|hr)\b/i.test(str);
  if (looksLikeHtml && !/^#{1,3}\s+/m.test(str) && !/\*\*[^*]+\*\*/.test(str)) {
    return str;
  }

  const lines = str.split('\n');
  const htmlBlocks = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      htmlBlocks.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      htmlBlocks.push('</ol>');
      inOl = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      closeLists();
      continue;
    }

    // Horizontal rule: ---, ***, ___
    if (/^(?:---|___|\*\*\*)$/.test(trimmed)) {
      closeLists();
      htmlBlocks.push('<hr />');
      continue;
    }

    // Headings: # H1, ## H2, ### H3
    const h3Match = trimmed.match(/^#{3,6}\s+(.+)$/);
    if (h3Match) {
      closeLists();
      htmlBlocks.push(`<h3>${formatInlineToHtml(h3Match[1])}</h3>`);
      continue;
    }
    const h2Match = trimmed.match(/^##\s+(.+)$/);
    if (h2Match) {
      closeLists();
      htmlBlocks.push(`<h2>${formatInlineToHtml(h2Match[1])}</h2>`);
      continue;
    }
    const h1Match = trimmed.match(/^#\s+(.+)$/);
    if (h1Match) {
      closeLists();
      htmlBlocks.push(`<h1>${formatInlineToHtml(h1Match[1])}</h1>`);
      continue;
    }

    // Blockquote: > quote
    const quoteMatch = trimmed.match(/^>\s*(.+)$/);
    if (quoteMatch) {
      closeLists();
      htmlBlocks.push(`<blockquote>${formatInlineToHtml(quoteMatch[1])}</blockquote>`);
      continue;
    }

    // Unordered list: • item, - item, * item (not *italic*)
    const isItalicWholeLine = /^\*[^*\s][^*]*\*$/.test(trimmed);
    const bulletMatch = !isItalicWholeLine && trimmed.match(/^(?:•|-|\*)\s+(.+)$/);
    if (bulletMatch) {
      if (inOl) {
        htmlBlocks.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        htmlBlocks.push('<ul>');
        inUl = true;
      }
      htmlBlocks.push(`<li>${formatInlineToHtml(bulletMatch[1])}</li>`);
      continue;
    }

    // Ordered list: 1. item
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (inUl) {
        htmlBlocks.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        htmlBlocks.push('<ol>');
        inOl = true;
      }
      htmlBlocks.push(`<li>${formatInlineToHtml(olMatch[1])}</li>`);
      continue;
    }

    closeLists();
    htmlBlocks.push(`<p>${formatInlineToHtml(trimmed)}</p>`);
  }

  closeLists();
  return htmlBlocks.join('\n');
}

/**
 * Serializes rich HTML from the WYSIWYG editor back into clean structured markdown
 * so the backend database and AI analysis endpoints receive clean structured text.
 */
export function richHtmlToMarkdown(html) {
  if (!html) return '';
  let s = String(html).replace(/\u200B/g, '');

  // Normalize inline tags to markdown tokens
  s = s.replace(/<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, (_, inner) => {
    const clean = inner.replace(/<[^>]+>/g, '');
    return clean.trim() ? `**${clean.trim()}**` : clean;
  });
  s = s.replace(/<(?:em|i)\b[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, (_, inner) => {
    const clean = inner.replace(/<[^>]+>/g, '');
    return clean.trim() ? `*${clean.trim()}*` : clean;
  });
  s = s.replace(/<u\b[^>]*>([\s\S]*?)<\/u>/gi, (_, inner) => {
    const clean = inner.replace(/<[^>]+>/g, '');
    return clean.trim() ? `_${clean.trim()}_` : clean;
  });
  s = s.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, inner) => {
    const clean = inner.replace(/<[^>]+>/g, '');
    return clean.trim() ? `\`${clean.trim()}\`` : clean;
  });
  s = s.replace(/<font\b[^>]*face=["']?monospace["']?[^>]*>([\s\S]*?)<\/font>/gi, (_, inner) => {
    const clean = inner.replace(/<[^>]+>/g, '');
    return clean.trim() ? `\`${clean.trim()}\`` : clean;
  });

  // Block-level conversions
  s = s.replace(/<hr\b[^>]*\/?>/gi, '\n---\n');
  s = s.replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n\n');
  s = s.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n\n');
  s = s.replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n\n');
  s = s.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) => {
    const text = inner.replace(/<\/?(?:p|div|br)\b[^>]*>/gi, ' ').trim();
    return `\n> ${text}\n\n`;
  });
  s = s.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, inner) => {
    const text = inner.replace(/<\/?(?:p|div|br)\b[^>]*>/gi, ' ').trim();
    return `\n• ${text}`;
  });
  s = s.replace(/<\/(?:ul|ol)>/gi, '\n\n');
  s = s.replace(/<(?:ul|ol)\b[^>]*>/gi, '\n');
  s = s.replace(/<br\b[^>]*\/?>/gi, '\n');
  s = s.replace(/<\/(?:p|div)>/gi, '\n\n');
  s = s.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  s = s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"');

  return s
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Strips both HTML tags and Markdown tokens (`#`, `**`, `*`, `_`, `---`, `` ` ``)
 * so character counts, word counts, and plain-text previews never count formatting symbols.
 */
export function stripRichFormatting(content) {
  if (!content) return '';
  return String(content)
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/^\s*(?:---|___|\*\*\*)\s*$/gm, '')
    .replace(/^\s*>\s*/gm, '')
    .replace(/^\s*(?:•|-|\*)\s+/gm, '')
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/(^|[\s(])_([^_\n]+)_(?=$|[\s.,!?;:)])/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * RichTextEditor — True WYSIWYG Rich Article Editor for Corvus Newsroom.
 *
 * - Renders headings (H1/H2), bold, italic, underline, bullet lists, blockquotes,
 *   horizontal dividers, and inline code visually inside the editor without raw
 *   markdown characters (#, **, *, ---).
 * - Supports toggleable Word Tools: clicking Bold activates the Bold button, and
 *   everything typed while Bold is activated is visually bold until deactivated.
 */
const RichTextEditor = forwardRef(function RichTextEditor(
  {
    value = '',
    onChangeText,
    onActiveFormatsChange,
    onEditStart,
    placeholder = 'Start writing your story...',
    colors = {},
    minHeight = 360,
    style,
  },
  ref
) {
  const domRef = useRef(null);
  const lastEmittedRef = useRef(null);
  const savedRangeRef = useRef(null);
  const pendingFormatsRef = useRef({ ...DEFAULT_ACTIVE_FORMATS });
  const activeFormatsRef = useRef({ ...DEFAULT_ACTIVE_FORMATS });

  const updateActiveFormats = useCallback(
    (next) => {
      activeFormatsRef.current = next;
      if (typeof onActiveFormatsChange === 'function') {
        onActiveFormatsChange(next);
      }
    },
    [onActiveFormatsChange]
  );

  const findAncestorTag = useCallback((tagNames) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !domRef.current) return null;
    const sel = window.getSelection?.();
    let node = sel?.focusNode || sel?.anchorNode;
    if (node && node.nodeType === 3) node = node.parentNode;
    const upperSet = new Set(tagNames.map((t) => t.toUpperCase()));
    while (node && node !== domRef.current) {
      if (upperSet.has((node.tagName || '').toUpperCase())) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  }, []);

  // Inspect current DOM selection and ancestor tags to keep toolbar buttons in sync
  const syncFormatsFromDom = useCallback(
    (preservePending = false) => {
      if (Platform.OS !== 'web' || typeof document === 'undefined' || !domRef.current) {
        return;
      }
      const sel = window.getSelection?.();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (domRef.current.contains(range.commonAncestorContainer)) {
          savedRangeRef.current = range.cloneRange();
        }
      }

      let bold = false;
      let italic = false;
      let underline = false;
      let bullet = false;
      let code = false;
      let h1 = false;
      let h2 = false;
      let quote = false;

      try {
        bold = Boolean(document.queryCommandState?.('bold'));
        italic = Boolean(document.queryCommandState?.('italic'));
        underline = Boolean(document.queryCommandState?.('underline'));
        bullet = Boolean(document.queryCommandState?.('insertUnorderedList'));
      } catch (_) {}

      let node = sel?.focusNode || sel?.anchorNode;
      if (node && node.nodeType === 3) {
        node = node.parentNode;
      }
      while (node && node !== domRef.current) {
        const tag = (node.tagName || '').toUpperCase();
        if (tag === 'B' || tag === 'STRONG') bold = true;
        if (tag === 'I' || tag === 'EM') italic = true;
        if (tag === 'U') underline = true;
        if (tag === 'H1') h1 = true;
        if (tag === 'H2') h2 = true;
        if (tag === 'UL') bullet = true;
        if (tag === 'BLOCKQUOTE') quote = true;
        if (tag === 'CODE' || tag === 'PRE') code = true;
        node = node.parentNode;
      }

      const detected = {
        bold: preservePending && pendingFormatsRef.current.bold ? true : bold,
        italic: preservePending && pendingFormatsRef.current.italic ? true : italic,
        underline: preservePending && pendingFormatsRef.current.underline ? true : underline,
        h1: preservePending && pendingFormatsRef.current.h1 ? true : h1,
        h2: preservePending && pendingFormatsRef.current.h2 ? true : h2,
        bullet: preservePending && pendingFormatsRef.current.bullet ? true : bullet,
        quote: preservePending && pendingFormatsRef.current.quote ? true : quote,
        code: preservePending && pendingFormatsRef.current.code ? true : code,
      };
      updateActiveFormats(detected);
    },
    [updateActiveFormats]
  );

  // Ensure the editor has focus and a valid selection range inside its text content
  const ensureSelectionInsideEditor = useCallback(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || !domRef.current) return null;
    const el = domRef.current;
    el.focus();

    const sel = window.getSelection?.();
    if (!sel) return null;

    if (sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      if (el.contains(r.commonAncestorContainer) && r.commonAncestorContainer !== el) {
        return r;
      }
    }

    if (
      savedRangeRef.current &&
      el.contains(savedRangeRef.current.commonAncestorContainer) &&
      savedRangeRef.current.commonAncestorContainer !== el
    ) {
      try {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
        return savedRangeRef.current;
      } catch (_) {}
    }

    // Ensure there is at least one paragraph inside the editor
    if (!el.lastChild) {
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('\u200B'));
      el.appendChild(p);
    }

    // Walk to the deepest last child so the caret lands inside a text/inline node
    let target = el.lastChild;
    while (target && target.lastChild && target.nodeName !== 'BR') {
      target = target.lastChild;
    }

    const range = document.createRange();
    if (target && target.nodeType === 3) {
      range.setStart(target, target.nodeValue.length);
      range.collapse(true);
    } else if (target) {
      range.selectNodeContents(target);
      range.collapse(false);
    } else {
      range.selectNodeContents(el);
      range.collapse(false);
    }
    sel.removeAllRanges();
    sel.addRange(range);
    savedRangeRef.current = range.cloneRange();
    return range;
  }, []);

  const emitChangeFromDom = useCallback(() => {
    if (!domRef.current) return;
    const md = richHtmlToMarkdown(domRef.current.innerHTML);
    lastEmittedRef.current = md;
    if (typeof onChangeText === 'function') {
      onChangeText(md);
    }
  }, [onChangeText]);

  // Helper to toggle an inline format (`bold`, `italic`, `underline`, `code`) reliably
  const applyInlineFormatDom = useCallback(
    (action, targetState) => {
      const spec = INLINE_TAG_MAP[action];
      if (!spec || !domRef.current) return;

      const range = ensureSelectionInsideEditor();
      const sel = window.getSelection?.();
      if (!range || !sel) return;

      // Case 1: Non-collapsed selection (user highlighted text)
      if (!range.collapsed) {
        if (spec.cmd) {
          document.execCommand(spec.cmd, false, null);
        } else if (action === 'code') {
          const existingCode = findAncestorTag(spec.aliases);
          if (existingCode) {
            const text = document.createTextNode(existingCode.textContent || '');
            existingCode.parentNode?.replaceChild(text, existingCode);
          } else {
            const codeEl = document.createElement('code');
            codeEl.textContent = range.toString();
            range.deleteContents();
            range.insertNode(codeEl);
          }
        }
        savedRangeRef.current = sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
        pendingFormatsRef.current[action] = false;
        emitChangeFromDom();
        return;
      }

      // Case 2: Collapsed cursor — user is toggling typing mode ON or OFF
      if (targetState) {
        // Turning ON: ensure caret is physically inside `<strong|em|u|code>\u200B</...>`
        const existingAncestor = findAncestorTag(spec.aliases);
        if (!existingAncestor) {
          const wrapper = document.createElement(spec.primary.toLowerCase());
          const zwsp = document.createTextNode('\u200B');
          wrapper.appendChild(zwsp);
          range.insertNode(wrapper);

          const newRange = document.createRange();
          newRange.setStart(zwsp, 1);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
          savedRangeRef.current = newRange.cloneRange();
        }
        pendingFormatsRef.current[action] = true;
      } else {
        // Turning OFF: step caret outside of the ancestor `<strong|em|u|code>` element
        if (spec.cmd) {
          try {
            if (document.queryCommandState?.(spec.cmd)) {
              document.execCommand(spec.cmd, false, null);
            }
          } catch (_) {}
        }
        const ancestor = findAncestorTag(spec.aliases);
        if (ancestor && ancestor.parentNode) {
          const rawText = (ancestor.textContent || '').replace(/\u200B/g, '');
          if (!rawText) {
            // Ancestor was empty (toggled ON then immediately OFF without typing)
            const plainZwsp = document.createTextNode('\u200B');
            ancestor.parentNode.replaceChild(plainZwsp, ancestor);
            const newRange = document.createRange();
            newRange.setStart(plainZwsp, 1);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            savedRangeRef.current = newRange.cloneRange();
          } else {
            // Place a fresh plain text node right after the closing inline tag
            const afterNode = document.createTextNode('\u200B');
            ancestor.parentNode.insertBefore(afterNode, ancestor.nextSibling);
            const newRange = document.createRange();
            newRange.setStart(afterNode, 1);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            savedRangeRef.current = newRange.cloneRange();
          }
        }
        pendingFormatsRef.current[action] = false;
      }
    },
    [ensureSelectionInsideEditor, findAncestorTag, emitChangeFromDom]
  );

  // Helper to toggle block-level tags (`H1`, `H2`, `BLOCKQUOTE`) cleanly
  const applyBlockFormatDom = useCallback(
    (tagName, actionKey) => {
      if (!domRef.current) return;
      ensureSelectionInsideEditor();
      const sel = window.getSelection?.();
      if (!sel) return;

      // Find the current block element inside domRef.current
      let blockNode = sel.focusNode || sel.anchorNode;
      if (blockNode && blockNode.nodeType === 3) {
        blockNode = blockNode.parentNode;
      }
      while (
        blockNode &&
        blockNode !== domRef.current &&
        blockNode.parentNode !== domRef.current
      ) {
        blockNode = blockNode.parentNode;
      }

      const upperTarget = tagName.toUpperCase();
      if (!blockNode || blockNode === domRef.current) {
        const newBlock = document.createElement(tagName.toLowerCase());
        const zwsp = document.createTextNode('\u200B');
        newBlock.appendChild(zwsp);
        domRef.current.appendChild(newBlock);
        const newRange = document.createRange();
        newRange.setStart(zwsp, 1);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRangeRef.current = newRange.cloneRange();
        pendingFormatsRef.current[actionKey] = true;
      } else {
        const isAlreadyTarget = (blockNode.tagName || '').toUpperCase() === upperTarget;
        const replacementTag = isAlreadyTarget ? 'p' : tagName.toLowerCase();
        const replacement = document.createElement(replacementTag);
        while (blockNode.firstChild) {
          replacement.appendChild(blockNode.firstChild);
        }
        if (!replacement.firstChild) {
          replacement.appendChild(document.createTextNode('\u200B'));
        }
        blockNode.parentNode?.replaceChild(replacement, blockNode);

        // Place caret at the end of the replacement block
        let deepest = replacement.lastChild;
        while (deepest && deepest.lastChild && deepest.nodeName !== 'BR') {
          deepest = deepest.lastChild;
        }
        const newRange = document.createRange();
        if (deepest && deepest.nodeType === 3) {
          newRange.setStart(deepest, deepest.nodeValue.length);
          newRange.collapse(true);
        } else {
          newRange.selectNodeContents(replacement);
          newRange.collapse(false);
        }
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRangeRef.current = newRange.cloneRange();
        pendingFormatsRef.current[actionKey] = !isAlreadyTarget;
      }
      emitChangeFromDom();
    },
    [ensureSelectionInsideEditor, emitChangeFromDom]
  );

  // Execute a Word Tool toggle command (Bold, Italic, Underline, H1, H2, Bullets, Quote, Code)
  const toggleFormat = useCallback(
    (action) => {
      if (typeof onEditStart === 'function') {
        onEditStart();
      }

      const currentlyActive = Boolean(activeFormatsRef.current[action]);
      const targetState = !currentlyActive;
      const nextFormats = toggleActiveFormatState(activeFormatsRef.current, action);

      if (Platform.OS !== 'web' || typeof document === 'undefined' || !domRef.current) {
        updateActiveFormats(nextFormats);
        return nextFormats;
      }

      if (action === 'bold' || action === 'italic' || action === 'underline' || action === 'code') {
        applyInlineFormatDom(action, targetState);
      } else if (action === 'h1') {
        pendingFormatsRef.current.h2 = false;
        pendingFormatsRef.current.quote = false;
        applyBlockFormatDom('H1', 'h1');
      } else if (action === 'h2') {
        pendingFormatsRef.current.h1 = false;
        pendingFormatsRef.current.quote = false;
        applyBlockFormatDom('H2', 'h2');
      } else if (action === 'quote') {
        pendingFormatsRef.current.h1 = false;
        pendingFormatsRef.current.h2 = false;
        applyBlockFormatDom('BLOCKQUOTE', 'quote');
      } else if (action === 'bullet') {
        ensureSelectionInsideEditor();
        document.execCommand('insertUnorderedList', false, null);
        pendingFormatsRef.current.bullet = targetState;
        emitChangeFromDom();
      }

      updateActiveFormats(nextFormats);
      return nextFormats;
    },
    [
      applyInlineFormatDom,
      applyBlockFormatDom,
      ensureSelectionInsideEditor,
      emitChangeFromDom,
      onEditStart,
      updateActiveFormats,
    ]
  );

  useImperativeHandle(
    ref,
    () => ({
      toggleFormat,
      focus: () => ensureSelectionInsideEditor(),
      getActiveFormats: () => activeFormatsRef.current,
      resetContent: (nextVal = '') => {
        if (Platform.OS === 'web' && domRef.current) {
          domRef.current.innerHTML = contentToRichHtml(nextVal) || '';
        }
        lastEmittedRef.current = nextVal;
        savedRangeRef.current = null;
        pendingFormatsRef.current = { ...DEFAULT_ACTIVE_FORMATS };
        updateActiveFormats({ ...DEFAULT_ACTIVE_FORMATS });
      },
    }),
    [toggleFormat, ensureSelectionInsideEditor, updateActiveFormats]
  );

  // Sync incoming external `value` changes (e.g. switching articles/branches or AI draft generation)
  useEffect(() => {
    if (Platform.OS !== 'web' || !domRef.current) return;
    if (value === lastEmittedRef.current) return;
    // Never overwrite the live contentEditable DOM while the user is actively focused and typing in it
    if (
      typeof document !== 'undefined' &&
      document.activeElement === domRef.current &&
      lastEmittedRef.current !== null
    ) {
      return;
    }

    const richHtml = contentToRichHtml(value);
    domRef.current.innerHTML = richHtml || '';
    lastEmittedRef.current = value;
    savedRangeRef.current = null;
    pendingFormatsRef.current = { ...DEFAULT_ACTIVE_FORMATS };
    updateActiveFormats({ ...DEFAULT_ACTIVE_FORMATS });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Inject scoped stylesheet on Web so headings, quotes, lists, code, and dividers look like a real publication
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const styleId = 'corvus-rich-editor-styles';
    if (document.getElementById(styleId)) return;

    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      .corvus-wysiwyg-editor {
        outline: none;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 16px;
        line-height: 1.75;
        word-break: break-word;
      }
      .corvus-wysiwyg-editor:empty:before {
        content: attr(data-placeholder);
        color: #94a3b8;
        font-style: italic;
        pointer-events: none;
      }
      .corvus-wysiwyg-editor h1 {
        font-family: Georgia, "Times New Roman", serif;
        font-size: 26px;
        font-weight: 800;
        line-height: 1.3;
        margin: 14px 0 8px 0;
      }
      .corvus-wysiwyg-editor h2 {
        font-family: Georgia, "Times New Roman", serif;
        font-size: 20px;
        font-weight: 700;
        line-height: 1.35;
        margin: 12px 0 6px 0;
      }
      .corvus-wysiwyg-editor h3 {
        font-family: Georgia, "Times New Roman", serif;
        font-size: 17px;
        font-weight: 700;
        line-height: 1.4;
        margin: 10px 0 4px 0;
      }
      .corvus-wysiwyg-editor p {
        margin: 0 0 10px 0;
      }
      .corvus-wysiwyg-editor b,
      .corvus-wysiwyg-editor strong {
        font-weight: 800;
      }
      .corvus-wysiwyg-editor i,
      .corvus-wysiwyg-editor em {
        font-style: italic;
      }
      .corvus-wysiwyg-editor u {
        text-decoration: underline;
      }
      .corvus-wysiwyg-editor ul {
        margin: 8px 0 12px 0;
        padding-left: 24px;
        list-style-type: disc;
      }
      .corvus-wysiwyg-editor ol {
        margin: 8px 0 12px 0;
        padding-left: 24px;
        list-style-type: decimal;
      }
      .corvus-wysiwyg-editor li {
        margin: 4px 0;
      }
      .corvus-wysiwyg-editor blockquote {
        border-left: 3px solid #ea580c;
        padding: 8px 14px;
        margin: 10px 0;
        font-style: italic;
        background: rgba(234, 88, 12, 0.06);
        border-radius: 0 6px 6px 0;
      }
      .corvus-wysiwyg-editor code,
      .corvus-wysiwyg-editor font[face="monospace"] {
        font-family: "Courier New", Courier, monospace;
        background: rgba(49, 94, 74, 0.12);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.92em;
      }
      .corvus-wysiwyg-editor hr {
        border: none;
        border-top: 1px solid rgba(100, 116, 139, 0.3);
        margin: 18px 0;
      }
    `;
    document.head.appendChild(styleEl);
  }, []);

  // Re-apply any pending toggled formats when the user clicks into the editor before typing
  const handleMouseUp = useCallback(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || !domRef.current) return;
    const sel = window.getSelection?.();
    const isCollapsed = !sel || sel.isCollapsed;
    const pending = pendingFormatsRef.current;

    if (isCollapsed && sel && sel.rangeCount > 0) {
      for (const key of ['bold', 'italic', 'underline', 'code']) {
        if (pending[key]) {
          const spec = INLINE_TAG_MAP[key];
          if (spec && !findAncestorTag(spec.aliases)) {
            const r = sel.getRangeAt(0);
            if (domRef.current.contains(r.commonAncestorContainer)) {
              const wrapper = document.createElement(spec.primary.toLowerCase());
              const zwsp = document.createTextNode('\u200B');
              wrapper.appendChild(zwsp);
              r.insertNode(wrapper);
              const nextR = document.createRange();
              nextR.setStart(zwsp, 1);
              nextR.collapse(true);
              sel.removeAllRanges();
              sel.addRange(nextR);
              savedRangeRef.current = nextR.cloneRange();
            }
          }
        }
      }
    }
    syncFormatsFromDom(true);
  }, [findAncestorTag, syncFormatsFromDom]);

  const handleInput = useCallback(() => {
    if (typeof onEditStart === 'function') {
      onEditStart();
    }
    pendingFormatsRef.current = { ...DEFAULT_ACTIVE_FORMATS };
    emitChangeFromDom();
    syncFormatsFromDom(false);
  }, [emitChangeFromDom, onEditStart, syncFormatsFromDom]);

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return (
      <View
        style={[
          styles.editorContainer,
          {
            backgroundColor: colors.card || colors.paper || '#ffffff',
            borderColor: colors.line || '#e2e8f0',
            minHeight,
          },
          style,
        ]}
      >
        <div
          ref={domRef}
          className="corvus-wysiwyg-editor"
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={handleInput}
          onKeyUp={() => syncFormatsFromDom(false)}
          onMouseUp={handleMouseUp}
          onFocus={() => {
            if (typeof onEditStart === 'function') onEditStart();
            syncFormatsFromDom(true);
          }}
          style={{
            minHeight: `${minHeight - 28}px`,
            color: colors.ink || '#1a1a1a',
            padding: '16px 18px',
            cursor: 'text',
          }}
        />
      </View>
    );
  }

  // Fallback for non-web native environments
  return (
    <View
      style={[
        styles.editorContainer,
        {
          backgroundColor: colors.card || colors.paper || '#ffffff',
          borderColor: colors.line || '#e2e8f0',
          minHeight,
          padding: 14,
        },
        style,
      ]}
    >
      <TextInput
        value={stripRichFormatting(value)}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted || '#94a3b8'}
        multiline
        textAlignVertical="top"
        style={{
          minHeight: minHeight - 28,
          color: colors.ink || '#1a1a1a',
          fontSize: 16,
          lineHeight: 26,
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  editorContainer: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
});

export default RichTextEditor;
