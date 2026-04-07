
import React, { useMemo, useState, useEffect } from 'react';
import {
	SafeAreaView,
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	FlatList,
	ActivityIndicator,
	Dimensions,
	ScrollView,
} from 'react-native';
import ImageRotator from '../src/components/ui/image-rotator';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useExercises } from '../src/hooks/useExercises';
import { muscleOptions, displayMuscleLabel } from '../src/constants/muscles';

const { width } = Dimensions.get('window');

const colors = {
	background: '#000000',
	red: '#CC0000',
	darkNav: '#1A1A1A',
	white: '#FFFFFF',
	grayLight: '#BDBDBD',
	grayMid: '#AFAFAF',
};

// imported shared muscle options and label helper

type Exercise = {
	id?: string | number;
	name: string;
	target?: string;
	gifUrl?: string;
	[key: string]: any;
};

export default function ChooseExercise(): JSX.Element {
	const router = useRouter();

	const [selectedExercises, setSelectedExercises] = useState<Array<string | number>>([]);

	// Use the service-backed hook with debounce and error handling
	const { exercises, isLoading, error, searchQuery, setSearchQuery, muscleFilter, setMuscleFilter, loadMore, isLoadingMore, hasMore, targets } =
		useExercises() as any;

	const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

	useEffect(() => {
		if (selectedMuscle === null) {
			setMuscleFilter('Todos os Músculos');
		} else {
			setMuscleFilter(selectedMuscle);
		}
	}, [selectedMuscle, setMuscleFilter]);

    

	// exercises already come filtered by the hook (search / muscle), but ensure array
	const data = Array.isArray(exercises) ? exercises : [];

	function toggleSelect(id: string | number) {
			try {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const existing = Array.isArray(globalThis.__CURRENT_ROUTINE_EXERCISES) ? globalThis.__CURRENT_ROUTINE_EXERCISES.map((e: any) => String(e.id)) : [];
				if (existing.includes(String(id))) return; // prevent selecting items already in routine
			} catch (e) {
				// ignore
			}
			setSelectedExercises((prev) => {
				if (prev.includes(id)) return prev.filter((p) => p !== id);
				return [...prev, id];
			});
	}

	function ExerciseItem({ item }: { item: Exercise }) {
		const id = item.id ?? item.name;
		const isSelected = selectedExercises.includes(id as string | number);

		const targetRaw = (item.target || item.muscle || '').toString();
		const targetLabel = targetRaw ? displayMuscleLabel(targetRaw) : '';

		return (
			<TouchableOpacity
				onPress={() => toggleSelect(id as string | number)}
				style={[styles.card, isSelected ? styles.cardSelected : null]}
			>
				{isSelected && <View style={styles.selectedBar} />}

				<ImageRotator images={item.images && item.images.length ? item.images : item.gifUrl ? [item.gifUrl] : []} style={styles.thumb} />

				<View style={styles.cardCenter}>
					<Text style={styles.exerciseName}>{item.name}</Text>
					<Text style={styles.exerciseTarget}>{targetLabel}</Text>
				</View>

				<View style={styles.cardRight}>
					<MaterialIcons name="trending-up" size={22} color={colors.white} />
				</View>
			</TouchableOpacity>
		);
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backTouch}>
					<Ionicons name="arrow-back" size={24} color={colors.white} />
				</TouchableOpacity>

				<Text style={styles.headerTitle}>Adicionar Exercício</Text>

				<View style={{ width: 32 }} />
			</View>

			<View style={styles.container}>
				<View style={styles.searchRow}>
					<View style={styles.searchBox}>
						<Ionicons name="search" size={18} color={colors.grayLight} style={{ marginLeft: 10 }} />
						<TextInput
							placeholder="Procurar exercício..."
							placeholderTextColor={colors.grayMid}
							style={styles.searchInput}
							value={searchQuery}
							onChangeText={setSearchQuery}
							returnKeyType="search"
						/>
					</View>
				</View>

				{/* Chips horizontal filter (Todos + muscleMap) */}
							<View style={styles.filterRow}>
								<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
									<TouchableOpacity style={[styles.chip, selectedMuscle === null ? styles.chipActive : null]} onPress={() => setSelectedMuscle(null)}>
										<Text style={[styles.chipText, selectedMuscle === null ? styles.chipTextActive : null]}>Todos</Text>
									</TouchableOpacity>

									{muscleOptions.map((key) => (
										<TouchableOpacity key={key} style={[styles.chip, selectedMuscle === key ? styles.chipActive : null, { marginLeft: 8 }]} onPress={() => setSelectedMuscle(key)}>
											<Text style={[styles.chipText, selectedMuscle === key ? styles.chipTextActive : null]}>{displayMuscleLabel(key)}</Text>
										</TouchableOpacity>
									))}
								</ScrollView>
							</View>



				{searchQuery ? <Text style={styles.sectionTitle}>Resultados</Text> : null}

				{isLoading ? (
					<ActivityIndicator size="large" color={colors.red} style={{ marginTop: 24 }} />
				) : error ? (
					<Text style={{ color: colors.grayLight, marginTop: 12 }}>{error}</Text>
				) : (
					<FlatList
						data={data}
						keyExtractor={(it) => (it.id ? String(it.id) : it.name)}
						renderItem={({ item }) => <ExerciseItem item={item} />}
						contentContainerStyle={{ paddingBottom: 220 }}
						style={{ flex: 1 }}
						ItemSeparatorComponent={() => <View style={styles.separator} />}
						onEndReached={() => {
							if (hasMore) loadMore();
						}}
						onEndReachedThreshold={0.5}
						ListFooterComponent={isLoadingMore ? <ActivityIndicator color={colors.red} style={{ margin: 16 }} /> : null}
					/>
				)}
			</View>

			{selectedExercises.length > 0 && (
				<TouchableOpacity
					style={styles.fab}
					onPress={() => {
						// filter selected and exclude exercises already in current routine
						let chosen: any[] = [];
						try {
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							const existing = Array.isArray(globalThis.__CURRENT_ROUTINE_EXERCISES) ? new Set(globalThis.__CURRENT_ROUTINE_EXERCISES.map((e: any) => String(e.id))) : new Set();
							chosen = data
									.filter((it) => selectedExercises.includes(it.id ?? it.name) && !existing.has(String(it.id ?? it.name)))
									.map((it) => ({
										id: it.id ?? it.name,
										name: it.name,
										images: it.images && it.images.length ? it.images : it.gifUrl ? [it.gifUrl] : [],
										target: it.target || it.muscle || '',
										sets: [{ weight: '', reps: '', distance: '', time: '', floors: '' }],
									}));
						} catch (e) {
							// fallback: include all selected
							chosen = data.filter((it) => selectedExercises.includes(it.id ?? it.name)).map((it) => ({ id: it.id ?? it.name, name: it.name, images: it.images && it.images.length ? it.images : it.gifUrl ? [it.gifUrl] : [], target: it.target || it.muscle || '', sets: [{ weight: '', reps: '', distance: '', time: '', floors: '' }] }));
						}
						try {
							// store on globalThis for the next screen to read
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							globalThis.__PENDING_SELECTED_EXERCISES = chosen;
							router.back();
						} catch (e) {
							console.error('Failed to pass selected exercises', e);
							router.back();
						}
					}}
				>
					<Text style={styles.fabText}>Adicionar {selectedExercises.length} exercício{selectedExercises.length > 1 ? 's' : ''}</Text>
				</TouchableOpacity>
			)}
		</SafeAreaView>
	);
}

