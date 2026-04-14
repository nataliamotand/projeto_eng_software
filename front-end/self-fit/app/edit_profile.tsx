import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { colors } from '../src/components/ui/theme';
import api from '../src/services/api';

const { width } = Dimensions.get('window');

export default function EditProfile() {
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<'STUDENT' | 'TEACHER' | null>(null);
  const [name, setName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | number | null>(null);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [objectives, setObjectives] = useState('Quero ganhar força e melhorar a resistência cardiovascular.');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/usuarios/me');
        if (cancelled) return;
        setUserProfile(res.data.tipo_perfil === 'TEACHER' ? 'TEACHER' : 'STUDENT');
        if (res.data.nome) setName(res.data.nome);
      } catch {
        /* mantém defaults locais */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

   const showObjectives = userProfile === 'STUDENT';

  async function takePhoto() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Permissão para usar a câmera é necessária');
        return;
      }
      const result: any = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      const canceled = result.cancelled === true || result.canceled === true;
      const uri = result.uri ?? result.assets?.[0]?.uri;
      if (!canceled && uri) setAvatarUri(uri);
    } catch (e) {
      console.error('takePhoto error', e);
    }
  }

  async function pickFromGallery() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permissão para acessar a galeria é necessária');
        return;
      }
      const result: any = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      const canceled = result.cancelled === true || result.canceled === true;
      const uri = result.uri ?? result.assets?.[0]?.uri;
      if (!canceled && uri) setAvatarUri(uri);
    } catch (e) {
      console.error('pickFromGallery error', e);
    }
  }

  function removePhoto() {
    setAvatarUri(null);
  }

  function handleSave() {
    // TODO: persist profile changes
    console.log('Save', { name, avatarUri, objectives: showObjectives ? objectives : undefined });
    router.back();
  }

  

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Editar Perfil</Text>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Salvar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                typeof avatarUri === 'number'
                  ? avatarUri
                  : avatarUri
                  ? { uri: String(avatarUri) }
                  : require('../assets/images/logo.png')
              }
              style={styles.avatarLarge}
            />
            <TouchableOpacity style={styles.avatarEdit} onPress={() => { setAvatarPickerVisible(true); }}>
              <MaterialIcons name="photo-camera" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput value={name} onChangeText={setName} style={styles.textInput} placeholderTextColor={colors.grayMid} />
        </View>

        {showObjectives && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Meus Objetivos</Text>
            <TextInput
              value={objectives}
              onChangeText={setObjectives}
              style={[styles.textInput, styles.multiInput]}
              placeholderTextColor={colors.grayMid}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Medidas movidas para /measures */}
        <Modal visible={avatarPickerVisible} transparent animationType="fade" onRequestClose={() => setAvatarPickerVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setAvatarPickerVisible(false)}>
            <View style={styles.modalContentCentered}>
              <TouchableOpacity style={[styles.modalOptionButton, { marginBottom: 8 }]} onPress={async () => { await takePhoto(); setAvatarPickerVisible(false); }}>
                <Text style={styles.modalOptionText}>Tirar foto</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalOptionButton, { marginBottom: 8 }]} onPress={async () => { await pickFromGallery(); setAvatarPickerVisible(false); }}>
                <Text style={styles.modalOptionText}>Escolher da galeria</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalOptionButton} onPress={() => { removePhoto(); setAvatarPickerVisible(false); }}>
                <Text style={[styles.modalOptionText, { color: colors.red }]}>Remover foto</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  headerLeft: { padding: 6 },
  headerTitle: { color: colors.white, fontWeight: '700', fontSize: 16 },
  saveButton: { backgroundColor: colors.red, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  saveText: { color: colors.white, fontWeight: '700' },

  contentContainer: { padding: 16, paddingBottom: 200 },
  avatarWrap: { alignItems: 'center', marginBottom: 12 },
  avatarContainer: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarLarge: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#222' },
  avatarEdit: { position: 'absolute', right: 6, bottom: 6, backgroundColor: colors.red, padding: 8, borderRadius: 18 },

  fieldGroup: { marginTop: 12 },
  label: { color: colors.grayLight, marginBottom: 8 },
  textInput: { backgroundColor: colors.inputBg ?? '#111', color: colors.white, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  multiInput: { minHeight: 80 },

  sectionTitle: { color: colors.white, fontWeight: '700', fontSize: 16 },
  rowInputs: { flexDirection: 'column', marginTop: 8 },
  colInputRow: { width: '100%', marginBottom: 8 },
  inputLabel: { color: colors.grayLight, marginBottom: 6 },
  numericInput: { backgroundColor: colors.inputBg, color: colors.white, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },

  registerButton: { marginTop: 12, backgroundColor: colors.red, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  registerText: { color: colors.white, fontWeight: '700' },

  metricTabs: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
  metricTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#0A0A0A', marginRight: 8 },
  metricTabActive: { backgroundColor: '#1F1F1F', borderWidth: 1, borderColor: colors.red },
  metricTabText: { color: colors.white, fontWeight: '700' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContentCentered: { backgroundColor: '#0A0A0A', padding: 20, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderColor: '#111', borderWidth: 1, alignItems: 'stretch', width: '100%' },
  modalOptionButton: { backgroundColor: '#111', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 8, width: '100%', alignItems: 'center' },
  modalOptionText: { color: colors.white, fontSize: 15, fontWeight: '700', textAlign: 'center' },
});
