import { supabase } from '@/lib/supabase';
import { AttendanceChoice, AvailabilityChoice, CollectionItem, EventDateTimeInput, EventItem, EventLocationInput, NewDateCandidateInput, NewScheduleInput } from '@/types/event';

export const isCloudId = (value?: string) => Boolean(value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i));

type CloudProfile = { id: string; display_name: string; avatar_color: string };
type CloudMember = { user_id: string; role: 'host' | 'cohost' | 'member'; status: string; attendance_label?: string; joined_at: string; profile?: CloudProfile };
type CloudSchedule = { id: string; starts_at: string; title: string; note?: string; item_type: 'move' | 'activity' | 'food' | 'stay' };
type CloudShare = { user_id: string; amount: number | string; paid: boolean; paid_at?: string };
type CloudCollection = { id: string; title: string; category: CollectionItem['category']; paid_by_user_id: string; total_amount: number | string; split_method: CollectionItem['splitMethod']; due_date?: string; note?: string; shares?: CloudShare[] };
type CloudMessage = { id: string; author_id: string; body: string; created_at: string; author?: CloudProfile };
type CloudCandidateVote = { user_id: string; choice: AvailabilityChoice };
type CloudDateCandidate = { id: string; candidate_date: string; start_time: string; note?: string; votes?: CloudCandidateVote[] };
type CloudEvent = {
  id: string; owner_id: string; title: string; category: string; tagline?: string; description?: string;
  start_date: string; end_date: string; start_time: string; end_time?: string; time_mode: 'start' | 'range';
  location_name?: string; address?: string; latitude?: number; longitude?: number; capacity: number; status: string;
  cover_color: string; accent_color: string; members?: CloudMember[]; schedule?: CloudSchedule[];
  collections?: CloudCollection[]; messages?: CloudMessage[];
  date_candidates?: CloudDateCandidate[];
};

const dateLabel = (start: string, end: string) => {
  const format = (value: string, year = true) => { const [y, m, d] = value.split('-').map(Number); return `${year ? `${y}年` : ''}${m}月${d}日`; };
  return start === end ? format(start) : `${format(start)} – ${format(end, start.slice(0, 4) !== end.slice(0, 4))}`;
};

