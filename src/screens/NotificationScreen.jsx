import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { 
    ChevronLeft, Volume2, Mic, Eye, Sun, Moon, 
    Zap, Vibrate, Timer, Layers 
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function NotificationScreen() {

    const navigation = useNavigation();

    const [alertIntensity, setAlertIntensity] = useState("Medium");
    const [voiceAlert, setVoiceAlert] = useState(false);
    const [blinkSpeed, setBlinkSpeed] = useState("Medium");
    const [fullFlash, setFullFlash] = useState(false);
    const [autoBrightness, setAutoBrightness] = useState(true);
    const [nightMode, setNightMode] = useState(true);
    const [flashlight, setFlashlight] = useState(false);
    const [vibration, setVibration] = useState(true);
    const [manualDismiss, setManualDismiss] = useState(true);

    return (
        <View className="flex-1 bg-white">

            {/* 🔙 HEADER */}
            <View className="flex-row items-center pt-16 pb-4 px-6 border-b">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={26} color="#000" />
                </TouchableOpacity>
                <Text className="text-xl font-bold ml-4">Notifications</Text>
            </View>

            <ScrollView className="p-6"  contentContainerStyle={{ paddingBottom: 80 }}
    showsVerticalScrollIndicator={false}>

                {/* 🔊 ALERT SOUND */}
                <View className="flex-row items-center mb-3">
                    <Volume2 size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">Alert Sound</Text>
                </View>

                {["Low", "Medium", "High"].map(level => (
                    <TouchableOpacity key={level} onPress={() => setAlertIntensity(level)}>
                        <Text className={`p-2 ${alertIntensity === level ? 'text-blue-600 font-bold' : ''}`}>
                            {level}
                        </Text>
                    </TouchableOpacity>
                ))}

                <View className="flex-row justify-between items-center mt-4">
                    <View className="flex-row items-center">
                        <Mic size={18} color="#64748B" />
                        <Text className="ml-2">Voice Alerts</Text>
                    </View>
                    <Switch value={voiceAlert} onValueChange={setVoiceAlert} />
                </View>

                {/* 👁 VISUAL */}
                <View className="flex-row items-center mt-6 mb-3">
                    <Eye size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">Visual Alerts</Text>
                </View>

                {["Slow", "Medium", "Fast"].map(speed => (
                    <TouchableOpacity key={speed} onPress={() => setBlinkSpeed(speed)}>
                        <Text className={`p-2 ${blinkSpeed === speed ? 'text-blue-600 font-bold' : ''}`}>
                            Blink: {speed}
                        </Text>
                    </TouchableOpacity>
                ))}

                <View className="flex-row justify-between items-center mt-4">
                    <View className="flex-row items-center">
                        <Zap size={18} color="#64748B" />
                        <Text className="ml-2">Full Screen Flash</Text>
                    </View>
                    <Switch value={fullFlash} onValueChange={setFullFlash} />
                </View>

                {/* 🌙 BRIGHTNESS */}
                <View className="flex-row items-center mt-6 mb-3">
                    <Sun size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">Brightness</Text>
                </View>

                <View className="flex-row justify-between items-center">
                    <Text>Auto Brightness</Text>
                    <Switch value={autoBrightness} onValueChange={setAutoBrightness} />
                </View>

                <View className="flex-row justify-between items-center mt-4">
                    <View className="flex-row items-center">
                        <Moon size={18} color="#64748B" />
                        <Text className="ml-2">Night Mode</Text>
                    </View>
                    <Switch value={nightMode} onValueChange={setNightMode} />
                </View>

                {/* 📳 HARDWARE */}
                <View className="flex-row items-center mt-6 mb-3">
                    <Layers size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">Hardware</Text>
                </View>

                <View className="flex-row justify-between items-center">
                    <Text>Flashlight Alert</Text>
                    <Switch value={flashlight} onValueChange={setFlashlight} />
                </View>

                <View className="flex-row justify-between items-center mt-4">
                    <View className="flex-row items-center">
                        <Vibrate size={18} color="#64748B" />
                        <Text className="ml-2">Vibration</Text>
                    </View>
                    <Switch value={vibration} onValueChange={setVibration} />
                </View>

                {/* ⏱ ALERT */}
                <View className="flex-row items-center mt-6 mb-3">
                    <Timer size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">Alert Duration</Text>
                </View>

                <View className="flex-row justify-between items-center">
                    <Text>Manual Dismiss</Text>
                    <Switch value={manualDismiss} onValueChange={setManualDismiss} />
                </View>

                {!manualDismiss && (
                    <Text className="text-gray-500 mt-2">
                        Auto close after few seconds
                    </Text>
                )}

            </ScrollView>
        </View>
    );
}
