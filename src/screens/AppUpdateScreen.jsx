import React, { useState } from 'react';
import { 
    View, Text, TouchableOpacity, ScrollView, Switch 
} from 'react-native';
import { 
    ChevronLeft, Sliders, RotateCcw, Activity, Smartphone 
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function AppUpdateScreen() {

    const navigation = useNavigation();

    const [sensitivity, setSensitivity] = useState("Medium");
    const [isLandscape, setIsLandscape] = useState(false);
    const [sensorOk, setSensorOk] = useState(true);

    // 🔧 Calibration
    const handleCalibrate = () => {
        alert("✅ Phone calibrated successfully!");
    };

    // 🔍 Fake sensor check
    const checkSensors = () => {
        setSensorOk(Math.random() > 0.2);
    };

    return (
        <View className="flex-1 bg-white">

            {/* 🔙 HEADER */}
            <View className="flex-row items-center pt-16 pb-4 px-6 border-b">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={26} color="#000" />
                </TouchableOpacity>
                <Text className="text-xl font-bold ml-4">Calibration & Updates</Text>
            </View>

            <ScrollView 
                className="p-6"
                contentContainerStyle={{ paddingBottom: 100 }}
            >

                {/* 🔧 CALIBRATION */}
                <View className="flex-row items-center mb-3">
                    <RotateCcw size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">Manual Calibration</Text>
                </View>

                <TouchableOpacity
                    className="bg-blue-600 py-3 rounded-xl items-center"
                    onPress={handleCalibrate}
                >
                    <Text className="text-white font-bold">Calibrate Now</Text>
                </TouchableOpacity>

                <Text className="text-gray-500 mt-2">
                    Set current phone position as stable reference
                </Text>

                {/* 🎚 SENSITIVITY */}
                <View className="flex-row items-center mt-6 mb-3">
                    <Sliders size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">Sensitivity</Text>
                </View>

                {["Low", "Medium", "High"].map(level => (
                    <TouchableOpacity key={level} onPress={() => setSensitivity(level)}>
                        <Text className={`p-2 ${sensitivity === level ? 'text-blue-600 font-bold' : ''}`}>
                            {level}
                        </Text>
                    </TouchableOpacity>
                ))}

                <Text className="text-gray-500 mt-2">
                    Adjust based on road conditions
                </Text>

                {/* 📱 AXIS */}
                <View className="flex-row items-center mt-6 mb-3">
                    <Smartphone size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">Phone Orientation</Text>
                </View>

                <View className="flex-row justify-between items-center">
                    <Text>Landscape Mode</Text>
                    <Switch value={isLandscape} onValueChange={setIsLandscape} />
                </View>

                {/* 🔍 SENSOR CHECK */}
                <View className="flex-row items-center mt-6 mb-3">
                    <Activity size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">Sensor Health</Text>
                </View>

                <TouchableOpacity
                    className="bg-gray-200 py-3 rounded-xl items-center"
                    onPress={checkSensors}
                >
                    <Text>Check Sensors</Text>
                </TouchableOpacity>

                <Text className={`mt-2 font-bold ${sensorOk ? 'text-green-600' : 'text-red-500'}`}>
                    {sensorOk ? "Sensors Working Properly ✅" : "Sensor Issue Detected ⚠️"}
                </Text>

                {/* 🔄 UPDATES */}
                <View className="mt-8">
                    <Text className="text-lg font-bold mb-3">App Updates</Text>

                    <View className="bg-gray-100 p-4 rounded-xl mb-3">
                        <Text className="font-bold">Algorithm Update</Text>
                        <Text className="text-gray-600">
                            Accident detection improved by 20%
                        </Text>
                    </View>

                    <View className="bg-gray-100 p-4 rounded-xl mb-3">
                        <Text className="font-bold">Blink Pattern Update</Text>
                        <Text className="text-gray-600">
                            New visual alert colors added
                        </Text>
                    </View>

                    <View className="bg-gray-100 p-4 rounded-xl">
                        <Text className="font-bold">Optimization</Text>
                        <Text className="text-gray-600">
                            Battery usage reduced
                        </Text>
                    </View>
                </View>

                {/* ⚠ SPECIAL NOTE */}
                {!sensorOk && (
                    <Text className="text-pink-500 mt-6 font-bold">
                        ⚠ Calibration failed! Please adjust phone position
                    </Text>
                )}

            </ScrollView>
        </View>
    );
}
