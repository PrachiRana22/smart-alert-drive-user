import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, StyleSheet, ScrollView } from 'react-native';
import { Settings, Home, Users, AlertCircle, User, Menu, Bell, ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from '../locales';

export default function HomeScreen({ navigation }) {
    const { user, trips, licenseData, vehicles } = React.useContext(AuthContext);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();
    const [currentDate, setCurrentDate] = React.useState('');

    React.useEffect(() => {
        const date = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        setCurrentDate(`${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`);
    }, []);

    if (!user) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Loading Dashboard...</Text>
            </View>
        );
    }

    // ✅ DYNAMIC DATA ACCESS
    const vehicle = vehicles && vehicles.length > 0 ? vehicles[0] : null;

    // Dynamic Calculations
    const totalAlerts = trips?.reduce((acc, t) => acc + (t.alertsCount || 0), 0) || 0;
    const computedSafetyScore = trips?.length > 0 ? Math.max(0, 100 - (totalAlerts * 3)) : 100;

    const getGradeDetails = (score) => {
        if (score >= 90) return { grade: "A+", label: "Elite Driver", color: "#10B981", bg: isDark ? "#064E3B" : "#ECFDF5", border: "#34D399", msg: "Fantastic job. You are driving exceptionally safely!" };
        if (score >= 75) return { grade: "B", label: "Safe Driver", color: "#3B82F6", bg: isDark ? "#1E3A8A" : "#EFF6FF", border: "#60A5FA", msg: "Good driving! Keep maintaining your focus." };
        if (score >= 60) return { grade: "C", label: "Caution Required", color: "#F59E0B", bg: isDark ? "#78350F" : "#FFFBEB", border: "#FBBF24", msg: "Warning: Multiple alerts triggered. Enhance your focus." };
        return { grade: "F", label: "High Risk", color: "#EF4444", bg: isDark ? "#7F1D1D" : "#FEF2F2", border: "#F87171", msg: "CRITICAL: You are showing highly dangerous driving patterns." };
    };
    const gradeInfo = getGradeDetails(computedSafetyScore);
    
    const totalMs = trips?.reduce((acc, t) => acc + (t.driveTime || 0), 0) || 0;
    const driveHours = Math.floor(totalMs / (1000 * 60 * 60));
    const driveMinutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    const formattedDriveTime = trips?.length > 0 ? `${driveHours}h ${driveMinutes}m` : "0h 0m";

    const totalDistanceKm = trips?.reduce((acc, t) => acc + (t.distance_km || 0), 0) || 0;
    const formattedDistance = trips?.length > 0 ? `${totalDistanceKm.toFixed(1)} km` : "0 km";

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-900">

            {/* 🔥 HEADER */}
            <View style={styles.header}>
                <Text className="text-base font-semibold text-slate-500 dark:text-slate-400">{currentDate}</Text>

                <View style={styles.headerIcons}>
                    <Bell color={isDark ? "#E2E8F0" : "#1E293B"} size={26} />
                    <TouchableOpacity onPress={() => navigation.navigate('DriverProfile')}>
                        <User color={isDark ? "#E2E8F0" : "#1E293B"} size={26} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                        <Settings color={isDark ? "#E2E8F0" : "#1E293B"} size={26} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ✅ Welcome */}
            <View style={{ px: 24, paddingHorizontal: 24 }}>
                <Text className="text-3xl font-bold text-slate-800 dark:text-white">Welcome, {user.first_name || user.username}</Text>
            </View>

            {/* MAIN CONTENT */}
            <ScrollView style={{flex: 1}} contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>

                {/* ✅ COMPLETE PROFILE NUDGE */}
                {(!user.license_number || !vehicles || vehicles.length === 0) && (
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('LicenseDetails')}
                        className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl mb-5 border border-amber-200 dark:border-amber-800 flex-row items-center justify-between shadow-sm"
                    >
                        <View className="flex-1">
                            <View className="flex-row items-center mb-1">
                                <AlertCircle color="#B45309" size={16} />
                                <Text className="text-amber-800 dark:text-amber-400 font-bold ml-2">Complete Profile</Text>
                            </View>
                            <Text className="text-amber-700 dark:text-amber-500 text-xs">Setup your license and vehicle to begin.</Text>
                        </View>
                        <ChevronRight color="#B45309" size={20} />
                    </TouchableOpacity>
                )}

                {/* ✅ USER & VEHICLE CARD */}
                <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 flex-row justify-between items-center border border-slate-200 dark:border-slate-700 shadow-sm">
                    <View className="mb-6 z-10">

                        <Text className="text-xs text-slate-400 dark:text-slate-400 mt-2">{t('home.driverName')}</Text>
                        <Text className="text-base font-bold text-slate-800 dark:text-white">{user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username}</Text>

                        <Text className="text-xs text-slate-400 dark:text-slate-400 mt-2">{t('home.vehicleType')}</Text>
                        <Text className="text-base font-bold text-slate-800 dark:text-white">
                            {vehicle ? `${vehicle.make} ${vehicle.model}` : 'No Vehicle Added'}
                        </Text>

                        <Text className="text-xs text-slate-400 dark:text-slate-400 mt-2">{t('home.vehicleNumber')}</Text>
                        <Text className="text-base font-bold text-slate-800 dark:text-white">{vehicle?.license_plate || '---'}</Text>
                    </View>

                    {/* Image from License Data */}
                    <View>
                        {user.profile_image ? (
                            <Image
                                source={{ uri: user.profile_image.startsWith('data:') ? user.profile_image : `data:image/jpeg;base64,${user.profile_image}` }}
                                style={styles.profileImage}
                            />
                        ) : licenseData?.image ? (
                            <Image
                                source={{ uri: `data:image/jpeg;base64,${licenseData.image}` }}
                                style={styles.profileImage}
                            />
                        ) : (
                            <View className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-700 justify-center items-center">
                                <User size={50} color={isDark ? "#64748B" : "#94A3B8"} />
                            </View>
                        )}
                    </View>
                </View>

                {/* ⭐️ SAFETY SCORE GAMIFICATION CARD */}
                <View className="rounded-3xl p-6 mt-5 shadow-sm border-2" style={{ backgroundColor: gradeInfo.bg, borderColor: gradeInfo.border }}>
                    <View className="flex-row justify-between items-center mb-3">
                        <View className="flex-1">
                            <Text className="text-5xl font-black" style={{ color: gradeInfo.color }}>{gradeInfo.grade}</Text>
                            <Text className="text-sm font-bold uppercase tracking-wide mt-1" style={{ color: gradeInfo.color }}>{gradeInfo.label}</Text>
                        </View>
                        <View className="w-[80px] h-[80px] rounded-full items-center justify-center border-4 bg-white dark:bg-slate-800" style={{ borderColor: gradeInfo.color }}>
                            <Text className="text-2xl font-black" style={{ color: gradeInfo.color }}>{computedSafetyScore}</Text>
                            <Text className="text-[10px] font-bold text-slate-400">SCORE</Text>
                        </View>
                    </View>
                    <Text className="text-sm font-medium mt-1 dark:text-slate-200 text-slate-700">{gradeInfo.msg}</Text>
                </View>

                {/* ✅ DRIVER STATISTICS */}
                <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 mt-5 border border-slate-200 dark:border-slate-700">
                    <Text className="text-lg font-bold mb-4 text-slate-800 dark:text-white">{t('home.weeklyTripReport')}</Text>
                    <View className="flex-row justify-around items-center mb-4">
                        <View className="items-center">
                            <Text className="text-gray-400 dark:text-slate-500 text-xs font-semibold uppercase">{t('home.totalTrips')}</Text>
                            <Text className="text-2xl font-bold text-slate-700 dark:text-gray-200 mt-2">{trips?.length || 0}</Text>
                        </View>
                        <View className="items-center border-l border-slate-100 dark:border-slate-700 pl-6">
                            <Text className="text-gray-400 dark:text-slate-500 text-xs font-semibold uppercase">{t('home.driveTime')}</Text>
                            <Text className="text-2xl font-bold text-slate-700 dark:text-gray-200 mt-2">{formattedDriveTime}</Text>
                        </View>
                        <View className="items-center border-l border-slate-100 dark:border-slate-700 pl-6">
                            <Text className="text-gray-400 dark:text-slate-500 text-xs font-semibold uppercase">{t('home.distance')}</Text>
                            <Text className="text-2xl font-bold text-slate-700 dark:text-gray-200 mt-2">{formattedDistance}</Text>
                        </View>
                    </View>

                    <View style={styles.reportRow}>
                        <Text className="text-slate-500 dark:text-slate-400">{t('home.totalAlerts')}:</Text>
                        <Text className="font-bold text-slate-800 dark:text-white">{totalAlerts}</Text>
                    </View>
                    <View style={styles.reportRow}>
                        <Text className="text-slate-500 dark:text-slate-400">{t('home.totalTrips')}:</Text>
                        <Text className="font-bold text-slate-800 dark:text-white">{trips?.length || 0}</Text>
                    </View>
                </View>

                {/* START TRIP BUTTON */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('TripSetup')}
                    style={styles.startBtn}
                >
                    <Text style={styles.startBtnText}>Start Trip</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* BOTTOM NAV */}
            <View className="flex-row justify-between items-center px-8 py-5 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800">
                <TouchableOpacity><Home color={isDark ? "#3B82F6" : "#2563EB"} size={28} /></TouchableOpacity>
                <TouchableOpacity><Users color={isDark ? "#64748B" : "#94A3B8"} size={28} /></TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
                    <AlertCircle color={isDark ? "#64748B" : "#94A3B8"} size={28} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <User color={isDark ? "#64748B" : "#94A3B8"} size={28} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                    <Menu color={isDark ? "#64748B" : "#94A3B8"} size={28} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8FAFC" },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#64748B' },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    dateText: { fontSize: 16, fontWeight: '600', color: "#64748B" },
    headerIcons: { flexDirection: "row", alignItems: "center", gap: 15 },
    welcomeName: { fontSize: 26, fontWeight: "bold", color: "#1E293B" },
    mainContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
    userCard: { 
        backgroundColor: "#FFF", borderRadius: 20, padding: 20, 
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        borderWidth: 1, borderColor: "#E2E8F0", elevation: 2
    },
    label: { fontSize: 12, color: "#94A3B8", marginTop: 8 },
    value: { fontSize: 16, fontWeight: "bold", color: "#1E293B" },
    profileImage: { width: 80, height: 80, borderRadius: 12 },
    imagePlaceholder: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    reportCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 20, marginTop: 20, borderWidth: 1, borderColor: "#E2E8F0" },
    cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, color: "#1E293B" },
    reportRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    reportLabel: { color: '#64748B' },
    reportValue: { fontWeight: 'bold', color: '#1E293B' },
    startBtn: { backgroundColor: "#2563EB", padding: 18, borderRadius: 15, alignItems: "center", marginTop: 30 },
    startBtnText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
    bottomNav: { 
        flexDirection: "row", justifyContent: "space-between", alignItems: "center", 
        paddingHorizontal: 30, paddingVertical: 20, backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: "#E2E8F0" 
    }
});
