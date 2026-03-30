import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Portal</Text>
      <View style={styles.buttons}>
        <Link href="/home" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Home</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/login" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/register" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  buttons: {
    width: '80%',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
