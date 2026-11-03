import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function Posts({ submissions }) {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.pageTitle}>Posts</Text>
            <Text style={styles.pageSubtitle}>The stories you shared..</Text>

            <View style={styles.divider} />

            {submissions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No stories shared yet.</Text>
                    <Text style={styles.emptySubtext}>Leads submitted via "Submit a lead" will appear here.</Text>
                </View>
            ) : (
                <View style={styles.postsList}>
                    {submissions.map((post) => (
                        <View key={post.id} style={styles.postCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.categoryBadge}>{post.category.toUpperCase()}</Text>
                                <Text style={styles.timeText}>{post.submittedAt}</Text>
                            </View>

                            <Text style={styles.postTitle}>{post.headline}</Text>

                            {post.location !== 'Unspecified' && (
                                <Text style={styles.locationTag}>📍 Origin: {post.location}</Text>
                            )}

                            <Text style={styles.postDetails}>{post.details}</Text>

                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Source:</Text>
                                <Text style={styles.metaVal}>{post.contactInfo}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f6f0' },
    contentContainer: { padding: 16 },
    pageTitle: { fontFamily: 'serif', fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
    pageSubtitle: { fontSize: 13, color: '#666', fontStyle: 'italic', marginTop: 2 },
    divider: { height: 1, backgroundColor: '#ccc', marginVertical: 14 },
    emptyContainer: { paddingVertical: 40, alignItems: 'center' },
    emptyText: { fontFamily: 'serif', fontSize: 16, color: '#555', fontWeight: 'bold' },
    emptySubtext: { fontSize: 12, color: '#888', marginTop: 4 },
    postsList: { gap: 14 },
    postCard: { backgroundColor: '#fff', padding: 14, borderRadius: 4, borderWidth: 1, borderColor: '#e2ddda' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    categoryBadge: { fontSize: 10, fontWeight: 'bold', color: '#8b0000', letterSpacing: 0.5 },
    timeText: { fontSize: 11, color: '#888' },
    postTitle: { fontFamily: 'serif', fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 4 },
    locationTag: { fontSize: 12, color: '#555', fontStyle: 'italic', marginBottom: 8 },
    postDetails: { fontSize: 13, color: '#444', lineHeight: 18, marginBottom: 10 },
    metaRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0ece1', paddingTop: 6 },
    metaLabel: { fontSize: 11, fontWeight: 'bold', color: '#666', marginRight: 4 },
    metaVal: { fontSize: 11, color: '#333' }
});