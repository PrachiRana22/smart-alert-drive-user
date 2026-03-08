import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mail, KeyRound, ArrowLeft } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');

    const handleResetPassword = () => {
        // Implement password reset logic here later
        alert("Password reset link sent to " + email);
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background"
        >
            <View className="flex-1 px-8 pt-16">
                {/* Back Button */}
                <TouchableOpacity
                    className="w-10 h-10 bg-surface rounded-full items-center justify-center shadow-sm mb-8"
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft color="#1E293B" size={24} />
                </TouchableOpacity>

                {/* Header */}
                <View className="items-center mb-10">
                    <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6">
                        <KeyRound color="#2563EB" size={40} strokeWidth={1.5} />
                    </View>
                    <Text className="text-4xl font-outfit-bold text-secondary mb-2 tracking-tight text-center">Reset Password</Text>
                    <Text className="text-gray-500 font-outfit text-center px-4 leading-6">
                        Enter your email address and we'll send you a link to reset your password.
                    </Text>
                </View>

                {/* Input Fields */}
                <View className="space-y-4 mb-8">
                    <View className="flex-row items-center border border-gray-200 bg-surface rounded-2xl px-4 py-3 shadow-sm">
                        <Mail color="#94A3B8" size={20} className="mr-3" />
                        <TextInput
                            className="flex-1 font-outfit text-base text-secondary py-0"
                            placeholder="Email Address"
                            placeholderTextColor="#94A3B8"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>
                </View>

                {/* Action Buttons */}
                <TouchableOpacity
                    className="bg-primary py-4 rounded-2xl shadow-md shadow-primary/30 active:scale-95 transition-transform"
                    onPress={handleResetPassword}
                >
                    <Text className="text-white font-outfit-bold text-lg text-center tracking-wide">
                        Send Reset Link
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
