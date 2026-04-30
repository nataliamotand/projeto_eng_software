import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import StickyFooter from "../src/components/ui/StickyFooter";
import { colors } from "../src/components/ui/theme";
import api from "../src/services/api";
import { TextInput } from "react-native-gesture-handler";

const { width } = Dimensions.get("window");

// --- COMPONENTE DE HEADER ---
function Header({ user }: { user: any }) {
  const router = useRouter();
  const avatarUri =
    typeof user?.foto_perfil === "string" && user.foto_perfil.trim()
      ? user.foto_perfil
      : null;

  return (
    <View style={styles.header}>
      <View style={styles.headerDetail} pointerEvents="none" />
      <View style={styles.headerLeft}>
        <View style={styles.avatar}>
          <Image
            source={
              avatarUri
                ? { uri: avatarUri }
                : require("../assets/images/logo.png")
            }
            style={styles.avatarImage}
          />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.nome || "Carregando..."}</Text>
          <Text style={styles.userHandle}>
            @{user?.email?.split("@")[0] || "usuario"}
          </Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.iconTouch}
          onPress={() => router.push("/add_friends")}
        >
          <FontAwesome name="user-plus" size={20} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconTouch}
          onPress={() => router.push("/notifications")}
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={colors.white}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RoutinesAndWorkouts() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [routines, setRoutines] = useState<any[]>([]);

  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [alunoProfile, setAlunoProfile] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userRes, routinesRes, alunoRes] = await Promise.all([
        api.get("/usuarios/me"),
        api.get("/alunos/minhas-rotinas"),
        api.get("/alunos/me").catch(() => ({ data: null })),
      ]);
      setUser(userRes.data);
      setRoutines(routinesRes.data);
      setAlunoProfile(alunoRes.data);
    } catch (err) {
      console.error("Erro ao sincronizar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const selectedRoutine = routines.find((r) => r.id === openMenuId);
  const isProfessorRoutine = selectedRoutine?.criado_por_professor === true;

  // --- LÓGICA DE EXCLUSÃO ---
  const handleDelete = async (id: number) => {
    console.log("🟢 BOTÃO CLICADO! Tentando deletar a ficha ID:", id);

    if (isProfessorRoutine) return;

    const performDelete = async () => {
      try {
        setLoading(true);
        setOpenMenuId(null);
        console.log(`📡 Enviando DELETE para /fichas/${id}...`);
        await api.delete(`/fichas/${id}`);
        setRoutines((prev) => prev.filter((r) => r.id !== id));
        console.log("✅ Deletado com sucesso!");
      } catch (err) {
        console.error("❌ Erro ao deletar:", err);
        Alert.alert("Erro", "Não foi possível excluir a rotina.");
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Tem certeza que deseja apagar este treino?")) {
        performDelete();
      }
    } else {
      Alert.alert(
        "Excluir Rotina",
        "Tem certeza que deseja apagar este treino?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Excluir", style: "destructive", onPress: performDelete },
        ],
      );
    }
  };

  const handleEdit = (id: number) => {
    if (isProfessorRoutine) {
      Alert.alert(
        "Acesso Restrito",
        "Treinos montados pelo professor não podem ser alterados.",
      );
      return;
    }
    setOpenMenuId(null);
    router.push(`/create_routine?id=${id}`);
  };

  const handleSendRequest = async () => {
    if (!requestMessage.trim()) {
      return Alert.alert("Campo Vazio", "Descreva o que você deseja treinar.");
    }

    if (!alunoProfile?.professor_id) {
      return Alert.alert(
        "Sem professor vinculado",
        "Você precisa estar vinculado a um professor para enviar uma solicitação. Peça para um professor te adicionar na aba 'Descobrir'."
      );
    }

    try {
      await api.post("/aluno/solicitar-ficha", { mensagem: requestMessage });
      setRequestMessage("");
      setShowRequestModal(false);
      Alert.alert("Solicitação enviada!", "Seu professor foi notificado.");
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Erro ao enviar solicitação.";
      Alert.alert("Erro", msg);
    }
  };

  if (loading)
    return (
      <View style={styles.loadingArea}>
        <ActivityIndicator color={colors.red} size="large" />
      </View>
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header user={user} />

      <View style={styles.container}>
        <View style={styles.inner}>
          <TouchableOpacity
            style={styles.newRoutineButton}
            onPress={() => setShowNewMenu(!showNewMenu)}
          >
            <MaterialIcons name="note-add" size={20} color={colors.white} />
            <Text style={styles.newRoutineText}>Nova Rotina</Text>
          </TouchableOpacity>

          {showNewMenu && (
            <View style={styles.newMenu}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowNewMenu(false);
                  router.push("/create_routine");
                }}
              >
                <FontAwesome
                  name="plus-circle"
                  size={18}
                  color={colors.white}
                />
                <Text style={styles.menuText}>Seguir por conta própria</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowNewMenu(false);
                  setShowRequestModal(true);
                }}
              >
                <Ionicons name="mail" size={18} color={colors.white} />
                <Text style={styles.menuText}>Solicitar ao professor</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ROTINAS</Text>
          </View>

          <FlatList
            data={routines}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.card}>
                {!item.criado_por_professor && (
                  <TouchableOpacity
                    style={styles.cardOptions}
                    onPress={() => setOpenMenuId(item.id)}
                  >
                    <MaterialIcons
                      name="more-vert"
                      size={20}
                      color={colors.grayText}
                    />
                  </TouchableOpacity>
                )}

                <Text style={styles.cardTitle}>{item.titulo}</Text>

                <View style={styles.cardRow}>
                  <FontAwesome
                    name={item.criado_por_professor ? "mortar-board" : "user"}
                    size={14}
                    color={colors.grayText}
                  />
                  <Text style={styles.approvedText}>
                    {item.criado_por_professor
                      ? ` Criada pelo Professor`
                      : ` Sua rotina`}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() =>
                    router.push({
                      pathname: "/workout" as any,
                      params: { id: item.id },
                    })
                  }
                >
                  <Text style={styles.startButtonText}>Iniciar Rotina</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", marginTop: 50 }}>
                <Ionicons name="barbell-outline" size={60} color="#222" />
                <Text style={{ color: "#444", marginTop: 10 }}>
                  Nenhum treino cadastrado.
                </Text>
              </View>
            }
            contentContainerStyle={styles.list}
          />

          <Modal visible={openMenuId !== null} transparent animationType="fade">
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setOpenMenuId(null)}
            >
              {/* Trocamos View por Pressable mantendo o estilo original e adicionando um onPress vazio */}
              <Pressable
                style={styles.modalContentCentered}
                onPress={() => { }} // Bloqueia a propagação do clique para o fundo
              >
                <Text style={styles.modalAlertText}>Opções da Rotina</Text>

                <TouchableOpacity
                  style={styles.modalOptionButton}
                  onPress={() => {
                    setOpenMenuId(null);
                    router.push({
                      pathname: "/edit_routine",
                      params: { id: openMenuId },
                    });
                  }}
                >
                  <Text style={styles.modalOptionText}>Editar rotina</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalOptionButton, { marginTop: 10 }]}
                  onPress={() => handleDelete(openMenuId!)}
                >
                  <Text style={[styles.modalOptionText, { color: colors.red }]}>
                    Excluir rotina
                  </Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>

          <Modal visible={showRequestModal} transparent animationType="slide">
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setShowRequestModal(false)}
            >
              {/* Trocamos View por Pressable mantendo o estilo original e adicionando um onPress vazio */}
              <Pressable
                style={styles.modalContentCentered}
                onPress={() => { }} // Bloqueia a propagação do clique para o fundo
              >
                <Text style={styles.modalTitle}>Solicitar ao professor</Text>
                <TextInput
                  style={styles.requestInput}
                  placeholder="Descreva o que você precisa..."
                  placeholderTextColor="#444"
                  multiline
                  value={requestMessage}
                  onChangeText={setRequestMessage}
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSendRequest}
                >
                  <Text style={styles.sendButtonText}>Enviar Pedido</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      </View>

      <StickyFooter active="workouts" userProfile={user?.tipo_perfil} />
    </SafeAreaView>
  );
}

