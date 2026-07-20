import { palette } from '@/constants/theme';
import { useEvents } from '@/context/event-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ParticipantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { findEvent, blockedUsers } = useEvents();
  const event = findEvent(id);
  const [query, setQuery] = useState('');
  const participants = useMemo(() => event?.participants.filter((person) => person.name.toLowerCase().includes(query.trim().toLowerCase())) ?? [], [event, query]);

  if (!event) return <SafeAreaView style={styles.empty}><Text>イベントが見つかりません</Text></SafeAreaView>;
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.summary}><View><Text style={styles.count}>{event.participants.length}<Text style={styles.unit}> 人</Text></Text><Text style={styles.summaryText}>参加予定 · 定員 {event.capacity}人</Text></View><View style={styles.peopleIcon}><Ionicons name="people" size={28} color={palette.surface} /></View></View>
      <View style={styles.search}><Ionicons name="search" size={18} color={palette.muted} /><TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder="参加者を検索" placeholderTextColor="#9AA39E" /></View>
      <FlatList data={participants} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} ItemSeparatorComponent={() => <View style={styles.separator} />} renderItem={({ item }) => (
        <View style={styles.person}><View style={[styles.avatar, { backgroundColor: item.avatarColor }]}><Text style={styles.initials}>{item.initials}</Text></View><View style={styles.copy}><View style={styles.nameRow}><Text style={styles.name}>{item.name}</Text>{item.role === '主催者' && <View style={styles.hostBadge}><Text style={styles.hostText}>主催者</Text></View>}{blockedUsers.some((user) => user.name === item.name) && <View style={styles.blockBadge}><Text style={styles.blockText}>ブロック中</Text></View>}</View><Text style={styles.attendance}>{item.attendance}</Text></View><TouchableOpacity style={styles.more} onPress={() => router.push({ pathname: '/safety/report', params: { eventId: id, targetName: item.name } })}><Ionicons name="ellipsis-horizontal" size={19} color={palette.muted} /></TouchableOpacity></View>
      )} ListEmptyComponent={<View style={styles.noResult}><Ionicons name="person-outline" size={32} color={palette.muted} /><Text style={styles.noResultText}>該当する参加者はいません</Text></View>} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.canvas }, empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summary: { margin: 20, marginBottom: 12, borderRadius: 23, backgroundColor: palette.primary, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, count: { color: palette.surface, fontSize: 29, fontWeight: '900' }, unit: { fontSize: 14 }, summaryText: { color: '#C7DBD0', fontSize: 10, marginTop: 3 }, peopleIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  search: { marginHorizontal: 20, marginBottom: 12, height: 48, borderRadius: 16, backgroundColor: palette.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }, searchInput: { flex: 1, marginLeft: 9, color: palette.ink, fontSize: 13 },
  list: { marginHorizontal: 20, padding: 15, borderRadius: 22, backgroundColor: palette.surface }, person: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }, avatar: { width: 49, height: 49, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, initials: { color: palette.surface, fontSize: 13, fontWeight: '900' }, copy: { flex: 1, marginLeft: 12 }, nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }, name: { color: palette.ink, fontSize: 14, fontWeight: '900' }, hostBadge: { marginLeft: 7, borderRadius: 8, backgroundColor: palette.accentSoft, paddingHorizontal: 7, paddingVertical: 3 }, hostText: { color: palette.accent, fontSize: 8, fontWeight: '900' }, blockBadge: { marginLeft: 6, borderRadius: 8, backgroundColor: '#E5E6E2', paddingHorizontal: 6, paddingVertical: 3 }, blockText: { color: palette.muted, fontSize: 7, fontWeight: '800' }, attendance: { color: palette.muted, fontSize: 10, marginTop: 4 }, more: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.canvas }, separator: { height: StyleSheet.hairlineWidth, backgroundColor: palette.line, marginLeft: 61 }, noResult: { alignItems: 'center', padding: 32 }, noResultText: { color: palette.muted, marginTop: 8, fontSize: 11 },
});
