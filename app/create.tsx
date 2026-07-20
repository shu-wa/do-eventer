import { FormField } from '@/components/form-field';
import { KeyboardDismissBar } from '@/components/keyboard-dismiss-bar';
import { formatJapaneseDateRange, NativeDateRangePicker, toDateString } from '@/components/native-date-picker';
import { TimeRangePicker, formatTimeLabel } from '@/components/time-range-picker';
import { palette } from '@/constants/theme';
import { useEvents } from '@/context/event-context';
import { EventTimeMode } from '@/types/event';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateEventScreen() {
  const { addEvent } = useEvents();
  const today = toDateString(new Date());
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState<string | undefined>();
  const [timeMode, setTimeMode] = useState<EventTimeMode>('start');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [initialFee, setInitialFee] = useState('');

  const submit = () => {
    if (!title.trim()) {
      Alert.alert('イベント名を入力してください');
      return;
    }
    if (timeMode === 'range' && endTime && startDate === endDate && endTime <= startTime) {
      Alert.alert('終了時刻を確認してください', '同じ日の場合、終了時刻は開始時刻より後にしてください。');
      return;
    }
    const event = addEvent({ title: title.trim(), startDate, endDate, startTime, endTime, timeMode, location, description, initialFee: Number(initialFee) || 0 });
    router.dismiss();
    setTimeout(() => router.push(`/event/${event.id}`), 0);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} onScrollBeginDrag={Keyboard.dismiss} showsVerticalScrollIndicator={false}>
          <View style={styles.intro}>
            <View style={styles.introIcon}><Ionicons name="sparkles" size={22} color={palette.accent} /></View>
            <View style={styles.introCopy}><Text style={styles.introTitle}>まずは基本情報から</Text><Text style={styles.introText}>あとからいつでも編集できます</Text></View>
          </View>

          <FormField label="イベント名" icon="ticket-outline" placeholder="例：夏のキャンプ 2026" value={title} onChangeText={setTitle} autoFocus />
          <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>開催日</Text><Text style={styles.sectionHint}>端末標準のカレンダーから選択</Text></View><Text style={styles.selection}>{formatJapaneseDateRange(startDate, endDate)}</Text></View>
          <NativeDateRangePicker startDate={startDate} endDate={endDate} onChange={(start, end) => { setStartDate(start); setEndDate(end); }} />
          <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>開催時間</Text><Text style={styles.sectionHint}>開始時刻のみでも登録できます</Text></View><Text style={styles.selection}>{formatTimeLabel(startTime, endTime, timeMode)}</Text></View>
          <TimeRangePicker startTime={startTime} endTime={endTime} timeMode={timeMode} onChange={(value) => { setStartTime(value.startTime); setEndTime(value.endTime); setTimeMode(value.timeMode); }} />
          <View style={styles.fieldGap} />
          <FormField label="場所" icon="location-outline" placeholder="会場名、住所、集合場所など" value={location} onChangeText={setLocation} />
          <FormField label="イベントの説明" hint="任意" icon="document-text-outline" placeholder="持ち物や連絡事項を書きましょう" value={description} onChangeText={setDescription} multiline />
          <FormField label="最初の参加費" hint="他の集金は作成後に追加可能" icon="wallet-outline" placeholder="0" value={initialFee} onChangeText={setInitialFee} keyboardType="number-pad" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} blurOnSubmit />

          <View style={styles.nextInfo}>
            <Text style={styles.nextTitle}>作成後に設定できること</Text>
            <View style={styles.chips}><View style={styles.chip}><Ionicons name="list" size={14} color={palette.primary} /><Text style={styles.chipText}>タイムフロー</Text></View><View style={styles.chip}><Ionicons name="people" size={14} color={palette.primary} /><Text style={styles.chipText}>参加者別料金</Text></View><View style={styles.chip}><Ionicons name="link" size={14} color={palette.primary} /><Text style={styles.chipText}>招待リンク</Text></View></View>
          </View>
        </ScrollView>
        <View style={styles.bottom}>
          <KeyboardDismissBar />
          <TouchableOpacity style={styles.submit} onPress={submit} activeOpacity={0.85}><Text style={styles.submitText}>イベントを作成する</Text><Ionicons name="arrow-forward" size={19} color={palette.surface} /></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.canvas },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 22 },
  intro: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.accentSoft, borderRadius: 19, padding: 14, marginBottom: 24 },
  introIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: palette.surface, justifyContent: 'center', alignItems: 'center' },
  introCopy: { marginLeft: 12 },
  introTitle: { color: palette.ink, fontSize: 14, fontWeight: '800', marginBottom: 3 },
  introText: { color: palette.muted, fontSize: 11 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6, marginBottom: 10 },
  sectionTitle: { color: palette.ink, fontSize: 14, fontWeight: '900' },
  sectionHint: { color: palette.muted, fontSize: 9, marginTop: 3 },
  selection: { maxWidth: '48%', color: palette.primary, fontSize: 10, fontWeight: '800', textAlign: 'right' },
  fieldGap: { height: 20 },
  nextInfo: { borderRadius: 19, borderWidth: 1, borderStyle: 'dashed', borderColor: '#B8C3BC', padding: 15 },
  nextTitle: { color: palette.muted, fontSize: 11, fontWeight: '700', marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.primarySoft, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10 },
  chipText: { color: palette.primary, fontSize: 10, fontWeight: '700', marginLeft: 4 },
  bottom: { backgroundColor: palette.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, padding: 14 },
  submit: { minHeight: 55, borderRadius: 18, backgroundColor: palette.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitText: { color: palette.surface, fontSize: 15, fontWeight: '800', marginRight: 9 },
});
