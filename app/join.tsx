import { palette } from '@/constants/theme';
import { useEvents } from '@/context/event-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JoinScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const { joinEventByCode } = useEvents();
  const [code, setCode] = useState(params.code?.toUpperCase() ?? '');
  const [loading, setLoading] = useState(false);

  const join = async () => {
    setLoading(true);
    const result = await joinEventByCode(code);
    setLoading(false);
    if (result.error) return Alert.alert('イベントが見つかりません', result.error);
    if (result.pending) return Alert.alert('参加申請を送りました', '主催者が承認するとイベントが表示されます。', [{ text: '閉じる', onPress: () => router.dismiss() }]);
    if (!result.eventId) return;
    router.dismiss();
    setTimeout(() => router.push(`/event/${result.eventId}`), 0);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.illustration}>
          <View style={styles.ring}><View style={styles.ticket}><Ionicons name="ticket" size={37} color={palette.surface} /></View></View>
        </View>
        <Text style={styles.title}>招待コードで参加</Text>
        <Text style={styles.description}>主催者から届いたコードを入力するだけ。{`\n`}友だち登録や連絡先交換は必要ありません。</Text>
        <View style={styles.codeWrap}>
          <TextInput value={code} onChangeText={(value) => setCode(value.toUpperCase())} placeholder="例：HAKONE26" placeholderTextColor="#A4AAA6" autoCapitalize="characters" autoCorrect={false} maxLength={12} style={styles.codeInput} selectionColor={palette.primary} />
          {code.length > 0 && <TouchableOpacity onPress={() => setCode('')}><Ionicons name="close-circle" size={22} color={palette.muted} /></TouchableOpacity>}
        </View>
        <TouchableOpacity style={[styles.joinButton, (!code || loading) && styles.joinButtonDisabled]} onPress={join} disabled={!code || loading} activeOpacity={0.85}><Text style={styles.joinText}>{loading ? '確認中…' : 'イベントを確認する'}</Text><Ionicons name="arrow-forward" size={19} color={palette.surface} /></TouchableOpacity>
        <TouchableOpacity style={styles.scan} onPress={() => router.push('/scan')}><Ionicons name="qr-code-outline" size={18} color={palette.primary} /><Text style={styles.scanText}>QRコードを読み取る</Text></TouchableOpacity>
        <View style={styles.tip}><Ionicons name="information-circle-outline" size={18} color={palette.muted} /><Text style={styles.tipText}>試作版では「HAKONE26」で参加画面を確認できます。</Text></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.canvas },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', paddingBottom: 40 },
  illustration: { alignItems: 'center', marginBottom: 26 },
  ring: { width: 124, height: 124, borderRadius: 62, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  ticket: { width: 74, height: 74, borderRadius: 23, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  title: { textAlign: 'center', fontSize: 25, color: palette.ink, fontWeight: '800', marginBottom: 11 },
  description: { textAlign: 'center', fontSize: 13, lineHeight: 21, color: palette.muted, marginBottom: 29 },
  codeWrap: { height: 64, borderRadius: 19, backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.primary, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  codeInput: { flex: 1, fontSize: 20, color: palette.ink, textAlign: 'center', fontWeight: '800', letterSpacing: 3 },
  joinButton: { height: 57, borderRadius: 18, backgroundColor: palette.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  joinButtonDisabled: { opacity: 0.4 },
  joinText: { color: palette.surface, fontSize: 15, fontWeight: '800', marginRight: 9 },
  scan: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 19 },
  scanText: { color: palette.primary, fontSize: 13, fontWeight: '700', marginLeft: 7 },
  tip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECECE7', borderRadius: 14, padding: 12, marginTop: 8 },
  tipText: { flex: 1, color: palette.muted, fontSize: 10, marginLeft: 8, lineHeight: 15 },
});
