import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { Settings, Home, Users, AlertCircle, User, Menu, Bell } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from '../locales';

export default function HomeScreen({ navigation }) {
    const { user, trips, licenseData } = React.useContext(AuthContext);
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

    // ✅ FIXED DATA ACCESS
    const vehicle = user?.vehicles && user.vehicles.length > 0 ? user.vehicles[0] : null;
    
    // Dynamic Calculations
    const totalAlerts = trips?.reduce((acc, t) => acc + (t.alertsCount || 0), 0) || 0;
    const computedSafetyScore = trips?.length > 0 ? Math.max(0, 100 - (totalAlerts * 5)) : 100;
    
    const totalMs = trips?.reduce((acc, t) => acc + (t.driveTime || 0), 0) || 0;
    const driveHours = Math.floor(totalMs / (1000 * 60 * 60));
    const driveMinutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    const formattedDriveTime = trips?.length > 0 ? `${driveHours}h ${driveMinutes}m` : "0h 0m";

    const totalDistanceMeters = trips?.reduce((acc, t) => acc + (t.distance || 0), 0) || 0;
    const formattedDistance = trips?.length > 0 ? `${(totalDistanceMeters / 1609.34).toFixed(1)} mi` : "0 mi";

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
                <Text className="text-3xl font-bold text-slate-800 dark:text-white">Welcome, {user.name || 'User'}</Text>
            </View>

            {/* MAIN CONTENT */}
            <View style={styles.mainContent}>

                {/* ✅ USER & VEHICLE CARD */}
                <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 flex-row justify-between items-center border border-slate-200 dark:border-slate-700 shadow-sm">
                    <View className="mb-6 z-10">

                        <Text className="text-xs text-slate-400 dark:text-slate-400 mt-2">{t('home.driverName')}</Text>
                        <Text className="text-base font-bold text-slate-800 dark:text-white">{user.name || 'User'}</Text>

                        <Text className="text-xs text-slate-400 dark:text-slate-400 mt-2">{t('home.vehicleType')}</Text>
                        <Text className="text-base font-bold text-slate-800 dark:text-white">{vehicle?.type || 'Not Set'}</Text>

                        <Text className="text-xs text-slate-400 dark:text-slate-400 mt-2">{t('home.vehicleNumber')}</Text>
                        <Text className="text-base font-bold text-slate-800 dark:text-white">{vehicle?.number || 'Not Set'}</Text>
                    </View>

                    {/* Image from License Data */}
                    <View>
                        {licenseData?.image ? (
                            <Image
                                source={{ uri: licenseData.image }}
                                style={styles.profileImage}
                            />
                        ) : (
                            <View className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-700 justify-center items-center">
                                <User size={50} color={isDark ? "#64748B" : "#94A3B8"} />
                            </View>
                        )}
                    </View>
                </View>

                {/* ✅ DRIVER REPORT */}
                <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 mt-5 border border-slate-200 dark:border-slate-700">
                    <Text className="text-lg font-bold mb-4 text-slate-800 dark:text-white">{t('home.weeklyTripReport')}</Text>
                    <View className="flex-row justify-around items-center mb-4">
                        <View className="items-center">
                            <Text className="text-gray-400 dark:text-slate-500 text-xs font-semibold uppercase">{t('home.safetyScore')}</Text>
                            <Text className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">{computedSafetyScore}</Text>
                        </View>
                        <View className="items-center border-l border-slate-100 dark:border-slate-700 pl-6">
                            <Text className="text-gray-400 dark:text-slate-500 text-xs font-semibold uppercase">{t('home.driveTime')}</Text>
                            <Text className="text-xl font-bold text-slate-700 dark:text-gray-200 mt-2">{formattedDriveTime}</Text>
                        </View>
                        <View className="items-center border-l border-slate-100 dark:border-slate-700 pl-6">
                            <Text className="text-gray-400 dark:text-slate-500 text-xs font-semibold uppercase">{t('home.distance')}</Text>
                            <Text className="text-xl font-bold text-slate-700 dark:text-gray-200 mt-2">{formattedDistance}</Text>
                        </View>
                    </View>
                    <View style={styles.reportRow}>
                        <Text className="text-slate-500 dark:text-slate-400">{t('home.safetyScore')}:</Text>
                        <Text className="font-bold text-slate-800 dark:text-white">{computedSafetyScore}</Text>
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

            </View>

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
    mainContent: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
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
