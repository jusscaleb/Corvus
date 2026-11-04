/**
 * Corvus Newsroom PDF Exporter & Viewer Utility
 *
 * - Web:     Opens a print-ready HTML page via window.open (browser print dialog → Save as PDF)
 * - Mobile:  Renders HTML to a PDF via expo-print, saves it to a dedicated
 *            "Corvus" folder in the device's document directory, then opens
 *            the native share sheet so the user can open/save it anywhere.
 */

import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// ─── HTML Template ───────────────────────────────────────────────────────────

function buildArticleHtml(article) {
  const title    = article.title    || 'Untitled Report';
  const author   = article.author   || 'Corvus Correspondent';
  const category = (article.category || 'Special Investigation').toUpperCase();
  const date     = article.timestamp || new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const summary = article.summary || '';
  const content = article.content || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} - Corvus Wire</title>
  <style>
    @page { size: A4; margin: 22mm 18mm 22mm 18mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      color: #1A1A1A; background: #FFFFFF;
      line-height: 1.65; margin: 0; padding: 30px;
    }
    .masthead {
      border-bottom: 3px double #1A1A1A;
      padding-bottom: 14px; margin-bottom: 24px;
      display: flex; justify-content: space-between; align-items: flex-end;
    }
    .brand-title {
      font-size: 34px; font-weight: 900;
      letter-spacing: 2px; text-transform: uppercase; line-height: 1; margin-bottom: 4px;
    }
    .brand-sub {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
      color: #C84B31; text-transform: uppercase;
    }
    .desk-stamp { font-family: monospace; font-size: 11px; text-align: right; color: #6B6860; line-height: 1.4; }
    .stamp-badge {
      display: inline-block; border: 1px solid #315E4A; color: #315E4A;
      font-weight: 800; padding: 2px 6px; border-radius: 3px;
      font-size: 9px; letter-spacing: 1px; margin-bottom: 4px;
    }
    .category {
      display: inline-block; background: #1A1A1A; color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 9px; font-weight: 800; padding: 3px 8px;
      text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 12px;
    }
    h1 { font-size: 32px; line-height: 1.22; margin: 0 0 16px 0; font-weight: 700; color: #1A1A1A; }
    .byline-bar {
      border-top: 1px solid #E0DED6; border-bottom: 1px solid #E0DED6;
      padding: 10px 0; margin-bottom: 24px;
      display: flex; justify-content: space-between;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px; color: #6B6860;
    }
    .lead-summary {
      background: #F7F4ED; border-left: 4px solid #C84B31;
      padding: 16px 20px; font-style: italic; font-size: 16px;
      line-height: 1.5; color: #2E2C28; margin-bottom: 28px;
    }
    .article-body { font-size: 15px; line-height: 1.75; color: #1A1A1A; text-align: justify; white-space: pre-wrap; }
    .footer {
      margin-top: 48px; border-top: 1px solid #E0DED6; padding-top: 14px;
      display: flex; justify-content: space-between;
      font-family: monospace; font-size: 10px; color: #8C8880;
    }
    .action-bar {
      position: fixed; top: 16px; right: 16px;
      background: #315E4A; color: #FFF; padding: 10px 18px; border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px; font-weight: 700; cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: none;
    }
    .action-bar:hover { background: #244735; }
  </style>
</head>
<body>
  <button class="action-bar no-print" onclick="window.print()">Save as PDF / Print</button>

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
    <div>Reported by <strong>${escapeHtml(author)}</strong> &bull; Corvus Newsroom</div>
    <div>${escapeHtml(date)}</div>
  </div>

  ${summary ? `<div class="lead-summary">${escapeHtml(summary)}</div>` : ''}

  <div class="article-body">${escapeHtml(content)}</div>

  <div class="footer">
    <div>CORVUS SECURE ARCHIVE &bull; REPRODUCTION SUBJECT TO EDITORIAL CLEARANCE</div>
    <div>CONFIDENTIAL</div>
  </div>

  <script>
    window.onload = function () {
      setTimeout(function () { window.print(); }, 250);
    };
  </script>
</body>
</html>`;
}

// ─── Mobile export (expo-print + expo-file-system + expo-sharing) ─────────────

async function exportArticleMobile(article) {
  let tempUri = null;
  try {
    const title    = article.title || 'Untitled_Report';
    const safeName = title.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
    const html     = buildArticleHtml(article);

    // 1. Render HTML → PDF temp file via expo-print
    const printResult = await Print.printToFileAsync({ html, base64: false });
    tempUri = printResult?.uri;
    if (!tempUri) {
      throw new Error('Print service did not return a file URI.');
    }

    // 2. Ensure Corvus directory exists in the device document store
    const corvusDir = `${FileSystem.documentDirectory}Corvus/`;
    const dirInfo   = await FileSystem.getInfoAsync(corvusDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(corvusDir, { intermediates: true });
    }

    // 3. Copy PDF to the destination (copyAsync is reliable across storage partitions on Android)
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const fileName  = `${safeName}_${timestamp}.pdf`;
    const destUri   = `${corvusDir}${fileName}`;

    const destInfo = await FileSystem.getInfoAsync(destUri);
    if (destInfo.exists) {
      await FileSystem.deleteAsync(destUri, { idempotent: true });
    }

    await FileSystem.copyAsync({ from: tempUri, to: destUri });

    // 4. Open native share sheet so user can open in Files, Drive, or share
    let shared = false;
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(destUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Export "${title}" — Corvus`,
          UTI: 'com.adobe.pdf',
        });
        shared = true;
      }
    } catch (shareErr) {
      console.warn('[pdfExporter] Share sheet interaction:', shareErr?.message);
    }

    if (!shared) {
      Alert.alert(
        'PDF Saved',
        `Your article has been saved to your device's Corvus directory.\n\nFile: ${fileName}`,
        [{ text: 'OK' }]
      );
    }
  } catch (err) {
    console.error('[pdfExporter] Mobile export failed:', err);
    Alert.alert('Export Failed', 'Could not generate the PDF. Please try again.');
  } finally {
    // Clean up temporary cache file generated by Print
    if (tempUri) {
      FileSystem.deleteAsync(tempUri, { idempotent: true }).catch(() => {});
    }
  }
}

