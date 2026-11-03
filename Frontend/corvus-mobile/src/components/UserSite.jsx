import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import NewsArticles from './NewsArticle';
import SubmitLead from './SubmitLead';
import Posts from './Posts';

const TABS = [
    { key: 'news',   label: 'News Articles' },
    { key: 'submit', label: 'Submit a Lead'  },
    { key: 'posts',  label: 'My Posts'       },
];

export default function UserSite() {
    const { colors, isDark } = useTheme();
    const styles = makeStyles(colors);

    const [activeTab, setActiveTab] = useState('news');
    const [selectedLang, setSelectedLang] = useState('EN');
    const [submissions, setSubmissions] = useState([
        {
            id: 101,
            headline: 'Water Supply Outage in Eastern Suburbs',
            details: 'Residential areas experienced unannounced water cuts lasting over 48 hours. Local representatives cited main pipe repairs.',
            location: 'Bulawayo East',
            category: 'Community / Local',
            contactInfo: 'Anonymous',
            submittedAt: '09:15 AM',
        },
    ]);

    const handleAddSubmission = (newLead) => {
        setSubmissions(prev => [newLead, ...prev]);
        setActiveTab('posts');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.headerBg} />

            {/* Top Navigation Tabs */}
            <View style={styles.navbar}>
                {TABS.map((tab) => {
                    const active = activeTab === tab.key;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.navItem, active && styles.navItemActive]}
                            onPress={() => setActiveTab(tab.key)}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: active }}
                        >
                            <Text style={[styles.navText, active && styles.navTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Dynamic Screen Renderer */}
            <View style={styles.body}>
                {activeTab === 'news' && (
                    <NewsArticles
                        selectedLang={selectedLang}
                        setSelectedLang={setSelectedLang}
                    />
                )}

                {activeTab === 'submit' && (
                    <SubmitLead
                        onSubmitLead={handleAddSubmission}
                    />
                )}

                {activeTab === 'posts' && (
                    <Posts
                        submissions={submissions}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

function makeStyles(colors) {
    return StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: colors.background,
        },
        navbar: {
            flexDirection: 'row',
            backgroundColor: colors.headerBg,
            borderBottomWidth: 1,
            borderBottomColor: colors.line,
        },
        navItem: {
            flex: 1,
            paddingVertical: 13,
            alignItems: 'center',
        },
        navItemActive: {
            borderBottomWidth: 3,
            borderBottomColor: colors.orange,
            backgroundColor: colors.note,
        },
        navText: {
            fontSize: 13,
            color: colors.muted,
            fontWeight: '500',
        },
        navTextActive: {
            color: colors.orange,
            fontWeight: '700',
        },
        body: {
            flex: 1,
        },
    });
}