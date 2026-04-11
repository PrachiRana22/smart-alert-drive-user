import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { ChevronLeft, Calendar, MapPin, AlertCircle, Clock, Navigation } from 'lucide-react-native';

export default function TripDetailsScreen({ navigation, route }) {
    const { trip } = route.params || {};

    if (!trip) {
        return (
            <View style={styles.center}>
                <Text>Trip data not found.</Text>
            </View>
        );
    }

    // Extracting data from trip object
    const routeCoords = trip.route_coords || trip.path || [];
    const alertsDetails = trip.alerts || [];
    const startTime = trip.start_time ? new Date(trip.start_time) : null;
    const endTime = trip.end_time ? new Date(trip.end_time) : null;

    // Calculate duration in minutes if not provided by backend
    const durationMinutes = trip.duration_minutes || (startTime && endTime ? Math.round((endTime - startTime) / (1000 * 60)) : 0);

    const initialRegion = routeCoords.length > 0 ? {
        latitude: routeCoords[Math.floor(routeCoords.length / 2)].latitude,
        longitude: routeCoords[Math.floor(routeCoords.length / 2)].longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    } : {
        latitude: 20.5937,
        longitude: 78.9629,
        latitudeDelta: 10,
        longitudeDelta: 10,
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color="#1E293B" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trip Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Map View */}
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        initialRegion={initialRegion}
                        mapType="standard"
                    >
                        {routeCoords.length > 0 && (
                            <Polyline
                                coordinates={routeCoords}
                                strokeWidth={4}
                                strokeColor="#2563EB"
                            />
                        )}

                        {/* Start Marker */}
                        {routeCoords.length > 0 && (
                            <Marker coordinate={routeCoords[0]} pinColor="green" title="Start" />
                        )}

                        {/* End Marker */}
                        {routeCoords.length > 0 && (
                            <Marker coordinate={routeCoords[routeCoords.length - 1]} pinColor="red" title="End" />
                        )}

                        {/* Alert Heatmap */}
                        {alertsDetails
                            .filter(alert => alert.latitude != null && alert.longitude != null)
                            .map((alert, index) => (
                                <Marker
                                    key={`alert-${index}`}
                                    coordinate={{ 
                                        latitude: parseFloat(alert.latitude), 
                                        longitude: parseFloat(alert.longitude) 
                                    }}
                                    pinColor={alert.severity === 'CRITICAL_RISK' ? 'red' : 'orange'}
                                    title={alert.alert_type?.replace('_', ' ')}
                                    description={alert.message || 'Safety Incident'}
                                />
                            ))
                        }
                    </MapView>
                </View>

                {/* Summary Card */}
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Calendar size={20} color="#64748B" />
                        <Text style={styles.dateText}>
                            {startTime ? startTime.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown Date'}
                        </Text>
                    </View>

                    <View style={styles.routeContainer}>
                        <View style={styles.locItem}>
                            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                            <Text style={styles.locText} numberOfLines={1}>{trip.start_location || 'Start Point'}</Text>
                        </View>
                        <View style={styles.line} />
                        <View style={styles.locItem}>
                            <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                            <Text style={styles.locText} numberOfLines={1}>{trip.end_location || 'End Point'}</Text>
                        </View>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Navigation size={20} color="#2563EB" />
                        <Text style={styles.statLabel}>Distance</Text>
                        <Text style={styles.statValue}>{(trip.distance_km || 0).toFixed(1)} km</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Clock size={20} color="#10B981" />
                        <Text style={styles.statLabel}>Duration</Text>
                        <Text style={styles.statValue}>{durationMinutes > 0 ? `${durationMinutes} min` : '< 1 min'}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <AlertCircle size={20} color="#F59E0B" />
                        <Text style={styles.statLabel}>Alerts</Text>
                        <Text style={styles.statValue}>{trip.alerts_count || 0}</Text>
                    </View>
                </View>

                {/* Detailed Alerts Log */}
                <Text style={styles.sectionTitle}>Safety Incidents</Text>
                {alertsDetails.length === 0 ? (
                    <View style={styles.emptyAlerts}>
                        <Text style={styles.emptyText}>No alerts were triggered during this trip. Great driving!</Text>
                    </View>
                ) : (
                    alertsDetails.map((alert, index) => (
                        <View key={index} style={styles.alertItem}>
                            <View style={[styles.severityIndicator, { backgroundColor: alert.severity === 'CRITICAL_RISK' ? '#FEE2E2' : '#FFEDD5' }]}>
                                <Text style={[styles.severityText, { color: alert.severity === 'CRITICAL_RISK' ? '#DC2626' : '#EA580C' }]}>
                                    {alert.alert_type?.replace('_', ' ')}
                                </Text>
                            </View>
                            <Text style={styles.alertMsg}>{alert.message || 'Warning triggered'}</Text>
                        </View>
                    ))
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
    backButton: { padding: 8, borderRadius: 12, backgroundColor: '#F1F5F9' },
    scrollContent: { padding: 20 },
    mapContainer: { height: 250, borderRadius: 24, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
    map: { flex: 1 },
    card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    dateText: { marginLeft: 8, fontSize: 15, fontWeight: '600', color: '#475569' },
    routeContainer: { paddingLeft: 10 },
    locItem: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
    locText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1E293B' },
    line: { width: 2, height: 20, backgroundColor: '#E2E8F0', marginLeft: 3, marginVertical: 4 },
    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    statLabel: { fontSize: 12, color: '#64748B', marginTop: 8, marginBottom: 4 },
    statValue: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
    alertItem: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#FBBF24' },
    severityIndicator: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8 },
    severityText: { fontSize: 10, fontWeight: 'bold', uppercase: true },
    alertMsg: { fontSize: 13, color: '#475569', lineHeight: 20 },
    emptyAlerts: { padding: 30, alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 24, borderWidth: 1, borderColor: '#D1FAE5' },
    emptyText: { color: '#065F46', textAlign: 'center', fontWeight: '500' }
});
