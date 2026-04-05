import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, MapPin, CornerUpRight, CornerUpLeft, ShieldCheck, AlertTriangle, Info } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

export default function AlertsScreen() {
    const navigation = useNavigation();
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
                    title: 'ACTIVE STATUS'
                };
        }
    };

    const theme = getTheme();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 20, paddingBottom: 10, backgroundColor: '#ffffff', width: '100%', marginBottom: 16 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: 16, borderRadius: 100, backgroundColor: '#f3f4f6' }}>
                    <ChevronLeft color="#1E293B" size={24} />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center', paddingRight: 48 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.primary }}>{theme.title}</Text>
                </View>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
                {/* Alert Card / Speech Bubble */}
                <View style={{ backgroundColor: theme.bg, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.accent, position: 'relative', marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        {theme.icon}
                        <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 18, marginLeft: 8 }}>Smart Drive Assistant</Text>
                    </View>
                    <Text style={{ fontSize: 16, color: '#334155', lineHeight: 24, marginBottom: 16, fontWeight: '500' }}>
                        "{message}"
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MapPin color="#64748B" size={18} style={{ marginRight: 8 }} />
                        <Text style={{ fontWeight: '500', color: '#64748B' }}>{address}</Text>
                    </View>

                    {/* Speech bubble tail effect */}
                    <View style={{ position: 'absolute', bottom: -12, right: 32, width: 24, height: 24, backgroundColor: theme.bg, borderBottomWidth: 1, borderRightWidth: 1, borderColor: theme.accent, transform: [{ rotate: '45deg' }] }} />
                </View>

                {/* Live Map Context */}
                <View style={{ width: '100%', height: 320, backgroundColor: '#e2e8f0', borderRadius: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, overflow: 'hidden' }}>
                    {latitude && longitude ? (
                        <MapView
                            style={{ flex: 1 }}
                            initialRegion={{
                                latitude,
                                longitude,
                                latitudeDelta: 0.005,
                                longitudeDelta: 0.005,
                            }}
                            mapType="mutedStandard"
                        >
                            <Marker coordinate={{ latitude, longitude }}>
                                <View style={{ backgroundColor: 'white', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: theme.primary }}>
                                    {theme.icon}
                                </View>
                            </Marker>
                        </MapView>
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: '#94a3b8', fontWeight: '500' }}>Waiting for Gps Location...</Text>
                        </View>
                    )}
                </View>

                {/* Action Button */}
                <TouchableOpacity 
                   onPress={() => navigation.goBack()}
                   style={{ backgroundColor: theme.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 40, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Return to Safety View</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
