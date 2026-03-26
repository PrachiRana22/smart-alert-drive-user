import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { ChevronLeft, Video, Trash2, Cloud } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function StorageScreen() {

    const navigation = useNavigation();

    // 📹 Dashcam auto delete
    const [autoDelete, setAutoDelete] = useState(true);

    // ☁ Cloud backup
    const [cloudBackup, setCloudBackup] = useState(false);

    // 📊 Fake storage (for UI)
    const [logSize, setLogSize] = useState("120 MB");

    // 🗑 Clear logs
    const clearLogs = () => {
        Alert.alert("Confirm", "Delete all trip logs?", [
            { text: "Cancel" },
            { 
                text: "Delete", 
                onPress: () => setLogSize("0 MB") 
            }
        ]);
    };

    return (
        <View className="flex-1 bg-white">

            {/* 🔙 HEADER */}
            <View className="flex-row items-center pt-16 pb-4 px-6 border-b">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={26} color="#000" />
                </TouchableOpacity>
                <Text className="text-xl font-bold ml-4">Storage</Text>
            </View>

            <ScrollView 
                className="p-6"
                contentContainerStyle={{ paddingBottom: 80 }}
            >

                {/* 📹 DASHCAM */}
                <View className="flex-row items-center mb-3">
                    <Video size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">Dashcam Footage</Text>
                </View>

                <View className="flex-row justify-between items-center">
                    <Text>Auto-delete after 7 days</Text>
                    <Switch value={autoDelete} onValueChange={setAutoDelete} />
                </View>

                <Text className="text-gray-500 mt-2">
                    Old videos will be deleted automatically to save space
                </Text>

                {/* 📊 LOG FILES */}
                <View className="flex-row items-center mt-6 mb-3">
                    <Trash2 size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">Log Files</Text>
                </View>

                <Text className="mb-3">
                    Storage Used: <Text className="font-bold">{logSize}</Text>
                </Text>

                <TouchableOpacity
                    className="bg-red-500 py-3 rounded-xl items-center"
                    onPress={clearLogs}
                >
                    <Text className="text-white font-bold">Clear Logs</Text>
                </TouchableOpacity>

                {/* ☁ CLOUD */}
                <View className="flex-row items-center mt-6 mb-3">
                    <Cloud size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">Cloud Backup</Text>
                </View>

                <View className="flex-row justify-between items-center">
                    <Text>Backup to Cloud</Text>
                    <Switch value={cloudBackup} onValueChange={setCloudBackup} />
                </View>

                <Text className="text-gray-500 mt-2">
                    Save your alert & trip data securely on cloud
                </Text>

            </ScrollView>
        </View>
    );
}
