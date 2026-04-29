import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from './theme';

export default function Header({ title, right }: { title?: string; right?: React.ReactNode }) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft}>
        <Ionicons name="arrow-back" size={24} color={colors.white} />
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.headerRight}>{right || null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#070707',
  },
  headerLeft: { width: 40 },
  headerRight: { width: 40, alignItems: 'flex-end' },
  title: { color: colors.white, fontWeight: '700', fontSize: 18 },
});
