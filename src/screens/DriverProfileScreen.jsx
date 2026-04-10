import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { User, Phone, Mail, Truck, AlertCircle } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';

export default function DriverProfileScreen() {

    const { user, trips, vehicles, emergencyContacts } = React.useContext(AuthContext);
    const vehicle = vehicles && vehicles.length > 0 ? vehicles[0] : null;
    const recentTrip = trips?.length > 0 ? trips[0] : user?.recentTrip;
    const isDark = false;

    return (
        <ScrollView className="flex-1 bg-slate-50 px-6 pt-16">

            {/* Title */}
            <Text className="text-2xl font-outfit-bold text-slate-800 mb-6">
                User Profile
            </Text>

            {/* Profile Card */}
            <View className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">

                {/* User Name */}
                <View className="flex-row items-center mb-2">
                    <User color={isDark ? "#60A5FA" : "#2563EB"} size={22} />
                    <Text className="ml-3 font-outfit text-slate-500">
                        User Name
                    </Text>
                </View>

                <Text className="font-outfit-bold text-lg text-slate-800 mb-4">
                    {user?.full_name || user?.username || "Driver"}
                </Text>

                {/* Mobile Number */}
                <View className="flex-row items-center mb-2">
                    <Phone color={isDark ? "#60A5FA" : "#2563EB"} size={22} />
                    <Text className="ml-3 font-outfit text-slate-500">
                        Mobile Number
                    </Text>
                </View>

                <Text className="font-outfit-bold text-slate-800 mb-4">
                    {user?.mobile_number || "Not Added"}
                </Text>

                {/* Emergency Contact */}
                <View className="flex-row items-center mb-2">
                    <AlertCircle color={isDark ? "#60A5FA" : "#2563EB"} size={22} />
                    <Text className="ml-3 font-outfit text-slate-500">
                        Emergency Contact
                    </Text>
                </View>

                <Text className="font-outfit-bold text-slate-800 mb-4">
                    {emergencyContacts && emergencyContacts.length > 0 
                        ? `${emergencyContacts[0].name} (${emergencyContacts[0].phone_number})` 
                        : (user?.emergency_contact || "Not Added")}
                </Text>

                {/* Vehicle Type (Make/Model) */}
                <View className="flex-row items-center mb-2">
                    <Truck color={isDark ? "#60A5FA" : "#2563EB"} size={22} />
                    <Text className="ml-3 font-outfit text-slate-500">
                        Vehicle (Brand & Model)
                    </Text>
                </View>

                <Text className="font-outfit-bold text-slate-800 mb-4">
                    {vehicle ? `${vehicle.make} ${vehicle.model}` : "Not Added"}
                </Text>

                {/* Vehicle Number (License Plate) */}
                <Text className="font-outfit text-slate-500">
                    Vehicle Number
                </Text>

                <Text className="font-outfit-bold text-slate-800 mb-4">
                    {vehicle?.license_plate || "Not Added"}
                </Text>

                {/* License Number */}
                <Text className="font-outfit text-slate-500">
                    License Number
                </Text>

                <Text className="font-outfit-bold text-slate-800 mb-4">
                    {user?.license_number || "Not Added"}
                </Text>

                {/* Email & Profile */}
                <View className="flex-row items-center mt-2 mb-2">
                    <View className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm mr-4">
                        {user?.profile_image ? (
                             <Image 
                                source={{ uri: user.profile_image.startsWith('data:') ? user.profile_image : `data:image/jpeg;base64,${user.profile_image}` }} 
                                className="w-full h-full"
                             />
                        ) : (
                             <View className="w-full h-full items-center justify-center">
                                 <User size={30} color={isDark ? "#475569" : "#CBD5E1"} />
                             </View>
                        )}
                    </View>
                    <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                            <Mail color={isDark ? "#60A5FA" : "#2563EB"} size={18} />
                            <Text className="ml-2 font-outfit text-slate-500">Email</Text>
                        </View>
                        <Text className="font-outfit-bold text-slate-800" numberOfLines={1}>{user?.email || "driver@email.com"}</Text>
                    </View>
                </View>

            </View>


            {/* Trip Info */}

            <View className="mt-8 mb-8">

                <Text className="text-xl font-outfit-bold text-slate-800 mb-4">
                    Recent Trip
                </Text>

                {recentTrip ? (
                    <View className="bg-white rounded-3xl p-6 border border-slate-200">

                        <Text className="font-outfit text-slate-500">
                            Date
                        </Text>
                        <Text className="font-outfit-bold text-slate-800 mb-2">
                            {recentTrip.date || (recentTrip.start_time ? new Date(recentTrip.start_time).toLocaleDateString() : new Date().toLocaleDateString())}
                        </Text>

                        <Text className="font-outfit text-slate-500">
                            Route
                        </Text>
                        <Text className="font-outfit-bold text-slate-800 mb-2 break-words">
                            {recentTrip.route || (recentTrip.start_location && recentTrip.end_location ? `${recentTrip.start_location.split(',')[0]} → ${recentTrip.end_location.split(',')[0]}` : "Recent Route")}
                        </Text>

                        <Text className="font-outfit text-slate-500">
                            Vehicle
                        </Text>
                        <Text className="font-outfit-bold text-slate-800 mb-2">
                            {typeof recentTrip.vehicle === 'string' ? recentTrip.vehicle : (vehicle ? `${vehicle.make} ${vehicle.model}` : "Not Set")}
                        </Text>

                        <Text className="font-outfit text-slate-500">
                            Alerts Triggered
                        </Text>
                        <Text className="font-outfit-bold text-slate-800">
                            {recentTrip.alertsCount || recentTrip.alerts_count || 0} Alert{(recentTrip.alertsCount || recentTrip.alerts_count || 0) !== 1 ? 's' : ''}
                        </Text>

                    </View>
                ) : (
                    <View className="bg-white rounded-3xl p-6 border border-slate-200 items-center">
                        <Text className="font-outfit text-slate-500 text-center">
                            No trips found yet. Start a new trip to see details here!
                        </Text>
                    </View>
                )}

            </View>

        </ScrollView>
    );
}
