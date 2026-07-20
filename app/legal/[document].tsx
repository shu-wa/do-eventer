import { legalDocuments, LegalDocumentKey } from '@/constants/legal';
import { palette } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LegalDocumentScreen() {
  const { document } = useLocalSearchParams<{ document: string }>();
  const key: LegalDocumentKey = document === 'privacy' || document === 'community' ? document : 'terms';
  const content = legalDocuments[key];
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}><View style={styles.icon}><Ionicons name="document-text" size={26} color={palette.surface} /></View><Text style={styles.title}>{content.title}</Text><Text style={styles.summary}>{content.summary}</Text><Text style={styles.version}>バージョン {content.version}</Text></View>
        <View style={styles.draft}><Ionicons name="construct-outline" size={18} color="#8C6717" /><Text style={styles.draftText}>公開前の法務確認用ドラフトです。運営者情報と利用するサーバーを確定後、専門家の確認が必要です。</Text></View>
        {content.sections.map((section) => <View key={section.title} style={styles.section}><Text style={styles.heading}>{section.title}</Text><Text style={styles.body}>{section.body}</Text></View>)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.canvas }, content: { padding: 20, paddingBottom: 40 },
  hero: { borderRadius: 24, backgroundColor: palette.primary, padding: 22, marginBottom: 14 }, icon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 15 }, title: { color: palette.surface, fontSize: 25, fontWeight: '900' }, summary: { color: '#D4E4DB', fontSize: 12, lineHeight: 19, marginTop: 7 }, version: { color: '#AFC8BA', fontSize: 9, marginTop: 12 },
  draft: { flexDirection: 'row', borderRadius: 16, backgroundColor: '#FAEECF', padding: 13, marginBottom: 10 }, draftText: { flex: 1, color: '#735718', fontSize: 10, lineHeight: 16, marginLeft: 8 },
  section: { borderRadius: 20, backgroundColor: palette.surface, padding: 17, marginTop: 10 }, heading: { color: palette.ink, fontSize: 15, fontWeight: '900', marginBottom: 8 }, body: { color: palette.muted, fontSize: 12, lineHeight: 21 },
});