// (ptLabelFor / displayLabelFor removed — use `muscleMap`)

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: colors.background,
	},
	header: {
		backgroundColor: colors.background,
		paddingHorizontal: 16,
		paddingTop: 40,
		paddingBottom: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	backTouch: {
		width: 32,
		alignItems: 'flex-start',
	},
	headerTitle: {
		color: colors.white,
		fontSize: 18,
		fontWeight: '700',
	},
	container: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 24,
		backgroundColor: colors.background,
	},
	searchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	searchBox: {
		flex: 1,
		backgroundColor: colors.darkNav,
		borderRadius: 999,
		flexDirection: 'row',
		alignItems: 'center',
		height: 44,
	},
	searchInput: {
		flex: 1,
		color: colors.white,
		marginLeft: 8,
		fontSize: 14,
		paddingRight: 12,
	},
	filterButton: {
		marginLeft: 8,
		backgroundColor: colors.darkNav,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		justifyContent: 'center',
	},
	filterRow: {
		marginTop: 12,
		marginBottom: 6,
	},
	targetsList: {
		backgroundColor: '#0D0D0D',
		borderRadius: 10,
		paddingVertical: 6,
		paddingHorizontal: 8,
		marginBottom: 8,
	},
	targetItem: {
		paddingVertical: 10,
		paddingHorizontal: 8,
		borderRadius: 6,
		marginBottom: 6,
	},
	targetItemActive: {
		backgroundColor: '#111111',
	},
	targetText: {
		color: colors.white,
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.6)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		width: '90%',
		maxHeight: '80%',
		backgroundColor: '#070707',
		borderRadius: 12,
		padding: 12,
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	modalTitle: {
		color: colors.white,
		fontSize: 16,
		fontWeight: '700',
	},
	modalClose: {
		padding: 6,
	},
	modalList: {
		flex: 1,
	},
	filterText: {
		color: colors.white,
		fontSize: 14,
	},
	chip: {
		backgroundColor: '#1A1A1A',
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 20,
		marginRight: 8,
		alignSelf: 'center',
	},
	chipActive: {
		backgroundColor: colors.red,
	},
	chipText: {
		color: '#DDDDDD',
		fontSize: 13,
	},
	chipTextActive: {
		color: colors.white,
		fontWeight: '700',
	},
	sectionTitle: {
		color: '#CFCFCF',
		marginTop: 16,
		marginBottom: 8,
		fontSize: 13,
		fontWeight: '600',
	},
	chipDisabled: {
		opacity: 0.5,
	},
	card: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 6,
		backgroundColor: 'transparent',
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#111111',
		position: 'relative',
	},
	cardSelected: {
		backgroundColor: '#111111',
	},
	selectedBar: {
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 0,
		width: 5,
		backgroundColor: colors.red,
		borderTopLeftRadius: 2,
		borderBottomLeftRadius: 2,
	},
	thumb: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: '#ffffff',
		marginRight: 12,
	},
	cardCenter: {
		flex: 1,
		flexDirection: 'column',
	},
	exerciseName: {
		color: colors.white,
		fontSize: 15,
		fontWeight: '600',
	},
	exerciseTarget: {
		color: '#9A9A9A',
		fontSize: 12,
		marginTop: 4,
	},
	cardRight: {
		width: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	separator: {
		height: 1,
		backgroundColor: '#0D0D0D',
	},
	fab: {
		position: 'absolute',
		bottom: 20,
		width: '90%',
		alignSelf: 'center',
		backgroundColor: colors.red,
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.25,
		shadowRadius: 8,
		elevation: 6,
	},
	fabText: {
		color: colors.white,
		fontSize: 16,
		fontWeight: '700',
	},
});

