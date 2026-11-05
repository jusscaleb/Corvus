import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { useTheme } from '../context/ThemeContext';

/**
 * Tokenizes and formats inline markdown elements:
 * - Links: [label](url)
 * - Bold & Italic: ***text***
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Strikethrough: ~~text~~
 * - Inline Code: `text`
 */
export function renderInlineFormatted(text, colors, isUser = false) {
  if (!text) return null;
  const str = String(text);

  const baseTextColor = isUser ? '#ffffff' : colors?.ink || '#0f172a';
  const forestColor = colors?.forest || '#315E4A';
  const linkColor = isUser ? '#e0f2fe' : (colors?.forest || '#0284c7');
  const codeBg = isUser ? 'rgba(255, 255, 255, 0.2)' : (colors?.note || '#f1f5f9');
  const codeColor = isUser ? '#ffffff' : forestColor;

  // Regex tokenizing links, bold-italic, bold, italic, strikethrough, and code
  const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|_[^_]+_|\*[^*]+\*|`[^`]+`)/g;
  const parts = str.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      return (
        <Text
          key={idx}
          accessibilityRole="link"
          onPress={() => Linking.openURL(url).catch(() => {})}
          style={{ color: linkColor, textDecorationLine: 'underline', fontWeight: '600' }}
        >
          {label}
        </Text>
      );
    }

    // Bold + Italic: ***text***
    if (part.startsWith('***') && part.endsWith('***') && part.length > 6) {
      return (
        <Text key={idx} style={{ fontWeight: '800', fontStyle: 'italic', color: baseTextColor }}>
          {part.slice(3, -3)}
        </Text>
      );
    }

    // Bold: **text** or __text__
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length > 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length > 4)
    ) {
      return (
        <Text key={idx} style={{ fontWeight: '800', color: baseTextColor }}>
          {part.slice(2, -2)}
        </Text>
      );
    }

    // Strikethrough: ~~text~~
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
      return (
        <Text key={idx} style={{ textDecorationLine: 'line-through', color: baseTextColor, opacity: 0.75 }}>
          {part.slice(2, -2)}
        </Text>
      );
    }

    // Underline or Italic: _text_
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      return (
        <Text key={idx} style={{ fontStyle: 'italic', color: baseTextColor }}>
          {part.slice(1, -1)}
        </Text>
      );
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <Text key={idx} style={{ fontStyle: 'italic', color: baseTextColor }}>
          {part.slice(1, -1)}
        </Text>
      );
    }

    // Inline Code: `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <Text
          key={idx}
          style={{
            fontFamily: 'monospace',
            backgroundColor: codeBg,
            color: codeColor,
            paddingHorizontal: 5,
            paddingVertical: 1,
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {part.slice(1, -1)}
        </Text>
      );
    }

    // Standard unformatted text
    return (
      <Text key={idx} style={{ color: baseTextColor }}>
        {part}
      </Text>
    );
  });
}

/**
 * Checks if a block of lines constitutes a Markdown table:
 * Header row: contains |
 * Separator row: | --- | ---: | :---: |
 */
function isTableBlock(lines, startIdx) {
  if (startIdx + 1 >= lines.length) return false;
  const headerLine = lines[startIdx].trim();
  const sepLine = lines[startIdx + 1].trim();

  if (!headerLine.includes('|') || !sepLine.includes('|')) return false;

  // Separator must consist of |, -, :, and whitespace
  const isSeparator = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(sepLine);
  return isSeparator;
}

/**
 * Parses markdown table lines into structured { headers, alignments, rows }
 */
function parseTable(lines, startIdx) {
  const headerLine = lines[startIdx].trim();
  const sepLine = lines[startIdx + 1].trim();

  const splitRow = (line) => {
    let clean = line;
    if (clean.startsWith('|')) clean = clean.slice(1);
    if (clean.endsWith('|')) clean = clean.slice(0, -1);
    return clean.split('|').map((c) => c.trim());
  };

  const headers = splitRow(headerLine);
  const sepCells = splitRow(sepLine);
  const alignments = sepCells.map((cell) => {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    return 'left';
  });

  const rows = [];
  let currIdx = startIdx + 2;
  while (currIdx < lines.length) {
    const line = lines[currIdx].trim();
    if (!line || !line.includes('|')) break;
    rows.push(splitRow(line));
    currIdx++;
  }

  return {
    headers,
    alignments,
    rows,
    nextIdx: currIdx - 1, // index of last consumed table line
  };
}

/**
 * Universal Markdown Renderer with rich table support, headings, code blocks,
 * blockquotes, and lists.
 */
