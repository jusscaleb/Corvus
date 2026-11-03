import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useToast } from '../context/ToastContext';

const DESKS = ['General News', 'Investigative', 'Politics', 'Business & Economy', 'Community / Local'];

export default function SubmitLead({ onSubmitLead }) {
    const { showToast } = useToast();

    const [headline, setHeadline] = useState('');
    const [details, setDetails] = useState('');
    const [location, setLocation] = useState('');
    const [category, setCategory] = useState('General News');
    const [showDeskDropdown, setShowDeskDropdown] = useState(false);
    const [verification, setVerification] = useState({ eyewitness: false, evidence: false });
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [contactInfo, setContactInfo] = useState('');

    const handleSubmit = () => {
        if (!headline.trim() || !details.trim()) {
            showToast({ message: 'Please fill out both the headline and main story details.', type: 'error' });
            return;
        }

        const newSubmission = {
            id: Date.now(),
            headline,
            details,
            location: location.trim() ? location : 'Unspecified',
            category,
            verification,
            isAnonymous,
            contactInfo: isAnonymous ? 'Anonymous' : (contactInfo || 'Not Provided'),
            submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        onSubmitLead(newSubmission);

        // Reset Form
        setHeadline('');
        setDetails('');
        setLocation('');
        setCategory('General News');
        setVerification({ eyewitness: false, evidence: false });
        setIsAnonymous(false);
        setContactInfo('');

        showToast({ message: 'Lead successfully submitted to the editorial team.', type: 'success' });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.pageTitle}>Share Your Story</Text>
            <Text style={styles.pageSubtitle}>Submit confidential leads directly to the editorial team.</Text>

            <View style={styles.divider} />

            {/* Step 1: Headline */}
            <View style={styles.fieldSection}>
                <Text style={styles.stepTitle}>1. Headline / Summary *</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="Briefly state what happened..."
                    placeholderTextColor="#999"
                    value={headline}
                    onChangeText={setHeadline}
                />
            </View>

            {/* Step 2: Main Story Details */}
            <View style={styles.fieldSection}>
                <Text style={styles.stepTitle}>2. Story Details *</Text>
                <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Provide complete details, timeline, and key facts..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    value={details}
                    onChangeText={setDetails}
                />
            </View>

            {/* Step 3: Location Field */}
            <View style={styles.fieldSection}>
                <Text style={styles.stepTitle}>3. Location / Origin of Story</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="City, District, or Specific Location (e.g., Bulawayo CBD)"
                    placeholderTextColor="#999"
                    value={location}
                    onChangeText={setLocation}
                />
            </View>

            {/* Step 4: Category Desk Selection */}
            <View style={[styles.fieldSection, { zIndex: 10 }]}>
                <Text style={styles.stepTitle}>4. Category Desk</Text>
                <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowDeskDropdown(!showDeskDropdown)}
                >
                    <Text style={styles.dropdownText}>{category}</Text>
                    <Text style={styles.arrowText}>▼</Text>
                </TouchableOpacity>

                {showDeskDropdown && (
                    <View style={styles.dropdownMenu}>
                        {DESKS.map((desk) => (
                            <TouchableOpacity
                                key={desk}
                                style={styles.dropdownItem}
                                onPress={() => {
                                    setCategory(desk);
                                    setShowDeskDropdown(false);
                                }}
                            >
                                <Text style={styles.dropdownItemText}>{desk}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Step 5: Verification & Supporting Claims */}
            <View style={styles.fieldSection}>
                <Text style={styles.stepTitle}>5. Verification Check</Text>
                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setVerification(p => ({ ...p, eyewitness: !p.eyewitness }))}
                >
                    <View style={[styles.checkbox, verification.eyewitness && styles.checkboxChecked]} />
                    <Text style={styles.checkboxLabel}>I am a direct eyewitness to this event</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setVerification(p => ({ ...p, evidence: !p.evidence }))}
                >
                    <View style={[styles.checkbox, verification.evidence && styles.checkboxChecked]} />
                    <Text style={styles.checkboxLabel}>I have documents, photos, or recordings</Text>
                </TouchableOpacity>
            </View>

            {/* Step 6: Identity Options */}
            <View style={styles.fieldSection}>
                <Text style={styles.stepTitle}>6. Identity & Contact</Text>
                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setIsAnonymous(!isAnonymous)}
                >
                    <View style={[styles.checkbox, isAnonymous && styles.checkboxChecked]} />
                    <Text style={styles.checkboxLabel}>Submit anonymously</Text>
                </TouchableOpacity>

                {!isAnonymous && (
                    <TextInput
                        style={[styles.textInput, { marginTop: 8 }]}
                        placeholder="Your Email or Phone Number (Confidential)"
                        placeholderTextColor="#999"
                        value={contactInfo}
                        onChangeText={setContactInfo}
                    />
                )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Submit Confidential Lead</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f6f0' },
    contentContainer: { padding: 16, paddingBottom: 40 },
    pageTitle: { fontFamily: 'serif', fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
    pageSubtitle: { fontSize: 13, color: '#666', fontStyle: 'italic', marginTop: 2 },
    divider: { height: 1, backgroundColor: '#ccc', marginVertical: 14 },
    fieldSection: { marginBottom: 18, position: 'relative' },
    stepTitle: { fontFamily: 'serif', fontSize: 14, fontWeight: 'bold', color: '#2c2a29', marginBottom: 6 },
    textInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#222' },
    textArea: { height: 100 },
    dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10 },
    dropdownText: { fontSize: 14, color: '#2c2a29' },
    arrowText: { fontSize: 10, color: '#666' },
    dropdownMenu: { position: 'absolute', top: 62, left: 0, right: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 4, elevation: 4 },
    dropdownItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    dropdownItemText: { fontSize: 13, color: '#333' },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
    checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: '#666', borderRadius: 3, marginRight: 10, backgroundColor: '#fff' },
    checkboxChecked: { backgroundColor: '#8b0000', borderColor: '#8b0000' },
    checkboxLabel: { fontSize: 13, color: '#333' },
    submitButton: { backgroundColor: '#8b0000', paddingVertical: 12, borderRadius: 4, alignItems: 'center', marginTop: 10 },
    submitButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 }
});
