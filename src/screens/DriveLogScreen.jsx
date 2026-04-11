import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, MapPin, ShieldCheck, AlertTriangle, Info, Calendar, Clock, Navigation, ArrowRight } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function DriveLogScreen() {
    const navigation = useNavigation();
    const { trips, user } = React.useContext(AuthContext);
    const route = useRoute();
    const { 
        type = 'Alert', 
        message = 'Safe tracking active', 
        severity = 'normal', 
        latitude, 
        longitude 
    } = route.params || {};

    const [address, setAddress] = useState("Locating...");

    useEffect(() => {
        async function getAddress() {
            if (latitude && longitude) {
                try {
                    let result = await Location.reverseGeocodeAsync({ latitude, longitude });
                    if (result && result.length > 0) {
                        const item = result[0];
                        setAddress(`${item.street || ''}, ${item.city || item.region || ''}`);
                    }
                } catch (e) {
                    setAddress("Current Location");
                }
            } else {
                setAddress("Gps Signal Weak");
            }
        }
        getAddress();
    }, [latitude, longitude]);

    const getTheme = () => {
        switch (severity.toLowerCase()) {
            case 'critical':
                return { 
                    bg: '#fee2e2', 
                    primary: '#dc2626', 
                    accent: '#fca5a5', 
                    icon: <AlertTriangle color="#dc2626" size={24} />,
                    title: 'CRITICAL ALERT'
                };
            case 'moderate':
            case 'speeding':
                return { 
                    bg: '#ffedd5', 
                    primary: '#ea580c', 
                    accent: '#fdba74', 
                    icon: <AlertTriangle color="#ea580c" size={24} />,
                    title: 'SAFETY WARNING'
                };
            case 'ai_coach':
                return { 
                    bg: '#eff6ff', 
                    primary: '#2563eb', 
                    accent: '#93c5fd', 
                    icon: <Info color="#2563eb" size={24} />,
                    title: 'AI SAFETY COACH'
                };
            default:
                return { 
                    bg: '#f8fafc', 
                    primary: '#1e293b', 
                    accent: '#cbd5e1', 
                    icon: <ShieldCheck color="#1e293b" size={24} />,
                    title: 'DRIVE LOG'
                };
        }
    };

    const theme = getTheme();

    const renderTripItem = (trip) => {
        const date = trip.start_time ? new Date(trip.start_time).toLocaleDateString() : 'N/A';
        return (
            <TouchableOpacity 
                key={trip.id}
                onPress={() => navigation.navigate('TripDetails', { trip })}
                style={{ 
                    backgroundColor: '#fff', 
                    borderRadius: 20, 
                    padding: 18, 
                    marginBottom: 16, 
                    borderWidth: 1, 
                    borderColor: '#f1f5f9',
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 5,
                    elevation: 1
                }}
            >
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                    <Navigation color="#2563eb" size={22} />
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>{date}</Text>
                        <View style={{ px: 8, py: 2, borderRadius: 6, backgroundColor: (trip.alerts_count || 0) > 0 ? '#fff7ed' : '#f0fdf4' }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: (trip.alerts_count || 0) > 0 ? '#ea580c' : '#16a34a' }}>
                                {trip.alerts_count || 0} Alerts
                            </Text>
                        </View>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1e293b' }} numberOfLines={1}>
                        {trip.start_location?.split(',')[0] || 'Start'} → {trip.end_location?.split(',')[0] || 'End'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <MapPin size={12} color="#94a3b8" />
                        <Text style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>{trip.distance_km ? `${trip.distance_km.toFixed(1)} km` : '-- km'}</Text>
                    </View>
                </View>
                <ArrowRight color="#cbd5e1" size={18} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 10, backgroundColor: '#ffffff', width: '100%', marginBottom: 16 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: 16, borderRadius: 100, backgroundColor: '#f3f4f6' }}>
                    <ChevronLeft color="#1E293B" size={24} />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center', paddingRight: 48 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.primary }}>{theme.title}</Text>
                </View>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
                {/* Statistics Banner */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24, marginTop: 10 }}>
                    <View style={{ flex: 1, backgroundColor: theme.primary, borderRadius: 24, padding: 20, shadowColor: theme.primary, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }}>
                        <Text style={{ color: 'white', opacity: 0.8, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>TOTAL TRIPS</Text>
                        <Text style={{ color: 'white', fontSize: 28, fontWeight: 'black', marginTop: 4 }}>{trips?.length || 0}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <Text style={{ color: '#64748b', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>DISTANCE</Text>
                        <Text style={{ color: '#1e293b', fontSize: 22, fontWeight: 'bold', marginTop: 4 }}>
                            {trips?.reduce((acc, t) => acc + (t.distance_km || 0), 0).toFixed(1)} <Text style={{ fontSize: 12, color: '#94a3b8' }}>km</Text>
                        </Text>
                    </View>
                </View>

                {/* If there is a current alert, show it first */}
                {latitude && longitude && (
                    <View style={{ backgroundColor: theme.bg, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.accent, position: 'relative', marginBottom: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            {theme.icon}
                            <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 18, marginLeft: 8 }}>Current Alert</Text>
                        </View>
                        <Text style={{ fontSize: 16, color: '#334155', lineHeight: 24, marginBottom: 16, fontWeight: '500' }}>
                            "{message}"
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MapPin color="#64748B" size={18} style={{ marginRight: 8 }} />
                            <Text style={{ fontWeight: '500', color: '#64748B' }}>{address}</Text>
                        </View>
                    </View>
                )}

                {/* Drive Log List */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>History Log</Text>
                    <Clock color="#94a3b8" size={20} />
                </View>

                {trips?.length === 0 ? (
                    <View style={{ padding: 40, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' }}>
                        <MapPin size={40} color="#cbd5e1" />
                        <Text style={{ color: '#94a3b8', marginTop: 12, fontWeight: '500', textAlign: 'center' }}>No trips found yet. Your past drives will appear here.</Text>
                    </View>
                ) : (
                    trips?.slice(0, 15).map(renderTripItem)
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}
