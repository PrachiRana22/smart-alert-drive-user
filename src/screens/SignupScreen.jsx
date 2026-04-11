import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, User, ShieldCheck, Eye, EyeOff, Check, X } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';

export default function SignupScreen() {
    const navigation = useNavigation();
    const { signup, isLoading } = React.useContext(AuthContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validateEmail = (email) => {
        const re = /\S+@\S+\.\S+/;
        return re.test(email);
    };

    const hasMinLength = password.length >= 6;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    const handleSignup = async () => {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedName = name.trim();

        if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
            return alert("Please fill out all fields.");
        }
        if (!validateEmail(trimmedEmail)) {
            return alert("Please enter a valid email address.");
        }
        if (!hasMinLength || !hasUppercase || !hasNumber || !hasSpecialChar) {
            return alert("Please ensure your password meets all requirements.");
        }
        if (password !== confirmPassword) {
            return alert("Passwords do not match.");
        }

        try {
            await signup(trimmedName, trimmedEmail, password);
            // No need to navigate here, the AppNavigator will see the 'user' state change 
            // and automatically switch to the Home screen (AppStack).
        } catch (error) {
            const message = typeof error === 'object' ? JSON.stringify(error) : error;
            alert(message);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView 
                contentContainerStyle={{ 
                    flexGrow: 1, 
                    paddingHorizontal: 32, 
                    paddingBottom: 60, 
                }} 
                keyboardShouldPersistTaps="handled"
                className="bg-background"
            >
                <View style={{ flex: 1, justifyContent: 'center', paddingTop: 64 }}>
                <View className="w-full max-w-md self-center">
                    {/* Header */}
                    <View className="items-center mb-10">
                        <View className="mb-6 shadow-md">
                            <Image 
                                source={require('../../assets/App_Inside_Logo.jpeg')} 
                                className="w-32 h-32 rounded-3xl"
                                resizeMode="contain"
                            />
                        </View>
                        <Text className="text-4xl font-outfit-bold text-secondary mb-2 tracking-tight">Create Account</Text>
                        <Text className="text-gray-500 font-outfit text-center px-4 leading-6">
                            Join Smart Drive Alert and start monitoring your driving safety today.
                        </Text>
                    </View>

                    {/* Input Fields */}
                    <View className="space-y-4 mb-8">
                        <View className="flex-row items-center bg-white border border-gray-100 rounded-[28px] px-5 py-4 shadow-sm shadow-gray-200">
                            <View className="bg-primary/10 p-2.5 rounded-2xl mr-4">
                                <User color="#2563EB" size={22} />
                            </View>
                            <TextInput
                                className="flex-1 font-outfit text-base text-secondary py-1"
                                placeholder="Full Name"
                                placeholderTextColor="#94A3B8"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View className="flex-row items-center bg-white border border-gray-100 rounded-[28px] px-5 py-4 shadow-sm shadow-gray-200">
                            <View className="bg-primary/10 p-2.5 rounded-2xl mr-4">
                                <Mail color="#2563EB" size={22} />
                            </View>
                            <TextInput
                                className="flex-1 font-outfit text-base text-secondary py-1"
                                placeholder="Email Address"
                                placeholderTextColor="#94A3B8"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View className="flex-col">
                            <View className="flex-row items-center bg-white border border-gray-100 rounded-[28px] px-5 py-4 shadow-sm shadow-gray-200">
                                <View className="bg-primary/10 p-2.5 rounded-2xl mr-4">
                                    <Lock color="#2563EB" size={22} />
                                </View>
                                <TextInput
                                    className="flex-1 font-outfit text-base text-secondary py-1"
                                    placeholder="Password"
                                    placeholderTextColor="#94A3B8"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                                    {showPassword ? <EyeOff color="#94A3B8" size={22} /> : <Eye color="#94A3B8" size={22} />}
                                </TouchableOpacity>
                            </View>

                            {/* Password Validation Checklist */}
                            {password.length > 0 && (
                                <View className="px-4 mt-3 mb-2">
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
                                    <View className="flex-row items-center">
                                        {hasSpecialChar ? <Check size={16} color="#16a34a" /> : <X size={16} color="#dc2626" />}
                                        <Text className={`ml-2 text-sm font-outfit ${hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>special character</Text>
                                    </View>
                                </View>
                            )}
                        </View>

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
                    </View>

                    {/* Action Buttons */}
                    <TouchableOpacity
                        className={`bg-primary py-4 rounded-2xl shadow-md shadow-primary/30 active:scale-95 transition-transform ${isLoading ? 'opacity-70' : ''}`}
                        onPress={handleSignup}
                        disabled={isLoading}
                    >
                        <Text className="text-white font-outfit-bold text-lg text-center tracking-wide">
                            {isLoading ? 'Creating Account...' : 'Sign Up'}
                        </Text>
                    </TouchableOpacity>

                    {/* Footer link */}
                    <View className="flex-row justify-center mt-8">
                        <Text className="text-gray-500 font-outfit text-base">Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text className="text-primary font-outfit-bold text-base">Sign In</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* Spacer for scroll room when keyboard is open */}
                    <View style={{ height: 100 }} />
                </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
