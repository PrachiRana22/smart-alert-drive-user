import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { User, Phone, Mail, Truck, AlertCircle } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { AuthContext } from '../context/AuthContext';

export default function DriverProfileScreen() {

    const { user, trips } = React.useContext(AuthContext);
    const recentTrip = trips?.length > 0 ? trips[trips.length - 1] : user?.recentTrip;
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-900 px-6 pt-16">

            {/* Title */}
            <Text className="text-2xl font-outfit-bold text-slate-800 dark:text-white mb-6">
                User Profile
            </Text>

            {/* Profile Card */}
            <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">

                {/* User Name */}
                <View className="flex-row items-center mb-2">
                    <User color={isDark ? "#60A5FA" : "#2563EB"} size={22} />
                    <Text className="ml-3 font-outfit text-slate-500 dark:text-slate-400">
                        User Name
                    </Text>
                </View>

                <Text className="font-outfit-bold text-lg text-slate-800 dark:text-white mb-4">
                    {user?.name || "Driver"}
                </Text>

                {/* Mobile Number */}
                <View className="flex-row items-center mb-2">
                    <Phone color={isDark ? "#60A5FA" : "#2563EB"} size={22} />
                    <Text className="ml-3 font-outfit text-slate-500 dark:text-slate-400">
                        Mobile Number
                    </Text>
                </View>

                <Text className="font-outfit-bold text-slate-800 dark:text-white mb-4">
                    {user?.mobile || "Not Added"}
                </Text>

                {/* Emergency Contact */}
                <View className="flex-row items-center mb-2">
                    <AlertCircle color={isDark ? "#60A5FA" : "#2563EB"} size={22} />
                    <Text className="ml-3 font-outfit text-slate-500 dark:text-slate-400">
                        Emergency Contact
                    </Text>
                </View>

                <Text className="font-outfit-bold text-slate-800 dark:text-white mb-4">
                    {user?.emergency || "Not Added"}
                </Text>

                {/* Vehicle Type */}
                <View className="flex-row items-center mb-2">
                    <Truck color={isDark ? "#60A5FA" : "#2563EB"} size={22} />
                    <Text className="ml-3 font-outfit text-slate-500 dark:text-slate-400">
                        Vehicle Type
                    </Text>
                </View>

                <Text className="font-outfit-bold text-slate-800 dark:text-white mb-4">
                    {user?.vehicleType || "Not Added"}
                </Text>

                {/* Vehicle Number */}
                <Text className="font-outfit text-slate-500 dark:text-slate-400">
                    Vehicle Number
                </Text>

                <Text className="font-outfit-bold text-slate-800 dark:text-white mb-4">
                    {user?.vehicleNumber || "Not Added"}
                </Text>

                {/* License Number */}
                <Text className="font-outfit text-slate-500 dark:text-slate-400">
                    License Number
                </Text>

                <Text className="font-outfit-bold text-slate-800 dark:text-white mb-4">
                    {user?.licenseNumber || "Not Added"}
                </Text>

                {/* Email */}
                <View className="flex-row items-center mb-2">
                    <Mail color={isDark ? "#60A5FA" : "#2563EB"} size={22} />
                    <Text className="ml-3 font-outfit text-slate-500 dark:text-slate-400">
                        Email
                    </Text>
                </View>

                <Text className="font-outfit-bold text-slate-800 dark:text-white">
                    {user?.email || "driver@email.com"}
                </Text>

            </View>


            {/* Trip Info */}

            <View className="mt-8 mb-8">

                <Text className="text-xl font-outfit-bold text-slate-800 dark:text-white mb-4">
                    Recent Trip
                </Text>

                {recentTrip ? (
                    <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700">

                        <Text className="font-outfit text-slate-500 dark:text-slate-400">
                            Date
                        </Text>
                        <Text className="font-outfit-bold text-slate-800 dark:text-white mb-2">
                            {recentTrip.date || new Date().toLocaleDateString()}
                        </Text>

                        <Text className="font-outfit text-slate-500 dark:text-slate-400">
                            Route
                        </Text>
                        <Text className="font-outfit-bold text-slate-800 dark:text-white mb-2 break-words">
                            {recentTrip.route || "Recent Route"}
                        </Text>

                        <Text className="font-outfit text-slate-500 dark:text-slate-400">
                            Vehicle
                        </Text>
                        <Text className="font-outfit-bold text-slate-800 dark:text-white mb-2">
                            {recentTrip.vehicle || user?.vehicleType || "Not Set"}
                        </Text>

                        <Text className="font-outfit text-slate-500 dark:text-slate-400">
                            Alerts Triggered
                        </Text>
                        <Text className="font-outfit-bold text-slate-800 dark:text-white">
                            {recentTrip.alertsCount || 0} Alert{(recentTrip.alertsCount || 0) !== 1 ? 's' : ''}
                        </Text>

                    </View>
                ) : (
                    <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 items-center">
                        <Text className="font-outfit text-slate-500 dark:text-slate-400 text-center">
                            No trips found yet. Start a new trip to see details here!
                        </Text>
                    </View>
                )}

            </View>

        </ScrollView>
    );
}
