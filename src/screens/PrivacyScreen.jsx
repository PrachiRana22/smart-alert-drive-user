import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function PrivacyScreen() {

    const navigation = useNavigation();

    const [locationSharing, setLocationSharing] = useState(false);
    const [dataLogs, setDataLogs] = useState(true);
    const [incognito, setIncognito] = useState(false);

    return (
        <View className="flex-1 bg-white">

            {/* 🔙 HEADER */}
            <View className="flex-row items-center pt-16 pb-4 px-6 border-b">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={26} color="#000" />
                </TouchableOpacity>
                <Text className="text-xl font-bold ml-4">Privacy</Text>
            </View>

            <ScrollView className="p-6">

                {/* LOCATION */}
                <View className="flex-row justify-between items-center mb-6">
                    <Text>Location Sharing</Text>
                    <Switch
                        value={locationSharing}
                        onValueChange={setLocationSharing}
                    />
                </View>

                {/* DATA LOGS */}
                <View className="flex-row justify-between items-center mb-6">
                    <Text>Save Driving Data (30 days)</Text>
                    <Switch
                        value={dataLogs}
                        onValueChange={setDataLogs}
                    />
                </View>

                {/* INCOGNITO */}
                <View className="flex-row justify-between items-center mb-6">
                    <Text>Incognito Drive</Text>
                    <Switch
                        value={incognito}
                        onValueChange={setIncognito}
                    />
                </View>
 
                {/* INFO */}
                {incognito && (
                    <Text className="text-gray-500 mt-4">
                        Incognito active: No trip data will be recorded
                    </Text>
                )}

            </ScrollView>
        </View>
    );
}
