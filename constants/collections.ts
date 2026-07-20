import { CollectionCategory } from '@/types/event';
import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export const collectionCategories: {
  value: CollectionCategory;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
  background: string;
}[] = [
  { value: 'entry', label: '参加費', icon: 'people-outline', color: '#285943', background: '#DDEBE3' },
  { value: 'food', label: '食事代', icon: 'restaurant-outline', color: '#C75F3A', background: '#FCE5DC' },
  { value: 'stay', label: '宿泊費', icon: 'bed-outline', color: '#53698F', background: '#DFE4F2' },
  { value: 'transport', label: '交通費', icon: 'car-outline', color: '#8B6B21', background: '#F7EECF' },
  { value: 'ticket', label: 'チケット', icon: 'ticket-outline', color: '#76609A', background: '#EAE2F4' },
  { value: 'other', label: 'その他', icon: 'receipt-outline', color: '#68736C', background: '#E8EAE8' },
];

export function getCollectionCategory(category: CollectionCategory) {
  return collectionCategories.find((item) => item.value === category) ?? collectionCategories[5];
}
