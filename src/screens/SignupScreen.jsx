import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, User, ShieldCheck } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';

export default function SignupScreen() {
    const navigation = useNavigation();
    const { signup, isLoading } = React.useContext(AuthContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSignup = async () => {
        if (!name || !email || !password || !confirmPassword) {
            return alert("Please fill out all fields.");
        }
        if (password !== confirmPassword) {
            return alert("Passwords do not match.");
        }

        try {
            await signup(name, email, password);
            alert("Account created successfully! Please log in.");
            navigation.navigate('Login');
        } catch (error) {
            alert(error);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <View className="flex-1 px-8 justify-center min-h-screen pb-10 pt-16">
                    {/* Header */}
                    <View className="items-center mb-10">
                        <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6">
                            <ShieldCheck color="#2563EB" size={40} strokeWidth={1.5} />
                        </View>
                        <Text className="text-4xl font-outfit-bold text-secondary mb-2 tracking-tight">Create Account</Text>
                        <Text className="text-gray-500 font-outfit text-center px-4 leading-6">
                            Join Smart Drive Alert and start monitoring your driving safety today.
                        </Text>
                    </View>

                    {/* Input Fields */}
                    <View className="space-y-4 mb-8">
                        <View className="flex-row items-center border border-gray-200 bg-surface rounded-2xl px-4 py-3 shadow-sm">
                            <User color="#94A3B8" size={20} className="mr-3" />
                            <TextInput
                                className="flex-1 font-outfit text-base text-secondary py-0"
                                placeholder="Full Name"
                                placeholderTextColor="#94A3B8"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

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

                        <View className="flex-row items-center border border-gray-200 bg-surface rounded-2xl px-4 py-3 shadow-sm">
                            <Lock color="#94A3B8" size={20} className="mr-3" />
                            <TextInput
                                className="flex-1 font-outfit text-base text-secondary py-0"
                                placeholder="Password"
                                placeholderTextColor="#94A3B8"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <View className="flex-row items-center border border-gray-200 bg-surface rounded-2xl px-4 py-3 shadow-sm">
                            <Lock color="#94A3B8" size={20} className="mr-3" />
                            <TextInput
                                className="flex-1 font-outfit text-base text-secondary py-0"
                                placeholder="Confirm Password"
                                placeholderTextColor="#94A3B8"
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
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
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
