import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { submitLead } from '../services/api';

const DESKS = [
  'Local News',
  'Technology',
  'Transit',
  'Environment',
  'Education',
  'Investigative Desk',
  'General News',
];

const URGENCY_LEVELS = [
  { label: 'Lead Tip', desc: 'Standard background tip or lead for ongoing reporting' },
  { label: 'Breaking News', desc: 'Time-critical unfolding development requiring immediate review' },
  { label: 'Urgent Investigation', desc: 'High-impact whistleblowing or deep investigative matter' },
];

export default function SubmitLead({ onSubmitLead }) {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const [headline, setHeadline] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Local News');
  const [urgency, setUrgency] = useState('Lead Tip');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [verification, setVerification] = useState({ eyewitness: false, evidence: false });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [contactInfo, setContactInfo] = useState('');

  const [showDeskDropdown, setShowDeskDropdown] = useState(false);
  const [showUrgencyDropdown, setShowUrgencyDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(null);

  // Field validation errors
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!headline.trim()) {
      errs.headline = 'Headline or brief summary is required.';
    }
    if (!details.trim()) {
      errs.details = 'Story details and description of what happened are required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showToast({
        message: 'Please complete all required fields indicated in the form.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmittedSuccess(null);

    try {
      // Assemble payload for backend
      const leadPayload = {
        headline: headline.trim(),
        details: details.trim(),
        desk: category,
        urgency: urgency,
        location: location.trim(),
        contact_info: isAnonymous ? 'Anonymous' : (contactInfo.trim() || 'Confidential (Not specified)'),
        is_anonymous: isAnonymous,
      };

      // Call backend API endpoint /api/project/leads/
      const response = await submitLead(leadPayload);

      const submissionRecord = {
        id: response?.article_id || `lead-${Date.now()}`,
        headline: headline.trim(),
        details: details.trim(),
        location: location.trim() || 'Unspecified Location',
        category,
        urgency,
        verification,
        evidenceNotes: evidenceNotes.trim(),
        isAnonymous,
        contactInfo: isAnonymous ? 'Anonymous' : (contactInfo.trim() || 'Confidential'),
        status: 'Under Review',
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        submittedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };

      if (onSubmitLead) {
        onSubmitLead(submissionRecord);
      }

      setSubmittedSuccess({
        id: submissionRecord.id,
        headline: submissionRecord.headline,
        urgency: submissionRecord.urgency,
      });

      // Reset form fields
      setHeadline('');
      setDetails('');
      setLocation('');
      setEvidenceNotes('');
      setCategory('Local News');
      setUrgency('Lead Tip');
      setVerification({ eyewitness: false, evidence: false });
      setIsAnonymous(false);
      setContactInfo('');
      setErrors({});

      showToast({
        message: 'Your story has been safely submitted to the editorial review desk.',
        type: 'success',
      });
    } catch (err) {
      showToast({
        message: err.message || 'Could not submit story lead. Please verify connection and try again.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = makeStyles(colors, isDark);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header and Title */}
      <View style={styles.headerBlock}>
        <View style={styles.kickerRow}>
          <View style={styles.kickerDash} />
          <Text style={styles.kickerText}>INVESTIGATION & NEWS DESK INTAKE</Text>
        </View>
        <Text style={styles.pageTitle}>Share your story</Text>
        <Text style={styles.pageSubtitle}>
          Provide breaking news or leads for upcoming investigation articles.
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Success Notification Banner */}
      {submittedSuccess && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerTitle}>SUBMISSION RECEIVED & FILED</Text>
          <Text style={styles.successBannerText}>
            "{submittedSuccess.headline}" has entered the newsroom review workflow under priority level [
            {submittedSuccess.urgency}]. Editorial staff will evaluate your dispatch against primary sources.
          </Text>
          <TouchableOpacity
            style={styles.successBannerDismiss}
            onPress={() => setSubmittedSuccess(null)}
          >
            <Text style={styles.successBannerDismissText}>Dismiss Notification ✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Form Card Container */}
      <View style={styles.formCard}>
        {/* 1. Headline / Summary */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>1. Headline / Summary</Text>
            <Text style={styles.requiredMark}>* REQUIRED</Text>
          </View>
          <TextInput
            style={[styles.input, errors.headline && styles.inputError]}
            placeholder="Provide a succinct summary of the report or incident..."
            placeholderTextColor={colors.muted}
            value={headline}
            onChangeText={(text) => {
              setHeadline(text);
              if (errors.headline) setErrors((prev) => ({ ...prev, headline: null }));
            }}
            accessibilityLabel="Headline or summary"
          />
          {errors.headline && <Text style={styles.errorText}>{errors.headline}</Text>}
        </View>

        {/* 2 & 3. Category Desk & Urgency Level (Dual Dropdown Row) */}
        <View style={styles.dualDropdownRow}>
          {/* Category Desk */}
          <View style={[styles.dualColumn, { zIndex: 30 }]}>
            <Text style={styles.fieldLabel}>2. Category Desk</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => {
                  setShowDeskDropdown(!showDeskDropdown);
                  setShowUrgencyDropdown(false);
                }}
                accessibilityRole="combobox"
              >
                <Text style={styles.dropdownTriggerText}>{category}</Text>
                <Text style={styles.dropdownArrow}>{showDeskDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {showDeskDropdown && (
                <View style={styles.dropdownMenu}>
                  {DESKS.map((desk) => (
                    <TouchableOpacity
                      key={desk}
                      style={[
                        styles.dropdownMenuItem,
                        category === desk && styles.dropdownMenuItemActive,
                      ]}
                      onPress={() => {
                        setCategory(desk);
                        setShowDeskDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownMenuItemText,
                          category === desk && styles.dropdownMenuItemTextActive,
                        ]}
                      >
                        {desk}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Urgency Level */}
          <View style={[styles.dualColumn, { zIndex: 25 }]}>
            <Text style={styles.fieldLabel}>3. Urgency Level</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => {
                  setShowUrgencyDropdown(!showUrgencyDropdown);
                  setShowDeskDropdown(false);
                }}
                accessibilityRole="combobox"
              >
                <Text style={styles.dropdownTriggerText}>{urgency}</Text>
                <Text style={styles.dropdownArrow}>{showUrgencyDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {showUrgencyDropdown && (
                <View style={styles.dropdownMenu}>
                  {URGENCY_LEVELS.map((item) => (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.dropdownMenuItem,
                        urgency === item.label && styles.dropdownMenuItemActive,
                      ]}
                      onPress={() => {
                        setUrgency(item.label);
                        setShowUrgencyDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownMenuItemText,
                          urgency === item.label && styles.dropdownMenuItemTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text style={styles.urgencySubtext}>{item.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 4. Story Details / What Happened */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>4. Story Details / What Happened</Text>
            <Text style={styles.requiredMark}>* REQUIRED</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea, errors.details && styles.inputError]}
            placeholder="Detail the timeline, individuals or institutions involved, sequence of events, and known facts..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={details}
            onChangeText={(text) => {
              setDetails(text);
              if (errors.details) setErrors((prev) => ({ ...prev, details: null }));
            }}
            accessibilityLabel="Story details"
          />
          {errors.details && <Text style={styles.errorText}>{errors.details}</Text>}
        </View>

        {/* 5. Origin / Geographic Location */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>5. Location / Origin of Story</Text>
          <TextInput
            style={styles.input}
            placeholder="City, District, Ward, or Specific Venue (e.g. Bulawayo CBD, Harare East)..."
            placeholderTextColor={colors.muted}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* 6. Supporting Evidence & Verification */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>6. Supporting Evidence & Verification</Text>
          
          <TouchableOpacity
            style={styles.checkboxRow}
            activeOpacity={0.8}
            onPress={() => setVerification((p) => ({ ...p, eyewitness: !p.eyewitness }))}
          >
            <View style={[styles.checkbox, verification.eyewitness && styles.checkboxActive]}>
              {verification.eyewitness && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>I am an eyewitness to the events described</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            activeOpacity={0.8}
            onPress={() => setVerification((p) => ({ ...p, evidence: !p.evidence }))}
          >
            <View style={[styles.checkbox, verification.evidence && styles.checkboxActive]}>
              {verification.evidence && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>
              I have supporting documents, logs, photos, or audio recordings
            </Text>
          </TouchableOpacity>

          {verification.evidence && (
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="List available documents, record types, or reference files..."
              placeholderTextColor={colors.muted}
              value={evidenceNotes}
              onChangeText={setEvidenceNotes}
            />
          )}
        </View>

        {/* 7. Identity & Source Protection */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>7. Source Identity & Protection</Text>

          <TouchableOpacity
            style={styles.checkboxRow}
            activeOpacity={0.8}
            onPress={() => setIsAnonymous(!isAnonymous)}
          >
            <View style={[styles.checkbox, isAnonymous && styles.checkboxActive]}>
              {isAnonymous && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>Submit tip anonymously (No contact information stored)</Text>
          </TouchableOpacity>

          {!isAnonymous && (
            <View style={{ marginTop: 8 }}>
              <TextInput
                style={styles.input}
                placeholder="Secure email or phone number for editorial verification (Kept strictly confidential)..."
                placeholderTextColor={colors.muted}
                value={contactInfo}
                onChangeText={setContactInfo}
              />
              <Text style={styles.helperNote}>
                Editor pledge: Your confidential contact is shielded by investigative reporter privilege.
              </Text>
            </View>
          )}
        </View>

        {/* Submission Action */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            accessibilityRole="button"
          >
            {isSubmitting ? (
              <View style={styles.submittingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.submitButtonText}>TRANSMITTING TO DESK...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>SUBMIT TO EDITORIAL DESK</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.submitDisclaimer}>
            By submitting, you affirm that this information is factual to the best of your knowledge.
            Submissions enter editorial review and do not publish automatically.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors, isDark) {
  const paper = colors.paper || '#F7F4ED';
  const cardBg = colors.white || '#FFFFFF';
  const ink = colors.ink || '#1A1A1A';
  const muted = colors.muted || '#6B6860';
  const forest = colors.forest || '#315E4A';
  const forestDark = colors.forestDark || '#244735';
  const borderDark = '#1A1A1A';
  const line = colors.line || '#E0DED6';
  const errorText = colors.errorText || '#991B1B';
  const note = colors.note || '#EAE5D5';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: paper,
    },
    contentContainer: {
      paddingHorizontal: 20,
      paddingVertical: 24,
      maxWidth: 840,
      width: '100%',
      alignSelf: 'center',
    },
    headerBlock: {
      marginBottom: 14,
    },
    kickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    kickerDash: {
      width: 16,
      height: 2,
      backgroundColor: forest,
      marginRight: 6,
    },
    kickerText: {
      fontSize: 11,
      fontWeight: '800',
      color: forest,
      letterSpacing: 1,
    },
    pageTitle: {
      fontFamily: 'serif',
      fontSize: 32,
      fontWeight: '800',
      color: ink,
      lineHeight: 38,
      letterSpacing: -0.3,
    },
    pageSubtitle: {
      fontSize: 14,
      color: muted,
      lineHeight: 20,
      marginTop: 4,
    },
    divider: {
      height: 2,
      backgroundColor: ink,
      marginBottom: 24,
    },

    // Success Notification Banner
    successBanner: {
      backgroundColor: note,
      borderLeftWidth: 4,
      borderLeftColor: forest,
      borderWidth: 1,
      borderColor: borderDark,
      padding: 16,
      marginBottom: 20,
      borderRadius: 2,
    },
    successBannerTitle: {
      fontFamily: 'serif',
      fontSize: 13,
      fontWeight: '800',
      color: forestDark,
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    successBannerText: {
      fontSize: 13,
      color: ink,
      lineHeight: 19,
    },
    successBannerDismiss: {
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    successBannerDismissText: {
      fontSize: 11,
      fontWeight: '700',
      color: muted,
      textDecorationLine: 'underline',
    },

    // Form Card
    formCard: {
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderDark,
      borderRadius: 2,
      padding: 24,
    },
    formGroup: {
      marginBottom: 20,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 6,
    },
    fieldLabel: {
      fontFamily: 'serif',
      fontSize: 14,
      fontWeight: '700',
      color: ink,
      marginBottom: 6,
      letterSpacing: 0.2,
    },
    requiredMark: {
      fontSize: 10,
      fontWeight: '800',
      color: forest,
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderDark,
      borderRadius: 2,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: ink,
    },
    inputError: {
      borderColor: errorText,
      backgroundColor: '#FDF2F2',
    },
    errorText: {
      fontSize: 12,
      color: errorText,
      marginTop: 4,
    },
    textArea: {
      minHeight: 120,
      lineHeight: 20,
    },

    // Dual Dropdowns
    dualDropdownRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginBottom: 20,
    },
    dualColumn: {
      flex: 1,
      minWidth: 240,
    },
    dropdownContainer: {
      position: 'relative',
    },
    dropdownTrigger: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderDark,
      borderRadius: 2,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    dropdownTriggerText: {
      fontSize: 14,
      color: ink,
      fontWeight: '600',
    },
    dropdownArrow: {
      fontSize: 10,
      color: ink,
    },
    dropdownMenu: {
      position: 'absolute',
      top: 44,
      left: 0,
      right: 0,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderDark,
      borderRadius: 2,
      elevation: 6,
      zIndex: 50,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    dropdownMenuItem: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: line,
    },
    dropdownMenuItemActive: {
      backgroundColor: note,
    },
    dropdownMenuItemText: {
      fontSize: 13,
      color: ink,
      fontWeight: '600',
    },
    dropdownMenuItemTextActive: {
      color: forest,
      fontWeight: '800',
    },
    urgencySubtext: {
      fontSize: 11,
      color: muted,
      marginTop: 2,
    },

    // Checkbox items
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 6,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderWidth: 1,
      borderColor: borderDark,
      borderRadius: 2,
      marginRight: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: cardBg,
    },
    checkboxActive: {
      backgroundColor: forest,
      borderColor: forest,
    },
    checkboxCheck: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
      lineHeight: 14,
    },
    checkboxText: {
      fontSize: 13,
      color: ink,
      fontWeight: '500',
    },
    helperNote: {
      fontSize: 11,
      color: muted,
      fontStyle: 'italic',
      marginTop: 4,
    },

    // Submit Action
    submitSection: {
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: line,
      paddingTop: 18,
    },
    submitButton: {
      backgroundColor: forest,
      paddingVertical: 14,
      borderRadius: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitButtonDisabled: {
      backgroundColor: muted,
    },
    submittingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 1,
    },
    submitDisclaimer: {
      fontSize: 11,
      color: muted,
      textAlign: 'center',
      marginTop: 10,
      lineHeight: 16,
    },
  });
}
