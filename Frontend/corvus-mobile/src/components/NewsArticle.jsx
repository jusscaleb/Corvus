import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const CATEGORIES = ['All', 'Politics', 'Investigation', 'Economy', 'Culture', 'Technology', 'Environment'];

const INITIAL_ARTICLES = [
    {
        id: 1,
        title: 'Investigation: Water Management Infrastructure & City Supplies',
        category: 'Investigation',
        author: 'Editorial Board',
        date: 'Nov 3, 2026',
        readTime: '6 min read',
        excerpt: 'An in-depth analysis of municipal water distribution channels, detailing citizen reports and local government updates across urban districts.',
    },
    {
        id: 2,
        title: 'Regional Agricultural Tech Innovation Summit Announced',
        category: 'Technology',
        author: 'Tech Desk',
        date: 'Nov 2, 2026',
        readTime: '4 min read',
        excerpt: 'New mobile platforms and AI tools are helping local smallholder farmers match market prices and improve crop yield tracking in real time.',
    },
    {
        id: 3,
        title: 'Economic Outlook: Local Retail Trends & Market Shifts',
        category: 'Economy',
        author: 'Finance Bureau',
        date: 'Nov 1, 2026',
        readTime: '5 min read',
        excerpt: 'Retail sector reports highlight shifting consumer spending patterns across major commercial hubs following recent currency adjustments.',
    }
];

export default function NewsArticles({ selectedLang, setSelectedLang }) {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [savedArticles, setSavedArticles] = useState([]);

    const languages = [
        { code: 'EN', name: 'English' },
        { code: 'SN', name: 'ChiShona' },
        { code: 'ND', name: 'isiNdebele' }
    ];

    const filteredArticles = selectedCategory === 'All'
        ? INITIAL_ARTICLES
        : INITIAL_ARTICLES.filter(a => a.category === selectedCategory);

    const toggleSave = (id) => {
        setSavedArticles(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Top Header & Branding */}
            <View style={styles.headerRow}>
                <View>
                    <Text style={styles.brandTitle}>CORVUS</Text>
                    <Text style={styles.brandSubtitle}>Editorial Collaboration Portal</Text>
                </View>

                {/* Language Selector Button */}
                <View style={styles.dropdownWrapper}>
                    <TouchableOpacity
                        style={styles.langButton}
                        onPress={() => setShowLangDropdown(!showLangDropdown)}
                    >
                        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2c2a29" strokeWidth="2">
                            <Path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </Svg>
                        <Text style={styles.langText}>{selectedLang}</Text>
                    </TouchableOpacity>

                    {showLangDropdown && (
                        <View style={styles.langMenu}>
                            {languages.map((lang) => (
                                <TouchableOpacity
                                    key={lang.code}
                                    style={styles.langMenuItem}
                                    onPress={() => {
                                        setSelectedLang(lang.code);
                                        setShowLangDropdown(false);
                                    }}
                                >
                                    <Text style={[styles.langMenuItemText, selectedLang === lang.code && styles.boldText]}>
                                        {lang.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.divider} />

            {/* Category Filter Dropdown */}
            <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>Category:</Text>
                <View style={styles.dropdownWrapper}>
                    <TouchableOpacity
                        style={styles.categoryDropdownButton}
                        onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    >
                        <Text style={styles.categoryDropdownText}>{selectedCategory}</Text>
                        <Text style={styles.arrowText}>▼</Text>
                    </TouchableOpacity>

                    {showCategoryDropdown && (
                        <View style={styles.categoryMenu}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={styles.categoryMenuItem}
                                    onPress={() => {
                                        setSelectedCategory(cat);
                                        setShowCategoryDropdown(false);
                                    }}
                                >
                                    <Text style={[styles.categoryMenuItemText, selectedCategory === cat && styles.boldText]}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </View>

            {/* Articles Stream */}
            <View style={styles.articlesList}>
                {filteredArticles.map((article) => {
                    const isSaved = savedArticles.includes(article.id);
                    return (
                        <View key={article.id} style={styles.articleCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.articleCategory}>{article.category.toUpperCase()}</Text>
                                <TouchableOpacity onPress={() => toggleSave(article.id)}>
                                    <Svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "#8b0000" : "none"} stroke="#8b0000" strokeWidth="2">
                                        <Path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                                    </Svg>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.articleTitle}>{article.title}</Text>

                            <View style={styles.metaRow}>
                                <Text style={styles.metaText}>By {article.author} • {article.date}</Text>
                                <Text style={styles.metaText}>{article.readTime}</Text>
                            </View>

                            <Text style={styles.excerpt}>{article.excerpt}</Text>

                            <TouchableOpacity style={styles.readMoreButton}>
                                <Text style={styles.readMoreText}>Read Full Article →</Text>
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f6f0' },
    contentContainer: { padding: 16 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    brandTitle: { fontFamily: 'serif', fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', letterSpacing: 1.5 },
    brandSubtitle: { fontSize: 12, color: '#666', fontStyle: 'italic', marginTop: 2 },
    langButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#efebe4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: '#dcd6cd' },
    langText: { fontSize: 13, fontWeight: 'bold', marginLeft: 6, color: '#2c2a29' },
    dropdownWrapper: { zIndex: 10 },
    langMenu: { position: 'absolute', right: 0, top: 36, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 4, width: 110, elevation: 5 },
    langMenuItem: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
    langMenuItemText: { fontSize: 13, color: '#333' },
    divider: { height: 2, backgroundColor: '#1a1a1a', marginVertical: 14 },
    filterContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, zIndex: 5 },
    filterLabel: { fontFamily: 'serif', fontSize: 15, fontWeight: '600', color: '#333', marginRight: 10 },
    categoryDropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#efebe4', borderWidth: 1, borderColor: '#ccc', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 6, width: 140 },
    categoryDropdownText: { fontSize: 14, color: '#2c2a29' },
    arrowText: { fontSize: 10, color: '#666' },
    categoryMenu: { position: 'absolute', left: 0, top: 34, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 4, width: 140, elevation: 5 },
    categoryMenuItem: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
    categoryMenuItemText: { fontSize: 13, color: '#333' },
    boldText: { fontWeight: 'bold', color: '#8b0000' },
    articlesList: { gap: 16 },
    articleCard: { backgroundColor: '#fff', padding: 16, borderRadius: 4, borderWidth: 1, borderColor: '#e2dddad6', elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    articleCategory: { fontSize: 11, fontWeight: 'bold', color: '#8b0000', letterSpacing: 0.8 },
    articleTitle: { fontFamily: 'serif', fontSize: 18, fontWeight: 'bold', color: '#111', lineHeight: 24, marginBottom: 6 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    metaText: { fontSize: 11, color: '#777' },
    excerpt: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 12 },
    readMoreButton: { alignSelf: 'flex-start' },
    readMoreText: { fontSize: 13, fontWeight: '600', color: '#8b0000' }
});