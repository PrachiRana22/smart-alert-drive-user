import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MailCheck, ArrowLeft } from 'lucide-react-native';

export default function EmailSentConfirmationScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const email = route.params?.email || "your email";
    
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
        if (timeLeft === 0) return;

        const intervalId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timeLeft]);

    const handleResend = () => {
        // Mock resend logic
        setTimeLeft(30);
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingBottom: 40, paddingTop: 64, justifyContent: 'center' }} className="bg-background">
                <View className="w-full max-w-md self-center">
                    <TouchableOpacity
                        className="w-10 h-10 bg-surface rounded-full items-center justify-center shadow-sm mb-8"
                        onPress={() => navigation.goBack()}
                    >
                        <ArrowLeft color="#1E293B" size={24} />
                    </TouchableOpacity>

                    <View className="items-center mb-10">
                        <View className="w-24 h-24 bg-green-50 rounded-full items-center justify-center mb-6">
                            <MailCheck color="#16a34a" size={48} strokeWidth={1.5} />
                        </View>
                        <Text className="text-4xl font-outfit-bold text-secondary mb-2 tracking-tight text-center">Email Sent!</Text>
                        <Text className="text-gray-500 font-outfit text-center px-4 leading-6 text-base">
                            We've sent a password reset link to{'\n'}
                            <Text className="font-outfit-bold text-secondary">{email}</Text>
                        </Text>
                    </View>

                    <View className="space-y-4 mb-10">
                        <TouchableOpacity
                            className={`py-4 rounded-2xl shadow-md ${timeLeft > 0 ? 'bg-gray-300' : 'bg-primary active:scale-95 transition-transform'}`}
                            onPress={handleResend}
                            disabled={timeLeft > 0}
                        >
                            <Text className={`font-outfit-bold text-lg text-center tracking-wide ${timeLeft > 0 ? 'text-gray-500' : 'text-white'}`}>
                                {timeLeft > 0 ? `Resend Link in ${timeLeft}s` : 'Resend Link'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-purple-100 py-4 rounded-2xl border border-purple-200 active:scale-95 transition-transform mt-4"
                            onPress={() => navigation.navigate('ResetPassword')}
                        >
                            <Text className="text-purple-700 font-outfit-bold text-lg text-center tracking-wide">
                                🧪 Testing: Go to Reset Password
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
