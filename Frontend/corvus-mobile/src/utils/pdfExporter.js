/**
 * Corvus Newsroom PDF Exporter & Viewer Utility
 * Generates editorial print layouts and manages prototype PDF documents.
 */

export function exportArticleToPdf(article) {
  if (typeof window === 'undefined') return;

  const title = article.title || 'Untitled Report';
  const author = article.author || 'Corvus Correspondent';
  const category = (article.category || 'Special Investigation').toUpperCase();
  const date = article.timestamp || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const summary = article.summary || '';
  const content = article.content || '';

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups for Corvus to export this article to PDF.');
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} - Corvus Wire</title>
  <style>
    @page {
      size: A4;
      margin: 22mm 18mm 22mm 18mm;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      color: #1A1A1A;
      background: #FFFFFF;
      line-height: 1.65;
      margin: 0;
      padding: 30px;
    }
    .masthead {
      border-bottom: 3px double #1A1A1A;
      padding-bottom: 14px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand-title {
      font-size: 34px;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
      line-height: 1;
      margin-bottom: 4px;
    }
    .brand-sub {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #C84B31;
      text-transform: uppercase;
    }
    .desk-stamp {
      font-family: monospace;
      font-size: 11px;
      text-align: right;
      color: #6B6860;
      line-height: 1.4;
    }
    .stamp-badge {
      display: inline-block;
      border: 1px solid #315E4A;
      color: #315E4A;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 9px;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .category {
      display: inline-block;
      background: #1A1A1A;
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 9px;
      font-weight: 800;
      padding: 3px 8px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 32px;
      line-height: 1.22;
      margin: 0 0 16px 0;
      font-weight: 700;
      color: #1A1A1A;
    }
    .byline-bar {
      border-top: 1px solid #E0DED6;
      border-bottom: 1px solid #E0DED6;
      padding: 10px 0;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      color: #6B6860;
    }
    .lead-summary {
      background: #F7F4ED;
      border-left: 4px solid #C84B31;
      padding: 16px 20px;
      font-style: italic;
      font-size: 16px;
      line-height: 1.5;
      color: #2E2C28;
      margin-bottom: 28px;
    }
    .article-body {
      font-size: 15px;
      line-height: 1.75;
      color: #1A1A1A;
      text-align: justify;
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 48px;
      border-top: 1px solid #E0DED6;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      font-family: monospace;
      font-size: 10px;
      color: #8C8880;
    }
    .action-bar {
      position: fixed;
      top: 16px;
      right: 16px;
      background: #315E4A;
      color: #FFF;
      padding: 10px 18px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: none;
    }
    .action-bar:hover {
      background: #244735;
    }
  </style>
</head>
<body>
  <button class="action-bar no-print" onclick="window.print()">
    Save as PDF / Print
  </button>

  <div class="masthead">
    <div>
      <div class="brand-title">CORVUS</div>
      <div class="brand-sub">Independent Investigative Newsroom Wire</div>
    </div>
    <div class="desk-stamp">
      <div class="stamp-badge">VERIFIED EDITORIAL RECORD</div>
      <div>SECURE WORKSPACE PROTOCOL</div>
    </div>
  </div>

  <div class="category">${escapeHtml(category)}</div>
  <h1>${escapeHtml(title)}</h1>

  <div class="byline-bar">
    <div>Reported by <strong>${escapeHtml(author)}</strong> • Corvus Newsroom</div>
    <div>${escapeHtml(date)}</div>
  </div>

  ${summary ? `<div class="lead-summary">${escapeHtml(summary)}</div>` : ''}

  <div class="article-body">${escapeHtml(content)}</div>

  <div class="footer">
    <div>CORVUS SECURE ARCHIVE • REPRODUCTION SUBJECT TO EDITORIAL CLEARANCE</div>
    <div>CONFIDENTIAL</div>
  </div>

  <script>
    // Prompt print dialog after styles render
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Download or open an uploaded PDF stored as base64 or Data URI
 */
export function openPdfDocument(fileName, dataUrl) {
  if (typeof window === 'undefined') return;

  if (dataUrl.startsWith('data:application/pdf') || dataUrl.startsWith('blob:')) {
    const win = window.open(dataUrl, '_blank');
    if (!win) {
      // Fallback: trigger download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } else {
    // If it's a direct URL
    window.open(dataUrl, '_blank');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

