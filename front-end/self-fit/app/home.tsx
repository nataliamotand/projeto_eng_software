import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';

export default function Home() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} accessible accessibilityLabel="home-button">
          <Ionicons name="home" size={28} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} accessible accessibilityLabel="search-button">
          <MaterialIcons name="search" size={28} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} accessible accessibilityLabel="user-button">
          <FontAwesome name="user" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Home</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    marginBottom: 20,
  },
  iconButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
});
