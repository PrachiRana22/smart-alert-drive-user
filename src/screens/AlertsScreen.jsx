import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, MapPin, CornerUpRight, CornerUpLeft } from 'lucide-react-native';

export default function AlertsScreen() {
    const navigation = useNavigation();

    return (
        <SafeAreaView className="flex-1 bg-surface">
            {/* Header */}
            <View className="flex-row items-center pt-4 pb-2 px-6 bg-surface z-10 w-full mb-4">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full bg-gray-50">
                    <ChevronLeft color="#1E293B" size={24} />
                </TouchableOpacity>
                <View className="flex-1 items-center pr-6">
                    <Text className="text-xl font-outfit-bold text-secondary">Active Alert</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 pb-6" showsVerticalScrollIndicator={false}>
                {/* Alert Card / Speech Bubble */}
                <View className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm relative mb-6">
                    <Text className="font-outfit-bold text-secondary text-lg mb-2">Smart Alert Drive</Text>
                    <Text className="font-outfit text-gray-600 text-base leading-6 mb-4">
                        "Slow down! Truck approaching from the opposite direction"
                    </Text>

                    <View className="flex-row items-center">
                        <MapPin color="#64748B" size={18} className="mr-2" />
                        <Text className="font-outfit-medium text-gray-500">Vapi, Gujarat</Text>
                    </View>

                    {/* Speech bubble tail effect */}
                    <View className="absolute -bottom-3 right-8 w-6 h-6 bg-white border-b border-r border-gray-200 transform rotate-45" />
                </View>

                {/* Main Media/Map Placeholder */}
                <View className="w-full h-80 bg-gray-400 rounded-3xl mb-8 shadow-sm justify-center items-center overflow-hidden">
                    {/* Dark gray box representing map/camera feed */}
                    <Text className="font-outfit-medium text-white/50 text-lg">Camera / Map Feed</Text>
                </View>

                {/* Navigation Instructions */}
                <View className="space-y-4 px-2">
                    <View className="flex-row items-center">
                        <CornerUpRight color="#1E293B" size={28} strokeWidth={2.5} className="mr-4" />
                        <Text className="font-outfit-bold text-secondary text-2xl">Turn Right</Text>
                    </View>

                    <View className="flex-row items-center">
                        <CornerUpLeft color="#1E293B" size={28} strokeWidth={2.5} className="mr-4" />
                        <Text className="font-outfit-bold text-secondary text-2xl">Turn Left</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
