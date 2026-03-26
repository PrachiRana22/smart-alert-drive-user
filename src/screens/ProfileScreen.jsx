import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { User, Lock, Pencil, ChevronLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { AuthContext } from '../context/AuthContext';

export default function ProfileScreen() {
    const navigation = useNavigation();
    const { user } = React.useContext(AuthContext);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Form states
    const [username, setUsername] = useState(user?.name || '');
    const [password, setPassword] = useState('');
    const [profileData, setProfileData] = useState('');
    const [persona, setPersona] = useState(user?.persona || 'Normal');
    const { updatePersona } = React.useContext(AuthContext);

    const handleDone = () => {
        if (updatePersona) updatePersona(persona);
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-slate-50 dark:bg-slate-900"
        >
            {/* Header */}
            <View className="flex-row items-center pt-16 pb-4 px-6 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800 shadow-sm z-10 w-full">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full bg-gray-50 dark:bg-slate-700">
                    <ChevronLeft color={isDark ? "#E2E8F0" : "#1E293B"} size={24} />
                </TouchableOpacity>
                <View className="flex-1 items-center pr-6">
                    <Text className="text-xl font-outfit-bold text-slate-800 dark:text-white">Profile</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
                {/* Profile Picture Placeholder */}
                <View className="items-center mb-10 mt-2">
                    <View className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 items-center justify-center bg-gray-100 dark:bg-slate-700 shadow-md relative">
                        <User size={56} strokeWidth={1.5} color={isDark ? "#94A3B8" : "#CBD5E1"} />
                        <TouchableOpacity className="absolute bottom-0 right-0 bg-primary p-3 rounded-full shadow-md shadow-primary/40 border-2 border-white dark:border-slate-800 active:scale-95 transition-transform">
                            <Pencil color="#FFFFFF" size={16} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Input Fields */}
                <View className="space-y-6 mb-12">
                    {/* Username */}
                    <View>
                        <Text className="text-sm font-outfit-medium text-gray-500 dark:text-slate-400 mb-2 ml-1">Username</Text>
                        <View className="flex-row items-center border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl px-5 py-4 shadow-sm">
                            <User size={20} className="mr-3" color={isDark ? "#64748B" : "#94A3B8"} />
                            <TextInput
                                className="flex-1 font-outfit text-base text-slate-800 dark:text-gray-100 py-0"
                                placeholder="Change Username"
                                placeholderTextColor="#94A3B8"
                                value={username}
                                onChangeText={setUsername}
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View>
                        <Text className="text-sm font-outfit-medium text-gray-500 dark:text-slate-400 mb-2 ml-1">Password</Text>
                        <View className="flex-row items-center border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl px-5 py-4 shadow-sm">
                            <Lock size={20} className="mr-3" color={isDark ? "#64748B" : "#94A3B8"} />
                            <TextInput
                                className="flex-1 font-outfit text-base text-slate-800 dark:text-gray-100 py-0"
                                placeholder="Change Password"
                                placeholderTextColor="#94A3B8"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>
                    </View>

                    {/* Profile */}
                    <View>
                        <Text className="text-sm font-outfit-medium text-gray-500 dark:text-slate-400 mb-2 ml-1">Profile Info</Text>
                        <View className="flex-row items-center border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl px-5 py-4 shadow-sm">
                            <View className="w-5 h-5 mr-3 rounded border-2 border-gray-300 dark:border-slate-600" />
                            <TextInput
                                className="flex-1 font-outfit text-base text-slate-800 dark:text-gray-100 py-0"
                                placeholder="Change Profile"
                                placeholderTextColor="#94A3B8"
                                value={profileData}
                                onChangeText={setProfileData}
                            />
                        </View>
                    </View>

                    {/* Driving Persona */}
                    <View>
                        <Text className="text-sm font-outfit-medium text-gray-500 dark:text-slate-400 mb-2 ml-1">Driving Persona</Text>
                        <View className="flex-row justify-between bg-white dark:bg-slate-800 p-1 rounded-2xl border border-gray-200 dark:border-slate-700">
                            {['Normal', 'Moderate', 'Critical'].map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    onPress={() => setPersona(p)}
                                    className={`flex-1 py-3 items-center rounded-xl ${persona === p ? 'bg-primary' : 'bg-transparent'}`}
                                >
                                    <Text className={`font-outfit-bold text-sm ${persona === p ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {p}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text className="text-xs text-slate-400 mt-2 ml-1">
                            {persona === 'Normal' && 'Balanced alert thresholds.'}
                            {persona === 'Moderate' && 'Highly sensitive, triggers alerts sooner.'}
                            {persona === 'Critical' && 'Less sensitive, triggers only on critical events.'}
                        </Text>
                    </View>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                    className="bg-primary py-4 rounded-2xl shadow-lg shadow-primary/30 w-full mb-10 active:scale-95 transition-transform"
                    onPress={handleDone}
                >
                    <Text className="text-white font-outfit-bold text-lg text-center tracking-wide">
                        Save Changes
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