export async function fetchCloudEvents(currentUserId: string): Promise<EventItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('events').select(`
    *,
    members:event_members(*, profile:profiles(id, display_name, avatar_color)),
    schedule:schedule_items(*),
    collections(*, shares:collection_shares(*)),
    messages(*, author:profiles(id, display_name, avatar_color)),
    date_candidates(*, votes:date_candidate_votes(*))
  `).order('start_date', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as CloudEvent[]).map((event) => {
    const members = (event.members ?? []).filter((member) => member.status === 'approved');
    const participants = members.map((member) => ({
      id: member.user_id,
      name: member.profile?.display_name ?? 'メンバー',
      initials: (member.profile?.display_name ?? 'ME').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      role: member.role === 'host' ? '主催者' as const : member.role === 'cohost' ? '共同主催者' as const : '参加者' as const,
      avatarColor: member.profile?.avatar_color ?? '#68736C',
      attendance: member.attendance_label ?? '参加',
    }));
    const joinRequests = (event.members ?? []).filter((member) => member.status === 'pending').map((member) => ({
      userId: member.user_id,
      name: member.profile?.display_name ?? '新しいメンバー',
      initials: (member.profile?.display_name ?? 'ME').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      avatarColor: member.profile?.avatar_color ?? '#68736C',
      requestedAt: member.joined_at,
    }));
    const profileById = new Map(participants.map((participant) => [participant.id, participant]));
    return {
      id: event.id,
      title: event.title,
      category: event.category,
      tagline: event.tagline ?? '',
      host: profileById.get(event.owner_id)?.name ?? '主催者',
      startDate: event.start_date,
      endDate: event.end_date,
      dateLabel: dateLabel(event.start_date, event.end_date),
      startTime: event.start_time.slice(0, 5),
      endTime: event.end_time?.slice(0, 5),
      timeMode: event.time_mode,
      timeLabel: event.time_mode === 'range' && event.end_time ? `${event.start_time.slice(0, 5)}–${event.end_time.slice(0, 5)}` : `${event.start_time.slice(0, 5)} 開始`,
      location: event.location_name ?? '場所未設定',
      address: event.address ?? '場所未設定',
      latitude: event.latitude,
      longitude: event.longitude,
      description: event.description ?? '',
      coverColor: event.cover_color,
      accentColor: event.accent_color,
      status: event.status === 'active' ? '開催中' : event.status === 'completed' || event.status === 'cancelled' ? '終了' : '予定',
      inviteCode: '',
      capacity: event.capacity,
      participants,
      joinRequests,
      dateCandidates: (event.date_candidates ?? []).sort((a, b) => `${a.candidate_date}${a.start_time}`.localeCompare(`${b.candidate_date}${b.start_time}`)).map((candidate) => ({
        id: candidate.id,
        date: candidate.candidate_date,
        startTime: candidate.start_time.slice(0, 5),
        note: candidate.note,
        votes: (candidate.votes ?? []).map((vote) => ({ participantId: vote.user_id, choice: vote.choice })),
      })),
      schedule: (event.schedule ?? []).sort((a, b) => a.starts_at.localeCompare(b.starts_at)).map((item) => ({ id: item.id, day: new Date(item.starts_at).toLocaleDateString('ja-JP'), time: new Date(item.starts_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }), title: item.title, note: item.note, type: item.item_type })),
      collections: (event.collections ?? []).map((collection) => ({ id: collection.id, title: collection.title, category: collection.category, paidByParticipantId: collection.paid_by_user_id, totalAmount: Number(collection.total_amount), splitMethod: collection.split_method, dueDate: collection.due_date, note: collection.note, shares: (collection.shares ?? []).map((share) => ({ participantId: share.user_id, amount: Number(share.amount), paid: share.paid, paidAt: share.paid_at ? new Date(share.paid_at).toLocaleDateString('ja-JP') : undefined })) })),
      messages: (event.messages ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at)).map((message) => ({ id: message.id, author: message.author?.display_name ?? 'メンバー', initials: (message.author?.display_name ?? 'ME').slice(0, 2), text: message.body, time: new Date(message.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }), mine: message.author_id === currentUserId, color: message.author?.avatar_color ?? '#68736C' })),
    };
  });
}

export async function createCloudEvent(event: EventItem) {
  if (!supabase || !isCloudId(event.id)) return null;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;
  const { error } = await supabase.from('events').insert({
    id: event.id, owner_id: userId, title: event.title, category: event.category, tagline: event.tagline,
    description: event.description, start_date: event.startDate, end_date: event.endDate, start_time: event.startTime,
    end_time: event.timeMode === 'range' ? event.endTime : null, time_mode: event.timeMode, location_name: event.location,
    address: event.address, latitude: event.latitude, longitude: event.longitude, capacity: event.capacity,
    cover_color: event.coverColor, accent_color: event.accentColor,
  });
  if (error) throw error;
  const { data: inviteCode, error: inviteError } = await supabase.rpc('create_event_invite', { target_event_id: event.id });
  if (inviteError) throw inviteError;
  return inviteCode as string;
}

export async function createCloudInvite(eventId: string) {
  if (!supabase || !isCloudId(eventId)) return null;
  const { data, error } = await supabase.rpc('create_event_invite', { target_event_id: eventId });
  if (error) throw error;
  return data as string;
}

export async function joinCloudEvent(code: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('join_event_by_invite', { raw_token: code });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? { eventId: row.event_id as string, status: row.membership_status as string } : null;
}

export async function syncCloudMessage(eventId: string, messageId: string, body: string) {
  if (!supabase || !isCloudId(eventId)) return;
  const { data } = await supabase.auth.getUser(); if (!data.user) return;
  await supabase.from('messages').insert({ id: messageId, event_id: eventId, author_id: data.user.id, body });
}

export async function syncCloudDateTime(eventId: string, input: EventDateTimeInput) {
  if (!supabase || !isCloudId(eventId)) return;
  await supabase.from('events').update({ start_date: input.startDate, end_date: input.endDate, start_time: input.startTime, end_time: input.timeMode === 'range' ? input.endTime : null, time_mode: input.timeMode }).eq('id', eventId);
}

export async function syncCloudLocation(eventId: string, input: EventLocationInput) {
  if (!supabase || !isCloudId(eventId)) return;
  await supabase.from('events').update({ location_name: input.location, address: input.address, latitude: input.latitude, longitude: input.longitude }).eq('id', eventId);
}

