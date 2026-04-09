import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const colors = {
  background: '#000000',
  red: '#CC0000',
  redBright: '#FF0000',
  darkNav: '#1A1A1A',
  lightRed: '#E54F4F',
  white: '#FFFFFF',
  gray: '#BDBDBD',
};

function Header() {
  const router = require('expo-router').useRouter();

  return (
    <View style={styles.header}>
      {/* decorative lighter curved detail top-right */}
      <View style={styles.headerDetail} pointerEvents="none" />

      <View style={styles.headerLeft}>
        {/* TODO: replace with navigation/avatar image if needed */}
        <View style={styles.avatar}>
          {/* TODO: replace require with the app avatar image if different */}
          <Image source={require('../assets/images/logo.png')} style={styles.avatarImage} resizeMode="contain" />
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>Gabrielli Valelia</Text>
          <Text style={styles.userHandle}>@valeliagabi</Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconTouch} onPress={() => { router.push('/add_friends'); }}>
          <FontAwesome name="user-plus" size={20} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconTouch} onPress={() => { router.push('/notifications'); }}>
          <Ionicons name="notifications-outline" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Content() {
  return <View style={styles.content} />;
}

function BottomNav() {
  const router = useRouter();

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          router.push('/home');
        }}
      >
        <FontAwesome name="home" size={24} color={colors.red} />
        <View style={styles.activeIndicator} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          router.push('/routines_and_workouts');
        }}
      >
        <MaterialIcons name="fitness-center" size={26} color={colors.gray} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          router.push('/clients');
        }}
      >
        <MaterialCommunityIcons name="account-group" size={24} color={colors.gray} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          router.push('/profile');
        }}
      >
        <FontAwesome name="user" size={24} color={colors.gray} />
      </TouchableOpacity>
    </View>
  );
}

export default function Home(): JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <Content />
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  header: {
    backgroundColor: colors.red,
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  headerDetail: {
    position: 'absolute',
    right: -width * 0.15,
    top: -40,
    width: width * 0.5,
    height: 120,
    backgroundColor: colors.lightRed,
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
    transform: [{ rotate: '15deg' }],
    opacity: 0.25,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 42,
    height: 26,
  },
  userInfo: {
    flexDirection: 'column',
  },
  userName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  userHandle: {
    color: colors.white,
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconTouch: {
    marginLeft: 14,
    padding: 6,
  },

  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -12,
    // ensure content overlaps header slightly
  },

  bottomNav: {
    backgroundColor: colors.darkNav,
    height: 64,
    paddingVertical: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 64,
  },
  activeIndicator: {
    marginTop: 6,
    width: 28,
    height: 3,
    backgroundColor: colors.red,
    borderRadius: 2,
  },
});

