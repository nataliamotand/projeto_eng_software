import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from './theme';

type Props = {
  active?: 'home' | 'profile' | 'clients' | 'workouts' | string;
  userProfile?: 'STUDENT' | 'TEACHER';
};

export default function StickyFooter({ active, userProfile }: Props) {
  const router = useRouter();

  return (
    <View style={styles.footerWrap}>
      <View style={styles.bottomNav}>
        
        {/* HOME */}
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/home')}>
          <FontAwesome 
            name="home" 
            size={24} 
            color={active === 'home' ? colors.red : colors.white} 
          />
          {active === 'home' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        {/* SÓ ALUNO VÊ HALTER (TREINOS) */}
        {userProfile === 'STUDENT' && (
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/routines_and_workouts')}>
            <MaterialIcons 
              name="fitness-center" 
              size={26} 
              color={active === 'workouts' ? colors.red : colors.white} 
            />
            {active === 'workouts' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        )}

        {/* SÓ PROFESSOR VÊ GESTÃO (CLIENTES) */}
        {userProfile === 'TEACHER' && (
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/clients')}>
            <MaterialCommunityIcons 
              name="account-group" 
              size={26} 
              color={active === 'clients' ? colors.red : colors.white} 
            />
            {active === 'clients' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        )}

        {/* PERFIL */}
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
          <FontAwesome 
            name="user" 
            size={24} 
            color={active === 'profile' ? colors.red : colors.white} 
          />
          {active === 'profile' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0D0D0D',
    paddingBottom: 10, // Ajuste para iPhones com "notch" embaixo
  },
  bottomNav: { 
    height: 70, 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#222'
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 20,
    height: 3,
    backgroundColor: colors.red,
    borderRadius: 2,
  }
});