import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { User, Lock, Pencil, ChevronLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';

export default function ProfileScreen() {
    const navigation = useNavigation();
    const { user, updateUser, updatePersona } = React.useContext(AuthContext);
    const isDark = false;

    // Form states
    const [username, setUsername] = useState(user?.full_name || user?.username || '');
    const [password, setPassword] = useState('');
    const [profileData, setProfileData] = useState(user?.email || '');
    const [persona, setPersona] = useState(user?.persona || 'Normal');
    const [profileImage, setProfileImage] = useState(user?.profile_image || null);

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.3,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            setProfileImage(asset.base64);
        }
    };

    const handleDone = async () => {
        try {
            await updateUser({ 
                full_name: username,
                persona: persona,
                email: profileData,
                profile_image: profileImage
            });
            navigation.goBack();
        } catch (error) {
            alert("Failed to update profile");
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-slate-50"
        >
            {/* Header */}
            <View className="flex-row items-center pt-16 pb-4 px-6 bg-white border-b border-gray-100 shadow-sm z-10 w-full">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full bg-gray-50">
                    <ChevronLeft color={isDark ? "#E2E8F0" : "#1E293B"} size={24} />
                </TouchableOpacity>
                <View className="flex-1 items-center pr-6">
                    <Text className="text-xl font-outfit-bold text-slate-800">Profile</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
                {/* Profile Picture Placeholder */}
                <View className="items-center mb-10 mt-2">
                    <View className="w-32 h-32 rounded-full border-4 border-white items-center justify-center bg-gray-100 shadow-md relative overflow-hidden">
                        {profileImage ? (
                            <Image 
                                source={{ uri: profileImage.startsWith('data:') ? profileImage : `data:image/jpeg;base64,${profileImage}` }} 
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <User size={56} strokeWidth={1.5} color={isDark ? "#94A3B8" : "#CBD5E1"} />
                        )}
                        <TouchableOpacity 
                            onPress={pickImage}
                            className="absolute bottom-0 right-0 bg-primary p-3 rounded-full shadow-md shadow-primary/40 border-2 border-white active:scale-95 transition-transform"
                        >
                            <Pencil color="#FFFFFF" size={16} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Input Fields */}
                <View className="space-y-6 mb-12">
                    {/* Username */}
                    <View>
                        <Text className="text-sm font-outfit-medium text-gray-500 mb-2 ml-1">Username</Text>
                        <View className="flex-row items-center bg-white border border-gray-100 rounded-[28px] px-5 py-4 shadow-sm shadow-gray-200">
                            <View className="bg-primary/10 p-2.5 rounded-2xl mr-4">
                                <User size={22} color={isDark ? "#3B82F6" : "#2563EB"} />
                            </View>
                            <TextInput
                                className="flex-1 font-outfit text-base text-slate-800 py-1"
                                placeholder="Change Username"
                                placeholderTextColor="#94A3B8"
                                value={username}
                                onChangeText={setUsername}
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View>
                        <Text className="text-sm font-outfit-medium text-gray-500 mb-2 ml-1">Password</Text>
                        <View className="flex-row items-center bg-white border border-gray-100 rounded-[28px] px-5 py-4 shadow-sm shadow-gray-200">
                            <View className="bg-primary/10 p-2.5 rounded-2xl mr-4">
                                <Lock size={22} color={isDark ? "#3B82F6" : "#2563EB"} />
                            </View>
                            <TextInput
                                className="flex-1 font-outfit text-base text-slate-800 py-1"
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
                        <Text className="text-sm font-outfit-medium text-gray-500 mb-2 ml-1">Profile Info</Text>
                        <View className="flex-row items-center bg-white border border-gray-100 rounded-[28px] px-5 py-4 shadow-sm shadow-gray-200">
                            <View className="bg-primary/10 p-2.5 rounded-2xl mr-4">
                                <View className="w-5 h-5 rounded border-2 border-primary" />
                            </View>
                            <TextInput
                                className="flex-1 font-outfit text-base text-slate-800 py-1"
                                placeholder="Change Profile"
                                placeholderTextColor="#94A3B8"
                                value={profileData}
                                onChangeText={setProfileData}
                            />
                        </View>
                    </View>

                    {/* Driving Persona */}
                    <View>
                        <Text className="text-sm font-outfit-medium text-gray-500 mb-2 ml-1">Driving Persona</Text>
                        <View className="flex-row justify-between bg-white p-1 rounded-2xl border border-gray-200">
                            {['Normal', 'Moderate', 'Critical'].map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    onPress={() => setPersona(p)}
                                    className={`flex-1 py-3 items-center rounded-xl ${persona === p ? 'bg-primary' : 'bg-transparent'}`}
                                >
                                    <Text className={`font-outfit-bold text-sm ${persona === p ? 'text-white' : 'text-slate-500'}`}>
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