// Estilos mantidos iguais...
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.red,
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  headerDetail: {
    position: "absolute",
    right: -width * 0.15,
    top: -40,
    width: width * 0.5,
    height: 120,
    backgroundColor: colors.lightRed,
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
    transform: [{ rotate: "15deg" }],
    opacity: 0.18,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#000",
    overflow: "hidden",
    marginRight: 12,
  },
  avatarImage: { width: "100%", height: "100%", resizeMode: "cover" },
  userInfo: { flexDirection: "column" },
  userName: { color: colors.white, fontSize: 16, fontWeight: "700" },
  userHandle: { color: colors.white, fontSize: 12, marginTop: 2, opacity: 0.8 },
  headerRight: { flexDirection: "row", alignItems: "center" },
  iconTouch: { marginLeft: 14, padding: 6 },
  container: { flex: 1, backgroundColor: colors.background },
  inner: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -15,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  loadingArea: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  newRoutineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.darkRed,
    paddingVertical: 15,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 4,
  },
  newRoutineText: { color: colors.white, marginLeft: 8, fontWeight: "700" },
  newMenu: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#222",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  menuText: { color: colors.white, marginLeft: 12, fontSize: 14 },
  sectionHeader: { marginBottom: 15 },
  sectionTitle: { color: colors.white, fontSize: 22, fontWeight: "800" },
  list: { paddingBottom: 120 },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    position: "relative",
    borderWidth: 1,
    borderColor: "#1A1A1A",
  },
  cardOptions: {
    position: "absolute",
    right: 5,
    top: 5,
    padding: 15,
    zIndex: 10,
  },
  cardTitle: {
    color: colors.red,
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 8,
  },
  cardRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  approvedText: {
    color: colors.grayText,
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "500",
  },
  startButton: {
    marginTop: 18,
    backgroundColor: "#161616",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  startButtonText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContentCentered: {
    backgroundColor: "#0A0A0A",
    width: "85%",
    padding: 25,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#222",
  },
  modalTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalAlertText: {
    color: colors.grayText,
    fontSize: 11,
    textAlign: "center",
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalOptionButton: {
    backgroundColor: "#161616",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  modalOptionText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  requestInput: {
    backgroundColor: "#000",
    borderColor: "#222",
    borderWidth: 1,
    color: colors.white,
    padding: 15,
    borderRadius: 12,
    textAlignVertical: "top",
    minHeight: 120,
    marginBottom: 20,
  },
  sendButton: {
    backgroundColor: colors.red,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  sendButtonText: { color: colors.white, fontWeight: "bold" },
});
