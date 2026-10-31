import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';

export default function App() {
  const router = useRouter();
  const [language, setLanguage] = useState('Eng');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const languages = [
    { label: 'English (Eng)', value: 'Eng' },
    { label: 'isiNdebele (Nde)', value: 'Nde' },
    { label: 'Shona (Sna)', value: 'Sna' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=100&q=80' }} 
              style={styles.logoIcon} 
            />
            <Text style={styles.logoText}>Corvus</Text>
          </View>

          <View style={styles.navRight}>
            {/* Language Dropdown */}
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity 
                style={styles.langButton} 
                onPress={() => setDropdownOpen(!dropdownOpen)}
              >
                <Text style={styles.langButtonText}>🌐 {language} ▼</Text>
              </TouchableOpacity>

              {dropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {languages.map((item) => (
                    <TouchableOpacity 
                      key={item.value} 
                      style={styles.dropdownItem}
                      onPress={() => {
                        setLanguage(item.value);
                        setDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity>
              <Text style={styles.navLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Accent Line */}
        <View style={styles.blueBorderLine} />

        {/* Main Content Area */}
        <View style={styles.mainSection}>
          
          {/* Left Column: Text & CTA */}
          <View style={styles.leftColumn}>
            <View style={styles.badgeRow}>
              <View style={styles.redDash} />
              <Text style={styles.badgeText}>YOU MADE THE RIGHT CHOICE!</Text>
            </View>

            <Text style={styles.heroTitle}>
              Empowering{'\n'}reporters with{'\n'}clarity.
            </Text>
            <View style={styles.titleUnderline} />

            <Text style={styles.heroSubtitle}>
              Analyze facts, collaborate on stories, and bring your reporting into focus.
            </Text>

            <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/signup')}>
              <Text style={styles.ctaText}>Get Started   →</Text>
            </TouchableOpacity>
          </View>

          {/* Right Column: Editorial Collage */}
          <View style={styles.rightColumn}>
            
            {/* Top Newspaper Clipping ("The Story") */}
            <View style={styles.newspaperCard}>
              <View style={styles.tapeTop} />
              <View style={styles.newspaperHeaderRow}>
                <Text style={styles.newspaperTitle}>THE STORY</Text>
                <Text style={styles.newspaperFieldNotes}>FIELD NOTES</Text>
              </View>
              <Text style={styles.newspaperBody}>
                Look closer.{'\n'}Ask questions.
              </Text>
            </View>

            {/* Purple Tape Accent */}
            <View style={styles.purpleTape} />

            {/* Polaroid Photo Frame */}
            <View style={styles.polaroidCard}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&q=80' }} 
                style={styles.polaroidImage}
              />
              <Text style={styles.polaroidCaption}>A CLOSER LOOK AT THE EVERYDAY.</Text>
            </View>

            {/* Bottom Yellow Sticky Note */}
            <View style={styles.stickyNote}>
              <Text style={styles.stickyNoteSubtitle}>NOTE TO SELF</Text>
              <Text style={styles.stickyNoteText}>Find the story beneath the noise.</Text>
            </View>

            {/* Hand-written tags */}
            <Text style={styles.handwrittenTagTop}>#journalism</Text>
            <Text style={styles.handwrittenTagBottom}>#breaking news</Text>
          </View>

        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.footerSquare} />
            <Text style={styles.footerQuote}>For the stories worth telling.</Text>
          </View>
          <View style={styles.footerTags}>
            <Text style={styles.footerTag}>#stories</Text>
            <Text style={styles.footerTag}>#trending</Text>
            <Text style={styles.footerTag}>#gossip</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f4ed',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#f7f4ed',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 28,
    height: 28,
    marginRight: 8,
    tintColor: '#1a1a1a',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'serif',
    color: '#1a1a1a',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  dropdownWrapper: {
    position: 'relative',
    marginRight: 24,
  },
  langButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  langButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 30,
    left: 0,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0ded6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    width: 140,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0ede6',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#333',
  },
  navLink: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
  },
  blueBorderLine: {
    height: 3,
    backgroundColor: '#2096ff',
    width: '100%',
  },
  mainSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 64,
    paddingVertical: 60,
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1.1,
    paddingRight: 40,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  redDash: {
    width: 20,
    height: 2,
    backgroundColor: '#c84b31',
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#c84b31',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 54,
    fontFamily: 'serif',
    fontWeight: '400',
    color: '#1a1a1a',
    lineHeight: 60,
  },
  titleUnderline: {
    width: 160,
    height: 3,
    backgroundColor: '#c84b31',
    marginTop: 12,
    marginBottom: 24,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#555555',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 420,
  },
  ctaButton: {
    backgroundColor: '#c84b31',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  rightColumn: {
    flex: 1.2,
    position: 'relative',
    height: 480,
  },
  newspaperCard: {
    position: 'absolute',
    top: 0,
    right: 40,
    width: 280,
    backgroundColor: '#ffffff',
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e0d5',
    transform: [{ rotate: '3deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 2,
  },
  tapeTop: {
    position: 'absolute',
    top: -10,
    right: 80,
    width: 50,
    height: 18,
    backgroundColor: '#e3dcce',
    opacity: 0.8,
  },
  newspaperHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    paddingBottom: 6,
    marginBottom: 12,
  },
  newspaperTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'serif',
    letterSpacing: 1,
  },
  newspaperFieldNotes: {
    fontSize: 9,
    color: '#777',
    letterSpacing: 0.5,
  },
  newspaperBody: {
    fontSize: 18,
    fontFamily: 'serif',
    color: '#1a1a1a',
    lineHeight: 22,
  },
  purpleTape: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 70,
    height: 24,
    backgroundColor: '#d2c5e5',
    transform: [{ rotate: '-12deg' }],
    zIndex: 4,
  },
  polaroidCard: {
    position: 'absolute',
    top: 90,
    left: 40,
    width: 320,
    backgroundColor: '#ffffff',
    padding: 12,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e0d5',
    transform: [{ rotate: '-4deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 3,
  },
  polaroidImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
    marginBottom: 10,
  },
  polaroidCaption: {
    fontSize: 9,
    letterSpacing: 1,
    color: '#666',
    fontFamily: 'monospace',
  },
  stickyNote: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 200,
    backgroundColor: '#eae5d5',
    padding: 16,
    transform: [{ rotate: '4deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 4,
  },
  stickyNoteSubtitle: {
    fontSize: 8,
    color: '#888',
    letterSpacing: 1,
    marginBottom: 4,
  },
  stickyNoteText: {
    fontSize: 14,
    fontFamily: 'serif',
    color: '#1a1a1a',
    fontStyle: 'italic',
  },
  handwrittenTagTop: {
    position: 'absolute',
    top: 10,
    right: 0,
    fontSize: 16,
    color: '#c84b31',
    fontStyle: 'italic',
    transform: [{ rotate: '6deg' }],
  },
  handwrittenTagBottom: {
    position: 'absolute',
    bottom: 0,
    left: 80,
    fontSize: 16,
    color: '#c84b31',
    fontStyle: 'italic',
    transform: [{ rotate: '-4deg' }],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 64,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0ded6',
    marginTop: 40,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerSquare: {
    width: 8,
    height: 8,
    backgroundColor: '#c84b31',
    marginRight: 10,
  },
  footerQuote: {
    fontSize: 14,
    color: '#444',
    fontFamily: 'serif',
  },
  footerTags: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerTag: {
    fontSize: 14,
    color: '#777',
    marginLeft: 24,
    fontStyle: 'italic',
  },
});