export default function MarkdownRenderer({ content, isUser = false, customColors, style }) {
  const themeContext = useTheme();
  const colors = customColors || themeContext?.colors || {
    ink: '#0f172a',
    forest: '#315E4A',
    paper: '#ffffff',
    note: '#f1f5f9',
    line: '#e2e8f0',
    border: '#cbd5e1',
    muted: '#64748b',
  };

  const lines = String(content || '').split('\n');
  const elements = [];

  let idx = 0;
  while (idx < lines.length) {
    const rawLine = lines[idx];
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    // 1. Empty lines -> vertical spacing
    if (!trimmed) {
      elements.push(<View key={`empty_${idx}`} style={{ height: 6 }} />);
      idx++;
      continue;
    }

    // 2. Fenced Code Blocks (```)
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines = [];
      idx++;
      while (idx < lines.length && !lines[idx].trim().startsWith('```')) {
        codeLines.push(lines[idx]);
        idx++;
      }
      const codeBody = codeLines.join('\n');
      elements.push(
        <View
          key={`code_${idx}`}
          style={[
            styles.codeBlock,
            {
              backgroundColor: isUser ? 'rgba(0,0,0,0.2)' : (colors?.note || '#0f172a'),
              borderColor: isUser ? 'rgba(255,255,255,0.15)' : (colors?.line || '#334155'),
            },
          ]}
        >
          {!!lang && (
            <View style={styles.codeHeader}>
              <Text style={styles.codeLangText}>{lang.toUpperCase()}</Text>
            </View>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={[styles.codeText, { color: isUser ? '#ffffff' : '#38bdf8' }]}>
              {codeBody}
            </Text>
          </ScrollView>
        </View>
      );
      idx++; // skip closing ```
      continue;
    }

    // 3. Tables (| Col 1 | Col 2 |)
    if (isTableBlock(lines, idx)) {
      const tableData = parseTable(lines, idx);
      idx = tableData.nextIdx + 1;

      const borderColor = isUser ? 'rgba(255,255,255,0.25)' : (colors?.line || '#cbd5e1');
      const headerBg = isUser ? 'rgba(255,255,255,0.15)' : (colors?.note || '#f8fafc');

      elements.push(
        <ScrollView
          key={`table_${idx}`}
          horizontal
          showsHorizontalScrollIndicator={true}
          style={styles.tableScrollView}
          contentContainerStyle={styles.tableScrollContent}
        >
          <View style={[styles.tableContainer, { borderColor }]}>
            {/* Table Header */}
            <View style={[styles.tableHeaderRow, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
              {tableData.headers.map((h, cIdx) => (
                <View
                  key={`th_${cIdx}`}
                  style={[
                    styles.tableCell,
                    cIdx > 0 && { borderLeftWidth: 1, borderLeftColor: borderColor },
                    { alignItems: tableData.alignments[cIdx] === 'right' ? 'flex-end' : tableData.alignments[cIdx] === 'center' ? 'center' : 'flex-start' },
                  ]}
                >
                  <Text style={[styles.tableHeaderText, { color: isUser ? '#ffffff' : colors?.ink || '#0f172a' }]}>
                    {renderInlineFormatted(h, colors, isUser)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Table Rows */}
            {tableData.rows.map((row, rIdx) => {
              const isEven = rIdx % 2 === 0;
              const rowBg = isUser
                ? (isEven ? 'transparent' : 'rgba(255,255,255,0.06)')
                : (isEven ? 'transparent' : (colors?.note ? `${colors.note}44` : '#f8fafc'));
              return (
                <View
                  key={`tr_${rIdx}`}
                  style={[
                    styles.tableRow,
                    { backgroundColor: rowBg },
                    rIdx < tableData.rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor },
                  ]}
                >
                  {tableData.headers.map((_, cIdx) => {
                    const cellVal = row[cIdx] || '';
                    return (
                      <View
                        key={`td_${rIdx}_${cIdx}`}
                        style={[
                          styles.tableCell,
                          cIdx > 0 && { borderLeftWidth: 1, borderLeftColor: borderColor },
                          { alignItems: tableData.alignments[cIdx] === 'right' ? 'flex-end' : tableData.alignments[cIdx] === 'center' ? 'center' : 'flex-start' },
                        ]}
                      >
                        <Text style={[styles.tableCellText, { color: isUser ? '#ffffff' : colors?.ink || '#0f172a' }]}>
                          {renderInlineFormatted(cellVal, colors, isUser)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      );
      continue;
    }

    // 4. Horizontal Rules (---, ***, ___)
    if (/^(?:---|___|\*\*\*)$/.test(trimmed)) {
      elements.push(
        <View
          key={`hr_${idx}`}
          style={[styles.hr, { backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : (colors?.line || '#cbd5e1') }]}
        />
      );
      idx++;
      continue;
    }

    // 5. Headings (#, ##, ###, ####)
    if (line.startsWith('# ')) {
      elements.push(
        <Text key={`h1_${idx}`} style={[styles.h1, { color: isUser ? '#ffffff' : colors.ink }]}>
          {renderInlineFormatted(line.slice(2), colors, isUser)}
        </Text>
      );
      idx++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <Text key={`h2_${idx}`} style={[styles.h2, { color: isUser ? '#ffffff' : colors.ink }]}>
          {renderInlineFormatted(line.slice(3), colors, isUser)}
        </Text>
      );
      idx++;
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <Text key={`h3_${idx}`} style={[styles.h3, { color: isUser ? '#ffffff' : colors.ink }]}>
          {renderInlineFormatted(line.slice(4), colors, isUser)}
        </Text>
      );
      idx++;
      continue;
    }

    // 6. Blockquotes (> quote)
    if (line.startsWith('> ')) {
      elements.push(
        <View
          key={`quote_${idx}`}
          style={[
            styles.blockquote,
            {
              borderLeftColor: colors?.orange || colors?.forest || '#315E4A',
              backgroundColor: isUser ? 'rgba(0,0,0,0.15)' : (colors?.note || 'rgba(0,0,0,0.03)'),
            },
          ]}
        >
          <Text style={[styles.blockquoteText, { color: isUser ? '#ffffff' : colors.ink }]}>
            {renderInlineFormatted(line.slice(2), colors, isUser)}
          </Text>
        </View>
      );
      idx++;
      continue;
    }

    // 7. Standalone Bold Lead Line (e.g. "**Summary – NUST Zimbabwe**")
    const boldLineMatch = trimmed.match(/^\*\*([^*]+)\*\*$/);
    if (boldLineMatch) {
      elements.push(
        <Text key={`lead_${idx}`} style={[styles.leadBoldTitle, { color: isUser ? '#ffffff' : colors.ink }]}>
          {boldLineMatch[1]}
        </Text>
      );
      idx++;
      continue;
    }

    // 8. Bullet Lists (- item, * item, • item)
    const bulletMatch = trimmed.match(/^(?:•|-|\*)\s+(.*)$/);
    if (bulletMatch) {
      const itemText = bulletMatch[1];
      elements.push(
        <View key={`bullet_${idx}`} style={styles.listItemRow}>
          <Text style={[styles.bulletSymbol, { color: isUser ? '#ffffff' : (colors?.forest || '#315E4A') }]}>
            •
          </Text>
          <Text style={[styles.bodyText, { flex: 1, color: isUser ? '#ffffff' : colors.ink }]}>
            {renderInlineFormatted(itemText, colors, isUser)}
          </Text>
        </View>
      );
      idx++;
      continue;
    }

    // 9. Numbered Lists (1. item, 2. item)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const num = numMatch[1];
      const itemText = numMatch[2];
      elements.push(
        <View key={`num_${idx}`} style={styles.listItemRow}>
          <Text style={[styles.numSymbol, { color: isUser ? '#ffffff' : (colors?.forest || '#315E4A') }]}>
            {num}.
          </Text>
          <Text style={[styles.bodyText, { flex: 1, color: isUser ? '#ffffff' : colors.ink }]}>
            {renderInlineFormatted(itemText, colors, isUser)}
          </Text>
        </View>
      );
      idx++;
      continue;
    }

    // 10. Standard Paragraph Line
    elements.push(
      <Text key={`p_${idx}`} style={[styles.bodyText, { color: isUser ? '#ffffff' : colors.ink }]}>
        {renderInlineFormatted(line, colors, isUser)}
      </Text>
    );
    idx++;
  }

  return <View style={[styles.wrapper, style]}>{elements}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 23,
  },
  leadBoldTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  h1: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'serif',
    lineHeight: 28,
    marginTop: 8,
    marginBottom: 4,
  },
  h2: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'serif',
    lineHeight: 24,
    marginTop: 6,
    marginBottom: 2,
  },
  h3: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    marginTop: 4,
  },
  hr: {
    height: 1,
    marginVertical: 10,
  },
  blockquote: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 6,
    marginVertical: 4,
    borderRadius: 4,
  },
  blockquoteText: {
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 22,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 4,
  },
  bulletSymbol: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  numSymbol: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 22,
    minWidth: 18,
  },
  codeBlock: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  codeHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 4,
    marginBottom: 6,
  },
  codeLangText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 19,
  },
  tableScrollView: {
    marginVertical: 8,
  },
  tableScrollContent: {
    paddingRight: 8,
  },
  tableContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 110,
    justifyContent: 'center',
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tableCellText: {
    fontSize: 13,
    lineHeight: 19,
  },
});

