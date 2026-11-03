import { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createArticle, generateArticleDraft } from '../services/api';
import { exportArticleToPdf } from '../utils/pdfExporter';
import { LockIcon, UsersIcon, EditIcon, FilePdfIcon, FileTextIcon, PrinterIcon } from './AppIcons';
import RichTextEditor, { stripRichFormatting } from './RichTextEditor';

export default function CreateArticleModal({
  visible,
  onClose,
  onCreated,
  newsrooms = [],
  defaultGroupId = '',
}) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const styles = makeStyles(colors);

  const [mode, setMode] = useState('write'); // 'write' | 'upload'
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);

  // PDF Upload states
  const [pdfFile, setPdfFile] = useState(null); // { name, size, dataUrl }

  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setSummary('');
      setContent('');
      setPdfFile(null);
      setMode('write');
      setSubmitting(false);
      setGeneratingDraft(false);

      // Default to the active newsroom (or the user's first newsroom) so stories
      // are shared with the desk unless the reporter explicitly chooses Personal Draft
      const preferred =
        defaultGroupId && newsrooms.some((n) => String(n.id) === String(defaultGroupId))
          ? defaultGroupId
          : newsrooms[0]?.id || '';
      setSelectedGroupId(preferred);

      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 85, friction: 9, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.92, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, newsrooms]);

  function handleFileSelect(e) {
    const file = e.target?.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast({ message: 'Only PDF documents (.pdf) are supported.', type: 'error' });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast({ message: 'File is too large. Max size is 15MB.', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPdfFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        dataUrl: reader.result,
      });
      if (!title) {
        // Auto-fill title from file name
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
      showToast({ message: `Loaded ${file.name}`, type: 'info' });
    };
    reader.readAsDataURL(file);
  }

  function triggerNativeFilePicker() {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf';
      input.onchange = handleFileSelect;
      input.click();
    } else {
      showToast({ message: 'File picking on mobile requires document picker.', type: 'info' });
    }
  }

  function handlePreviewPdf() {
    if (!title.trim()) {
      showToast({ message: 'Enter a headline before previewing PDF.', type: 'error' });
      return;
    }
    const targetGroup = newsrooms.find((g) => g.id === selectedGroupId);
    exportArticleToPdf({
      title: title.trim(),
      category: targetGroup?.title || 'EDITORIAL SPECIAL',
      author: user?.full_name || user?.username || 'Staff Reporter',
      timestamp: new Date().toLocaleDateString(),
      summary: summary.trim(),
      content: content.trim() || 'Draft content in progress...',
    });
  }

  async function handleGenerateAIDraft() {
    const cleanTitle = title.trim();
    const cleanBrief = summary.trim();
    if (!cleanTitle && !cleanBrief) {
      showToast({
        message: 'Enter a brief summary or headline first so Saiph AI knows what to draft.',
        type: 'error',
      });
      return;
    }

    setGeneratingDraft(true);
    try {
      const targetGroup = newsrooms.find((g) => g.id === selectedGroupId);
      const draft = await generateArticleDraft({
        title: cleanTitle,
        brief: cleanBrief || cleanTitle,
        category: targetGroup?.title || 'Investigative Report',
      });
      if (!cleanTitle && draft?.headline) {
        setTitle(draft.headline);
      }
      if (draft?.summary && !cleanBrief) {
        setSummary(draft.summary);
      }
      if (draft?.content) {
        setContent(draft.content);
      }
      showToast({
        message: '✦ Saiph AI generated a full structured draft from your brief!',
        type: 'info',
      });
    } catch (err) {
      showToast({
        message: err?.message || 'Could not generate AI draft right now.',
        type: 'error',
      });
    } finally {
      setGeneratingDraft(false);
    }
  }

  async function handlePublish() {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      showToast({ message: 'Please enter a headline for the story.', type: 'error' });
      return;
    }

    // Personal drafts pass groupId as null

    if (mode === 'upload' && !pdfFile) {
      showToast({ message: 'Please select a PDF document to upload.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      let finalContent = content.trim();
      let finalSummary = summary.trim();

      // If PDF document mode, serialize the PDF metadata into branch
      if (mode === 'upload' && pdfFile) {
        finalSummary = finalSummary || `PDF Document: ${pdfFile.name} (${pdfFile.size})`;
        finalContent = JSON.stringify({
          isPdfFile: true,
          fileName: pdfFile.name,
          fileSize: pdfFile.size,
          dataUrl: pdfFile.dataUrl,
        });
      }

      const newArticle = await createArticle({
        groupId: selectedGroupId || null,
        title: cleanTitle,
        summary: finalSummary,
        content: finalContent,
      });

      const targetGroup = newsrooms.find((g) => g.id === selectedGroupId);
      const isPersonal = !selectedGroupId;
      const formatted = {
        id: newArticle.article_id,
        type: 'article',
        title: newArticle.title,
        category: isPersonal ? 'Personal Draft' : (targetGroup?.title || 'Newsroom'),
        isPersonal,
        groupId: selectedGroupId || null,
        branchId: newArticle.branches?.[0]?.branch_id,
        timestamp: 'Just now',
        author: user?.full_name || user?.username || 'You',
        readTime: '1 branch',
        symbol: '◎',
        summary: finalSummary || 'Draft published.',
        content: finalContent,
        isPdf: mode === 'upload' && Boolean(pdfFile),
        pdfFile: pdfFile,
      };

      showToast({ message: 'Story dispatched to newsroom archive!', type: 'info' });
      if (onCreated) onCreated(formatted);
      onClose();
    } catch (err) {
      showToast({ message: err?.message || 'Could not publish article.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  if (!visible) return null;

  const targetGroup = newsrooms.find((g) => g.id === selectedGroupId);

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable accessibilityRole="button" onPress={onClose} style={StyleSheet.absoluteFill} />

        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.eyebrow}>EDITORIAL DESK / DISPATCH</Text>
              <Text style={styles.title}>File New Story or PDF</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* Newsroom or Personal selector */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>ASSIGNMENT SCOPE (PERSONAL OR NEWSROOM DESK)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deskList}>
                <Pressable
                  onPress={() => setSelectedGroupId('')}
                  style={[styles.deskChip, !selectedGroupId && styles.deskChipSelected]}
                >
                  <Text style={[styles.deskChipText, !selectedGroupId && styles.deskChipTextSelected]}>
                    Personal Draft (Only You)
                  </Text>
                </Pressable>
                {newsrooms.map((nr) => {
                  const isSelected = nr.id === selectedGroupId;
                  return (
                    <Pressable
                      key={nr.id}
                      onPress={() => setSelectedGroupId(nr.id)}
                      style={[styles.deskChip, isSelected && styles.deskChipSelected]}
                    >
                      <Text style={[styles.deskChipText, isSelected && styles.deskChipTextSelected]}>
                        {nr.title} Desk
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Mode switch (Write Article vs Upload PDF) */}
            <View style={styles.modeTabs}>
              <Pressable
                onPress={() => setMode('write')}
                style={[styles.modeTab, mode === 'write' && styles.modeTabActive]}
              >
                <Text style={[styles.modeTabText, mode === 'write' && styles.modeTabTextActive]}>
                  Write Story (Text & PDF)
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('upload')}
                style={[styles.modeTab, mode === 'upload' && styles.modeTabActive]}
              >
                <Text style={[styles.modeTabText, mode === 'upload' && styles.modeTabTextActive]}>
                  Attach PDF Document
                </Text>
              </Pressable>
            </View>

            {/* Headline / Title */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>HEADLINE / DOCUMENT TITLE *</Text>
              <TextInput
                placeholder="e.g. Investigation: City Water Board Contract Audit..."
                placeholderTextColor={colors.muted}
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />
            </View>

            {mode === 'write' ? (
              <>
                {/* Lead Summary / Brief for AI Draft Generation */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>LEAD SUMMARY / BRIEF FOR SAIPH AI</Text>
                  <TextInput
                    placeholder="Give a brief summary of your story angle, key facts, or sources..."
                    placeholderTextColor={colors.muted}
                    value={summary}
                    onChangeText={setSummary}
                    multiline
                    numberOfLines={2}
                    style={[styles.input, styles.textAreaSmall]}
                  />
                  <View style={styles.aiDraftBanner}>
                    <View style={styles.aiDraftInfo}>
                      <Text style={styles.aiDraftTitle}>✦ Saiph AI Draft Assistant</Text>
                      <Text style={styles.aiDraftSub}>
                        Type a brief summary above and let Saiph AI generate a structured article draft.
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={handleGenerateAIDraft}
                      disabled={generatingDraft || (!title.trim() && !summary.trim())}
                      style={[
                        styles.aiDraftBtn,
                        (generatingDraft || (!title.trim() && !summary.trim())) && styles.btnDisabled,
                      ]}
                    >
                      {generatingDraft ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.aiDraftBtnText}>✦ Generate AI Draft</Text>
                      )}
                    </Pressable>
                  </View>
                </View>

                {/* Article Body */}
                <View style={styles.fieldBlock}>
                  <View style={styles.fieldLabelRow}>
                    <Text style={styles.fieldLabel}>ARTICLE BODY (EDITABLE & PRINTABLE)</Text>
                    <Text style={styles.countText}>
                      {stripRichFormatting(content).length} chars •{' '}
                      {stripRichFormatting(content) ? stripRichFormatting(content).split(/\s+/).length : 0} words
                    </Text>
                  </View>
                  <RichTextEditor
                    placeholder="Compose your article, investigative evidence, and sources here..."
                    value={content}
                    onChangeText={setContent}
                    colors={colors}
                    minHeight={240}
                  />
                </View>
              </>
            ) : (
              /* PDF Upload Mode */
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>ATTACH INVESTIGATIVE PDF DOCUMENT</Text>
                {pdfFile ? (
                  <View style={styles.pdfFileCard}>
                    <View style={styles.pdfIconBadge}>
                      <Text style={styles.pdfIconText}>PDF</Text>
                    </View>
                    <View style={styles.pdfMeta}>
                      <Text numberOfLines={1} style={styles.pdfName}>
                        {pdfFile.name}
                      </Text>
                      <Text style={styles.pdfSize}>{pdfFile.size} • Ready for archive</Text>
                    </View>
                    <Pressable onPress={() => setPdfFile(null)} style={styles.removeFileBtn}>
                      <Text style={styles.removeFileText}>✕</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable onPress={triggerNativeFilePicker} style={styles.dropZone}>
                    <FileTextIcon size={36} color={colors.forest} style={{ marginBottom: 6 }} />
                    <Text style={styles.dropZoneTitle}>Select a PDF Document</Text>
                    <Text style={styles.dropZoneSubtitle}>
                      Click to browse or drop an investigative report, dossier, or memo (.pdf up to 15MB)
                    </Text>
                  </Pressable>
                )}

                {/* Optional note with upload */}
                <View style={{ marginTop: 14 }}>
                  <Text style={styles.fieldLabel}>DOCUMENT CONTEXT / EXECUTIVE BRIEF</Text>
                  <TextInput
                    placeholder="Context notes on this dossier for the editorial desk..."
                    placeholderTextColor={colors.muted}
                    value={summary}
                    onChangeText={setSummary}
                    multiline
                    numberOfLines={2}
                    style={[styles.input, styles.textAreaSmall]}
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer actions */}
          <View style={styles.cardFooter}>
            {mode === 'write' && (
              <Pressable
                onPress={handlePreviewPdf}
                disabled={submitting || !title.trim()}
                style={[styles.previewPdfBtn, !title.trim() && styles.btnDisabled]}
              >
                <Text style={styles.previewPdfText}>Preview PDF</Text>
              </Pressable>
            )}

            <View style={styles.rightActions}>
              <Pressable onPress={onClose} disabled={submitting} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handlePublish}
                disabled={submitting || !title.trim()}
                style={[
                  styles.publishBtn,
                  (submitting || !title.trim()) && styles.publishBtnDisabled,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.publishBtnText}>
                    {mode === 'upload' ? 'Upload & Archive' : 'Dispatch Story'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    },
    card: {
      width: '100%',
      maxWidth: 680,
      maxHeight: '90%',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.cardBg,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 18,
      elevation: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 22,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      backgroundColor: colors.headerBg,
    },
    eyebrow: {
      color: colors.orange,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.2,
    },
    title: {
      color: colors.ink,
      fontFamily: 'serif',
      fontSize: 20,
      fontWeight: '700',
      marginTop: 2,
    },
    closeBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: colors.note,
    },
    closeText: {
      color: colors.muted,
      fontSize: 16,
      fontWeight: '700',
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      padding: 22,
      gap: 16,
    },
    fieldBlock: {
      gap: 6,
    },
    fieldLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    fieldLabel: {
      color: colors.ink,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    countText: {
      color: colors.muted,
      fontSize: 10,
      fontFamily: 'monospace',
    },
    noDeskWarning: {
      padding: 12,
      backgroundColor: colors.errorBg || '#FFF5F5',
      borderWidth: 1,
      borderColor: colors.errorBorder || '#F5C6CB',
      borderRadius: 6,
    },
    warningText: {
      color: colors.errorText || '#721C24',
      fontSize: 12,
    },
    deskList: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 4,
    },
    deskChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      marginRight: 8,
    },
    deskChipSelected: {
      borderColor: colors.forest,
      backgroundColor: colors.forest,
    },
    deskChipText: {
      color: colors.ink,
      fontSize: 12,
      fontWeight: '600',
    },
    deskChipTextSelected: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    modeTabs: {
      flexDirection: 'row',
      borderRadius: 6,
      backgroundColor: colors.note,
      padding: 3,
      gap: 4,
    },
    modeTab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 5,
    },
    modeTabActive: {
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.line,
    },
    modeTabText: {
      fontSize: 12,
      color: colors.muted,
      fontWeight: '600',
    },
    modeTabTextActive: {
      color: colors.ink,
      fontWeight: '700',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.inputBg,
      color: colors.ink,
      fontSize: 14,
    },
    textAreaSmall: {
      minHeight: 56,
      fontStyle: 'italic',
    },
    textAreaLarge: {
      minHeight: 180,
      lineHeight: 22,
    },
    dropZone: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.line,
      borderRadius: 8,
      padding: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.paper,
      gap: 6,
    },
    dropZoneIcon: {
      fontSize: 34,
      marginBottom: 4,
    },
    dropZoneTitle: {
      color: colors.ink,
      fontSize: 14,
      fontWeight: '700',
    },
    dropZoneSubtitle: {
      color: colors.muted,
      fontSize: 11,
      textAlign: 'center',
      maxWidth: 380,
    },
    pdfFileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 6,
      backgroundColor: colors.paper,
    },
    pdfIconBadge: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 4,
      backgroundColor: colors.orange,
    },
    pdfIconText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 1,
    },
    pdfMeta: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    pdfName: {
      color: colors.ink,
      fontSize: 13,
      fontWeight: '700',
    },
    pdfSize: {
      color: colors.muted,
      fontSize: 11,
    },
    removeFileBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.note,
    },
    removeFileText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '700',
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 22,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      backgroundColor: colors.headerBg,
    },
    previewPdfBtn: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.cardBg,
    },
    previewPdfText: {
      color: colors.ink,
      fontSize: 12,
      fontWeight: '700',
    },
    rightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    cancelBtn: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    cancelText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '600',
    },
    publishBtn: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 6,
      backgroundColor: colors.forest,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 120,
    },
    publishBtnDisabled: {
      backgroundColor: colors.line,
    },
    publishBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    btnDisabled: {
      opacity: 0.5,
    },
    aiDraftBanner: {
      marginTop: 6,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.forest,
      backgroundColor: colors.note,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
    },
    aiDraftInfo: {
      flex: 1,
      minWidth: 200,
      gap: 2,
    },
    aiDraftTitle: {
      color: colors.forest,
      fontSize: 12,
      fontWeight: '800',
    },
    aiDraftSub: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
    },
    aiDraftBtn: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 6,
      backgroundColor: colors.forest,
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiDraftBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },
  });
}

