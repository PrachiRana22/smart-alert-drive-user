import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Lock, ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react-native';

export default function ResetPasswordScreen() {
    const navigation = useNavigation();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const hasMinLength = password.length >= 6;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    const rulesMetCount = [hasMinLength, hasUppercase, hasNumber, hasSpecialChar].filter(Boolean).length;
    const isPasswordValid = rulesMetCount === 4;
    const passwordsMatch = password.length > 0 && password === confirmPassword;

    const getStrengthColor = () => {
        if (password.length === 0) return 'bg-gray-200';
        if (rulesMetCount <= 1) return 'bg-red-500';
        if (rulesMetCount <= 3) return 'bg-orange-500';
        return 'bg-green-500';
    };
    
    const getStrengthText = () => {
        if (password.length === 0) return '';
        if (rulesMetCount <= 1) return 'Weak';
        if (rulesMetCount <= 3) return 'Fair';
        return 'Strong';
    };

    const handleReset = () => {
        if (!isPasswordValid || !passwordsMatch) return;
        
        // Mock successful password reset.
        alert("Password updated successfully!");
        navigation.navigate('Login');
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingBottom: 40, paddingTop: 64, justifyContent: 'center' }} className="bg-background" keyboardShouldPersistTaps="handled">
                <View className="w-full max-w-md self-center">
                    <TouchableOpacity
                        className="w-10 h-10 bg-surface rounded-full items-center justify-center shadow-sm mb-6"
                        onPress={() => navigation.goBack()}
                    >
                        <ArrowLeft color="#1E293B" size={24} />
                    </TouchableOpacity>

                    <View className="items-center mb-8">
                        <Text className="text-4xl font-outfit-bold text-secondary mb-2 tracking-tight text-center">New Password</Text>
                        <Text className="text-gray-500 font-outfit text-center px-4 leading-6">
                            Your new password must be different from previously used passwords.
                        </Text>
                    </View>

                    <View className="space-y-4 mb-8">
                        <View className="flex-col">
                            <View className="flex-row items-center bg-white border border-gray-100 rounded-[28px] px-5 py-4 shadow-sm shadow-gray-200">
                                <View className="bg-primary/10 p-2.5 rounded-2xl mr-4">
                                    <Lock color="#2563EB" size={22} />
                                </View>
                                <TextInput
                                    className="flex-1 font-outfit text-base text-secondary py-1"
                                    placeholder="New Password"
                                    placeholderTextColor="#94A3B8"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                                    {showPassword ? <EyeOff color="#94A3B8" size={22} /> : <Eye color="#94A3B8" size={22} />}
                                </TouchableOpacity>
                            </View>

                            {/* Password Strength Meter */}
                            {password.length > 0 && (
                                <View className="px-4 mt-3 mb-1 flex-row items-center justify-between">
                                    <View className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden mr-3">
                                        <View className={`h-full ${getStrengthColor()}`} style={{ width: `${(rulesMetCount / 4) * 100}%` }} />
                                    </View>
                                    <Text className={`text-xs font-outfit-bold ${getStrengthColor().replace('bg-', 'text-')}`}>
                                        {getStrengthText()}
                                    </Text>
                                </View>
                            )}

                            {/* Live Checklist */}
                            {password.length > 0 && (
                                <View className="px-4 mt-2">
                                    <View className="flex-row items-center mb-1">
                                        {hasMinLength ? <Check size={16} color="#16a34a" /> : <X size={16} color="#dc2626" />}
                                        <Text className={`ml-2 text-sm font-outfit ${hasMinLength ? 'text-green-600' : 'text-red-600'}`}>6+ characters</Text>
                                    </View>
                                    <View className="flex-row items-center mb-1">
                                        {hasUppercase ? <Check size={16} color="#16a34a" /> : <X size={16} color="#dc2626" />}
                                        <Text className={`ml-2 text-sm font-outfit ${hasUppercase ? 'text-green-600' : 'text-red-600'}`}>uppercase</Text>
                                    </View>
                                    <View className="flex-row items-center mb-1">
                                        {hasNumber ? <Check size={16} color="#16a34a" /> : <X size={16} color="#dc2626" />}
                                        <Text className={`ml-2 text-sm font-outfit ${hasNumber ? 'text-green-600' : 'text-red-600'}`}>number</Text>
                                    </View>
                                    <View className="flex-row items-center mb-2">
                                        {hasSpecialChar ? <Check size={16} color="#16a34a" /> : <X size={16} color="#dc2626" />}
                                        <Text className={`ml-2 text-sm font-outfit ${hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>special character</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        <View className="mt-2">
                            <View className="flex-row items-center bg-white border border-gray-100 rounded-[28px] px-5 py-4 shadow-sm shadow-gray-200">
                                <View className="bg-primary/10 p-2.5 rounded-2xl mr-4">
                                    <Lock color="#2563EB" size={22} />
                                </View>
                                <TextInput
                                    className="flex-1 font-outfit text-base text-secondary py-1"
                                    placeholder="Confirm Password"
                                    placeholderTextColor="#94A3B8"
                                    secureTextEntry={!showConfirmPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="p-1">
                                    {showConfirmPassword ? <EyeOff color="#94A3B8" size={22} /> : <Eye color="#94A3B8" size={22} />}
                                </TouchableOpacity>
                            </View>

                            {/* Match Validation */}
                            {confirmPassword.length > 0 && (
                                <View className="px-4 mt-2">
                                    <View className="flex-row items-center">
                                        {passwordsMatch ? <Check size={16} color="#16a34a" /> : <X size={16} color="#dc2626" />}
                                        <Text className={`ml-2 text-sm font-outfit-bold ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                                            {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                    </View>

                    <TouchableOpacity
                        className={`bg-primary py-4 rounded-2xl shadow-md min-h-[56px] justify-center mt-4 ${(!isPasswordValid || !passwordsMatch) ? 'opacity-50' : 'active:scale-95 transition-transform'}`}
                        onPress={handleReset}
                        disabled={!isPasswordValid || !passwordsMatch}
                    >
                        <Text className="text-white font-outfit-bold text-lg text-center tracking-wide">
                            Reset Password
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
