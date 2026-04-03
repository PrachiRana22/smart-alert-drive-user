import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, User, ShieldCheck, Eye, EyeOff } from 'lucide-react-native';
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

    const handleSignup = async () => {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedName = name.trim();

        if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
            return alert("Please fill out all fields.");
        }
        if (!validateEmail(trimmedEmail)) {
            return alert("Please enter a valid email address.");
        }
        if (password.length < 6) {
            return alert("Password must be at least 6 characters long.");
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
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView 
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingBottom: 40, paddingTop: 64, justifyContent: 'center' }} 
                keyboardShouldPersistTaps="handled"
                className="bg-background"
            >
                <View className="w-full max-w-md self-center">
                    {/* Header */}
                    <View className="items-center mb-10">
                        <View className="mb-6 shadow-sm">
                            <Image 
                                source={require('../../assets/App_Inside_Logo.jpeg')} 
                                className="w-24 h-24 rounded-3xl"
                                resizeMode="cover"
                            />
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
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff color="#94A3B8" size={20} /> : <Eye color="#94A3B8" size={20} />}
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row items-center border border-gray-200 bg-surface rounded-2xl px-4 py-3 shadow-sm">
                            <Lock color="#94A3B8" size={20} className="mr-3" />
                            <TextInput
                                className="flex-1 font-outfit text-base text-secondary py-0"
                                placeholder="Confirm Password"
                                placeholderTextColor="#94A3B8"
                                secureTextEntry={!showConfirmPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <EyeOff color="#94A3B8" size={20} /> : <Eye color="#94A3B8" size={20} />}
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
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