// ─── Web export (window.open → browser print dialog) ─────────────────────────

function exportArticleWeb(article) {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for Corvus to export this article to PDF.');
      return;
    }
    const html = buildArticleHtml(article);
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } catch (err) {
    console.error('[pdfExporter] Web export failed:', err);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function exportArticleToPdf(article) {
  if (Platform.OS === 'web') {
    exportArticleWeb(article);
  } else {
    exportArticleMobile(article);
  }
}

/**
 * Open or download an uploaded PDF (base64, data URI, http URL, or file URL).
 * On mobile, saves to Corvus directory and shares via native share sheet.
 */
export async function openPdfDocument(fileName, dataUrl) {
  if (Platform.OS !== 'web') {
    try {
      if (!dataUrl) {
        Alert.alert('Error', 'No document data available to open.');
        return;
      }

      const corvusDir = `${FileSystem.documentDirectory}Corvus/`;
      const dirInfo   = await FileSystem.getInfoAsync(corvusDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(corvusDir, { intermediates: true });
      }

      const safeName = (fileName || 'document.pdf').replace(/[^a-zA-Z0-9_.\- ]/g, '').replace(/\s+/g, '_');
      const destUri  = `${corvusDir}${safeName}`;

      const destInfo = await FileSystem.getInfoAsync(destUri);
      if (destInfo.exists) {
        await FileSystem.deleteAsync(destUri, { idempotent: true });
      }

      if (dataUrl.startsWith('data:')) {
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        await FileSystem.writeAsStringAsync(destUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
        await FileSystem.downloadAsync(dataUrl, destUri);
      } else if (dataUrl.startsWith('file://')) {
        await FileSystem.copyAsync({ from: dataUrl, to: destUri });
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(destUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Open "${safeName}" — Corvus`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('File Saved', `PDF saved to Corvus directory:\n${safeName}`);
      }
    } catch (err) {
      console.error('[pdfExporter] openPdfDocument mobile failed:', err);
      Alert.alert('Error', 'Could not open the PDF file.');
    }
    return;
  }

  // Web fallback
  try {
    if (dataUrl.startsWith('data:application/pdf') || dataUrl.startsWith('blob:')) {
      const win = window.open(dataUrl, '_blank');
      if (!win) {
        const link    = document.createElement('a');
        link.href     = dataUrl;
        link.download = fileName || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      window.open(dataUrl, '_blank');
    }
  } catch (err) {
    console.error('[pdfExporter] openPdfDocument web failed:', err);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
