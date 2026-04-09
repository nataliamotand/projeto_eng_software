import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from './theme';

export default function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.text}>© Self-fit</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center', paddingVertical: 12 },
  text: { color: colors.lightGray, fontSize: 12 },
});