export async function syncCloudSchedule(event: EventItem, scheduleId: string, input: NewScheduleInput) {
  if (!supabase || !isCloudId(event.id)) return;
  const { data } = await supabase.auth.getUser(); if (!data.user) return;
  const scheduleDate = /^\d{4}-\d{2}-\d{2}$/.test(input.day) ? input.day : event.startDate;
  const start = new Date(`${scheduleDate}T${input.time}:00`);
  await supabase.from('schedule_items').insert({ id: scheduleId, event_id: event.id, starts_at: start.toISOString(), title: input.title, note: input.note, item_type: input.type, created_by: data.user.id });
}

export async function syncCloudCollection(eventId: string, collection: CollectionItem) {
  if (!supabase || !isCloudId(eventId) || !isCloudId(collection.id)) return;
  const { data } = await supabase.auth.getUser(); if (!data.user) return;
  const payerId = isCloudId(collection.paidByParticipantId) ? collection.paidByParticipantId : data.user.id;
  const { error } = await supabase.from('collections').insert({ id: collection.id, event_id: eventId, title: collection.title, category: collection.category, paid_by_user_id: payerId, total_amount: collection.totalAmount, currency: 'JPY', split_method: collection.splitMethod, due_date: collection.dueDate, note: collection.note, created_by: data.user.id });
  if (error) throw error;
  const shares = collection.shares
    .map((share) => ({ ...share, cloudUserId: isCloudId(share.participantId) ? share.participantId : share.participantId === 'me' ? data.user!.id : null }))
    .filter((share) => Boolean(share.cloudUserId))
    .map((share) => ({ collection_id: collection.id, user_id: share.cloudUserId!, amount: share.amount, paid: share.paid, paid_at: share.paid ? new Date().toISOString() : null, confirmed_by: share.paid ? data.user!.id : null }));
  if (shares.length) await supabase.from('collection_shares').insert(shares);
}

export async function syncCloudPayment(collectionId: string, participantId: string, paid: boolean) {
  if (!supabase || !isCloudId(collectionId) || !isCloudId(participantId)) return;
  await supabase.rpc('set_collection_share_paid', { target_collection_id: collectionId, target_user_id: participantId, is_paid: paid });
}

export async function syncCloudAttendance(eventId: string, attendance: AttendanceChoice) {
  if (!supabase || !isCloudId(eventId)) return;
  const { error } = await supabase.rpc('set_my_attendance', { target_event_id: eventId, attendance });
  if (error) throw error;
}

export async function reviewCloudJoinRequest(eventId: string, userId: string, decision: 'approved' | 'declined') {
  if (!supabase || !isCloudId(eventId) || !isCloudId(userId)) return;
  const { error } = await supabase.rpc('review_event_join_request', { target_event_id: eventId, target_user_id: userId, decision });
  if (error) throw error;
}

export async function syncCloudDateCandidate(eventId: string, candidateId: string, input: NewDateCandidateInput) {
  if (!supabase || !isCloudId(eventId) || !isCloudId(candidateId)) return;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  const { error } = await supabase.from('date_candidates').insert({
    id: candidateId,
    event_id: eventId,
    candidate_date: input.date,
    start_time: input.startTime,
    note: input.note,
    created_by: data.user.id,
  });
  if (error) throw error;
}

export async function syncCloudAvailabilityVote(candidateId: string, choice: AvailabilityChoice) {
  if (!supabase || !isCloudId(candidateId)) return;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  const { error } = await supabase.from('date_candidate_votes').upsert({
    candidate_id: candidateId,
    user_id: data.user.id,
    choice,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'candidate_id,user_id' });
  if (error) throw error;
}

export async function syncCloudMemberRole(eventId: string, userId: string, role: 'cohost' | 'member') {
  if (!supabase || !isCloudId(eventId) || !isCloudId(userId)) return;
  const { error } = await supabase.rpc('set_event_member_role', {
    target_event_id: eventId,
    target_user_id: userId,
    new_role: role,
  });
  if (error) throw error;
}

export async function confirmCloudDateCandidate(candidateId: string) {
  if (!supabase || !isCloudId(candidateId)) return;
  const { error } = await supabase.rpc('confirm_event_date_candidate', { target_candidate_id: candidateId });
  if (error) throw error;
}
