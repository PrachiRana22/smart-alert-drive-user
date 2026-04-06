import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, ShieldAlert, Eye, EyeOff } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen() {
    const navigation = useNavigation();
    const { login, isLoading } = React.useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) return alert("Please enter both email and password.");
        if (password.length < 6) return alert("Password must be at least 6 characters long.");
        
        const trimmedEmail = email.trim().toLowerCase();
        try {
            await login(trimmedEmail, password);
            // No need for manual navigation here!
            // React Navigation will automatically switch from the Login stack 
            // to the Home stack because the 'user' state is now updated.
        } catch (error) {
            alert(error); // Displays the rejection message from AuthContext
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
                    <View className="items-center mb-12">
                        <View className="mb-8 shadow-md">
                            <Image 
                                source={require('../../assets/App_Inside_Logo.jpeg')} 
                                className="w-36 h-36 rounded-3xl"
                                resizeMode="contain"
                            />
                        </View>
                        <Text className="text-4xl font-outfit-bold text-secondary mb-3 tracking-tight">Smart Drive Alert</Text>
                        <Text className="text-gray-500 font-outfit text-lg text-center">
                            Welcome back. Ready for your next journey?
                        </Text>
                    </View>

                {/* Main Card Area */}
                <View className="space-y-5 mb-8">
                    {/* Input Fields */}
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

                    {/* Forgot Password */}
                    <TouchableOpacity
                        className="items-end"
                        onPress={() => navigation.navigate('ForgotPassword')}
                    >
                        <Text className="text-primary font-outfit-medium text-sm">Forgot Password?</Text>
                    </TouchableOpacity>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                    className={`bg-primary py-4 rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-transform ${isLoading ? 'opacity-70' : ''}`}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    <Text className="text-white font-outfit-bold text-lg text-center tracking-wide">
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </Text>
                </TouchableOpacity>

                {/* Footer link */}
                <View className="flex-row justify-center mt-10">
                    <Text className="text-gray-500 font-outfit text-base">Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                        <Text className="text-primary font-outfit-bold text-base">Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </View></ScrollView>
        </KeyboardAvoidingView>
    );
} 