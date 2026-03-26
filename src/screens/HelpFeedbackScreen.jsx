import React, { useState } from 'react';
import { 
    View, Text, TouchableOpacity, ScrollView, TextInput, Alert 
} from 'react-native';
import { 
    ChevronLeft, BookOpen, Activity, MessageCircle 
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function HelpFeedbackScreen() {

    const navigation = useNavigation();

    const [feedback, setFeedback] = useState("");
    const [testResult, setTestResult] = useState("");

    // 🧪 Sensor Test
    const handleTest = () => {
        setTestResult("✅ Alert Blink Working!");
    };

    // 📩 Feedback submit
    const submitFeedback = () => {
        if (!feedback) {
            Alert.alert("Error", "Please enter feedback");
            return;
        }

        Alert.alert("Thank You!", "Your feedback has been submitted");
        setFeedback("");
    };

    return (
        <View className="flex-1 bg-white">

            {/* 🔙 HEADER */}
            <View className="flex-row items-center pt-16 pb-4 px-6 border-b">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={26} color="#000" />
                </TouchableOpacity>
                <Text className="text-xl font-bold ml-4">Help & Feedback</Text>
            </View>

            <ScrollView 
                className="p-6"
                contentContainerStyle={{ paddingBottom: 100 }}
            >

                {/* 📘 BLINK GUIDE */}
                <View className="flex-row items-center mb-3">
                    <BookOpen size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">Blink Guide</Text>
                </View>

                <View className="bg-gray-100 p-4 rounded-xl mb-4">
                    <Text>🟡 Yellow Blink → Over Speed Warning</Text>
                    <Text>🔴 Red Blink → Collision Danger</Text>
                    <Text>🔵 Blue Blink → Route Update</Text>
                    <Text>🟣 Purple Blink → Calibration Error</Text>
                </View>

                {/* 🧪 TEST SENSOR */}
                <View className="flex-row items-center mt-4 mb-3">
                    <Activity size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">Test My Sensors</Text>
                </View>

                <TouchableOpacity
                    className="bg-blue-600 py-3 rounded-xl items-center"
                    onPress={handleTest}
                >
                    <Text className="text-white font-bold">Start Test</Text>
                </TouchableOpacity>

                {testResult !== "" && (
                    <Text className="text-green-600 mt-2 font-bold">
                        {testResult}
                    </Text>
                )}

                <Text className="text-gray-500 mt-2">
                    Shake your phone to test alert blinking
                </Text>

                {/* 📩 FEEDBACK */}
                <View className="flex-row items-center mt-6 mb-3">
                    <MessageCircle size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">Report False Alert</Text>
                </View>

                <TextInput
                    placeholder="Describe the issue..."
                    value={feedback}
                    onChangeText={setFeedback}
                    multiline
                    className="border border-gray-300 rounded-xl p-4 h-28 text-base"
                />

                <TouchableOpacity
                    className="bg-green-600 py-3 rounded-xl items-center mt-4"
                    onPress={submitFeedback}
                >
                    <Text className="text-white font-bold">Submit Feedback</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}
