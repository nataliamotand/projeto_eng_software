import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Footer from './Footer';
import { colors } from './theme';

type Props = {
  active?: 'home' | 'profile' | 'clients' | 'workouts' | string;
  showNav?: boolean;
};

export default function StickyFooter({ active, showNav = true }: Props) {
  const router = useRouter();

  return (
    <View style={styles.footerWrap} pointerEvents="box-none">
      {showNav && (
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/home')}>
            <FontAwesome name="home" size={24} color={active === 'home' ? colors.red : colors.white} />
            {active === 'home' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push(active === 'clients' ? '/clients' : '/routines_and_workouts')}>
            <MaterialIcons name="fitness-center" size={26} color={active === 'workouts' ? colors.red : colors.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/clients')}>
            <MaterialCommunityIcons name="account-group" size={24} color={active === 'clients' ? colors.red : colors.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
            <FontAwesome name="user" size={24} color={active === 'profile' ? colors.red : colors.white} />
            {active === 'profile' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        </View>
      )}

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  footerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    paddingTop: 6,
    paddingBottom: 6,
  },
  bottomNav: {
    backgroundColor: colors.darkGray,
    height: 64,
    paddingVertical: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  navItem: { alignItems: 'center', justifyContent: 'center', width: 72, height: 64 },
  activeIndicator: { marginTop: 6, width: 28, height: 3, backgroundColor: colors.red, borderRadius: 2 },
});
