import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { User, Phone, Mail, Truck, AlertCircle } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';

export default function DriverProfileScreen() {

    const { user } = React.useContext(AuthContext);

    return (

        <ScrollView className="flex-1 bg-surface px-6 pt-16">

            {/* Title */}
            <Text className="text-2xl font-outfit-bold text-secondary mb-6">
                User Profile
            </Text>

            {/* Profile Card */}
            <View className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">

                {/* Driver Name */}
                <View className="flex-row items-center mb-2">
                    <User color="#2563EB" size={22} />
                    <Text className="ml-3 font-outfit text-gray-500">
                        User Name
                    </Text>
                </View>

                <Text className="font-outfit-bold text-lg text-secondary mb-4">
                    {user?.name || "Driver"}
                </Text>

                {/* Mobile Number */}
                <View className="flex-row items-center mb-2">
                    <Phone color="#2563EB" size={22} />
                    <Text className="ml-3 font-outfit text-gray-500">
                        Mobile Number
                    </Text>
                </View>

                <Text className="font-outfit-bold text-secondary mb-4">
                    {user?.mobile || "Not Added"}
                </Text>

                {/* Emergency Contact */}
                <View className="flex-row items-center mb-2">
                    <AlertCircle color="#2563EB" size={22} />
                    <Text className="ml-3 font-outfit text-gray-500">
                        Emergency Contact
                    </Text>
                </View>

                <Text className="font-outfit-bold text-secondary mb-4">
                    {user?.emergency || "Not Added"}
                </Text>

                {/* Vehicle Type */}
                <View className="flex-row items-center mb-2">
                    <Truck color="#2563EB" size={22} />
                    <Text className="ml-3 font-outfit text-gray-500">
                        Vehicle Type
                    </Text>
                </View>

                <Text className="font-outfit-bold text-secondary mb-4">
                    {user?.vehicleType || "Not Added"}
                </Text>

                {/* Vehicle Number */}
                <Text className="font-outfit text-gray-500">
                    Vehicle Number
                </Text>

                <Text className="font-outfit-bold text-secondary mb-4">
                    {user?.vehicleNumber || "Not Added"}
                </Text>

                {/* License Number */}
                <Text className="font-outfit text-gray-500">
                    License Number
                </Text>

                <Text className="font-outfit-bold text-secondary mb-4">
                    {user?.licenseNumber || "Not Added"}
                </Text>

                {/* Email */}
                <View className="flex-row items-center mb-2">
                    <Mail color="#2563EB" size={22} />
                    <Text className="ml-3 font-outfit text-gray-500">
                        Email
                    </Text>
                </View>

                <Text className="font-outfit-bold text-secondary">
                    {user?.email || "driver@email.com"}
                </Text>

            </View>


            {/* Trip Info */}

            <View className="mt-8 mb-8">

                <Text className="text-xl font-outfit-bold text-secondary mb-4">
                    Recent Trip
                </Text>

                {user?.recentTrip ? (
                    <View className="bg-white rounded-3xl p-6 border border-gray-200">

                        <Text className="font-outfit text-gray-500">
                            Date
                        </Text>
                        <Text className="font-outfit-bold mb-2">
                            {user.recentTrip.date}
                        </Text>

                        <Text className="font-outfit text-gray-500">
                            Route
                        </Text>
                        <Text className="font-outfit-bold mb-2 break-words">
                            {user.recentTrip.route}
                        </Text>

                        <Text className="font-outfit text-gray-500">
                            Vehicle
                        </Text>
                        <Text className="font-outfit-bold mb-2">
                            {user.recentTrip.vehicle}
                        </Text>

                        <Text className="font-outfit text-gray-500">
                            Alerts Triggered
                        </Text>
                        <Text className="font-outfit-bold">
                            {user.recentTrip.alertsCount} Alert{user.recentTrip.alertsCount !== 1 ? 's' : ''}
                        </Text>

                    </View>
                ) : (
                    <View className="bg-white rounded-3xl p-6 border border-gray-200 items-center">
                        <Text className="font-outfit text-gray-500 text-center">
                            No trips found yet. Start a new trip to see details here!
                        </Text>
                    </View>
                )}

            </View>

        </ScrollView>
    );
}
