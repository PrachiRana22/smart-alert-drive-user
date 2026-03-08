import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, User, ShieldCheck, Bell, HardDrive, Globe, RefreshCw, HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { logout } = React.useContext(AuthContext);

    const handleLogout = () => {
        logout();
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    const SettingItem = ({ icon: Icon, title, onPress, isLogout }) => (
        <TouchableOpacity
            className="flex-row items-center justify-between py-4 border-b border-gray-100 active:bg-gray-50"
            onPress={onPress}
        >
            <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isLogout ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <Icon color={isLogout ? "#DC2626" : "#64748B"} size={22} />
                </View>
                <Text className={`text-base font-outfit-medium ${isLogout ? 'text-red-500' : 'text-secondary'}`}>
                    {title}
                </Text>
            </View>
            {!isLogout && <ChevronRight color="#CBD5E1" size={20} />}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center pt-16 pb-4 px-6 bg-surface border-b border-gray-100 shadow-sm z-10 w-full">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full bg-gray-50">
                    <ChevronLeft color="#1E293B" size={24} />
                </TouchableOpacity>
                <View className="flex-1 flex-row items-center justify-center pr-8">
                    <View className="w-8 h-8 bg-gray-800 rounded-full items-center justify-center mr-3">
                        <View className="w-4 h-4 rounded-full border-2 border-white" />
                    </View>
                    <Text className="text-xl font-outfit-bold text-secondary">Settings</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 pt-6 bg-surface" showsVerticalScrollIndicator={false}>
                <View className="mb-8">
                    <SettingItem icon={User} title="Account" onPress={() => { }} />
                    <SettingItem icon={ShieldCheck} title="Privacy" onPress={() => { }} />
                    <SettingItem icon={Bell} title="Notifications" onPress={() => { }} />
                    <SettingItem icon={HardDrive} title="Storage" onPress={() => { }} />
                    <SettingItem icon={Globe} title="App language" onPress={() => { }} />
                    <SettingItem icon={RefreshCw} title="App updates" onPress={() => { }} />
                    <SettingItem icon={HelpCircle} title="Help & Feedback" onPress={() => { }} />

                    <View className="mt-4">
                        <SettingItem icon={LogOut} title="Logout" onPress={handleLogout} isLogout />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
