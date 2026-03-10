import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Settings, MapPin, Home, Users, AlertCircle, User, Menu } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
    const { user, logout } = React.useContext(AuthContext);

    const handleLogout = () => {
        logout();
        navigation.replace('Login');
    };

    if (!user) {
        return (
            <View className="flex-1 bg-surface justify-center items-center">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="mt-4 font-outfit text-gray-500">Loading Dashboard...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-surface">
            {/* Header Section */}
            <View className="flex-row justify-between items-center px-6 pt-16 pb-4 bg-surface">
                <Text className="text-2xl font-outfit-bold text-secondary">Hii, {user.name}</Text>
                <TouchableOpacity /*onPress={handleLogout}*/ onPress={() => navigation.navigate('Settings')} className="p-2 -mr-2">
                    {/* Replaced Settings with Logout temporarily or just Settings */}
                    <Settings color="#1E293B" size={24} />
                </TouchableOpacity>
            </View>

            {/* Main Content Area */}
            <View className="flex-1 px-6 pt-6">
                <Text className="text-xl font-outfit-bold text-secondary mb-4">Where to Today !</Text>

                {/* Map Placeholder */}
                <TouchableOpacity className="flex-1 bg-gray-50 rounded-3xl border border-gray-200 items-center justify-center mb-8 shadow-sm">
                    <View className="bg-white p-6 rounded-full shadow-sm border border-gray-100">
                        <MapPin color="#94A3B8" size={48} strokeWidth={1.5} />
                    </View>
                    <Text className="font-outfit text-gray-400 mt-4 text-sm">Map View Placeholder</Text>
                </TouchableOpacity>
                <TouchableOpacity
    onPress={() => navigation.navigate('TripSetup')}
    className="bg-blue-600 py-4 rounded-2xl items-center mb-6"
>
    <Text className="text-white text-lg font-outfit-bold">
        Start Trip
    </Text>
</TouchableOpacity>

            </View>

            {/* Bottom Navigation Bar */}
            <View className="flex-row justify-between items-center px-8 py-4 bg-white border-t border-gray-200">
                <TouchableOpacity className="items-center">
                    <Home color="#1E293B" size={28} />
                </TouchableOpacity>
                <TouchableOpacity className="items-center">
                    <Users color="#94A3B8" size={28} />
                </TouchableOpacity>
                <TouchableOpacity
                    className="items-center"
                    onPress={() => navigation.navigate('Alerts')}
                >
                    <AlertCircle color="#94A3B8" size={28} />
                </TouchableOpacity>
                <TouchableOpacity
                    className="items-center"
                    onPress={() => navigation.navigate('Profile')}
                >
                    <User color="#94A3B8" size={28} />
                </TouchableOpacity>
                <TouchableOpacity
                    className="items-center"
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Menu color="#94A3B8" size={28} />
                </TouchableOpacity>
            </View>
        </View>
    );
}
