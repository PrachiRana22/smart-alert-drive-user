import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Settings, MapPin, Home, Users, AlertCircle, User, Menu } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
    const { user, logout } = React.useContext(AuthContext);
    const [currentDate, setCurrentDate] = React.useState('');

    React.useEffect(() => {
        const date = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        setCurrentDate(`${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`);
    }, []);

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

                {/* Dynamic Date */}
                <Text className="text-lg font-outfit-bold text-secondary">
                    {currentDate}
                </Text>

                {/* Profile + Settings */}
                <View className="flex-row items-center space-x-4">

                    <TouchableOpacity
                        onPress={() => navigation.navigate('DriverProfile')}
                    >
                        <User color="#1E293B" size={27} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <Settings color="#1E293B" size={27} />
                    </TouchableOpacity>

                </View>
            </View>

            {/* Welcome */}
            <View className="px-6">
                <Text className="text-2xl font-outfit-bold text-secondary">
                    Welcome, {user.name}
                </Text>
            </View>

            {/* Main Content Area */}
            <View className="flex-1 px-6 pt-6">

                {/* Driver Info Card */}
                <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-6">

                    <Text className="font-outfit text-gray-500">
                        User Name
                    </Text>
                    <Text className="font-outfit-bold text-lg text-secondary mb-2">
                        {user.name}
                    </Text>

                    <Text className="font-outfit text-gray-500">
                        {user.vehicleType}
                    </Text>
                    <Text className="font-outfit-bold text-secondary mb-2">
                        {user.vehicleType}
                    </Text>

                    <Text className="font-outfit text-gray-500">
                        Vehicle Number
                    </Text>
                    <Text className="font-outfit-bold text-secondary">
                        {user.vehicleNumber}
                    </Text>

                </View>

                <Text className="text-xl font-outfit-bold text-secondary mb-4">
                    Where to Today !
                </Text>

                {/* Map Placeholder */}
                <TouchableOpacity className="flex-1 bg-gray-50 rounded-3xl border border-gray-200 items-center justify-center mb-8 shadow-sm">

                    <View className="bg-white p-6 rounded-full shadow-sm border border-gray-100">
                        <MapPin color="#94A3B8" size={48} strokeWidth={1.5} />
                    </View>

                    <Text className="font-outfit text-gray-400 mt-4 text-sm">
                        Map View Placeholder
                    </Text>

                </TouchableOpacity>

                {/* Start Trip Button (Same Working) */}
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
