import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, User, ShieldCheck, Bell, HardDrive, Globe, RefreshCw, HelpCircle, LogOut, ChevronRight, Users } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from '../locales';

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { logout } = React.useContext(AuthContext);
    const isDark = false;
    const { t } = useTranslation();

    const handleLogout = () => {
        logout();
    };

    const SettingItem = ({ icon: Icon, title, onPress, isLogout }) => (
        <TouchableOpacity
            className="flex-row items-center justify-between py-4 border-b border-gray-100 active:bg-gray-50"
            onPress={onPress}
        >
            <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isLogout ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <Icon color={isLogout ? "#DC2626" : (isDark ? "#94A3B8" : "#64748B")} size={22} />
                </View>
                <Text className={`text-base font-outfit-medium ${isLogout ? 'text-red-500' : 'text-secondary'}`}>
                    {title}
                </Text>
            </View>
            {!isLogout && <ChevronRight color={isDark ? "#475569" : "#CBD5E1"} size={20} />}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center pt-16 pb-4 px-6 bg-surface border-b border-gray-100 shadow-sm z-10 w-full">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full bg-gray-50">
                    <ChevronLeft color={isDark ? "#E2E8F0" : "#1E293B"} size={24} />
                </TouchableOpacity>
                <View className="flex-1 flex-row items-center justify-center pr-8">
                    <View className="w-8 h-8 bg-gray-800 rounded-full items-center justify-center mr-3">
                        <User color="#FFFFFF" size={18} />
                    </View>
                    <Text className="text-xl font-outfit-bold text-secondary">{t('settings.title')}</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                {/* Account Section */}
                <Text className="text-sm font-outfit-bold text-gray-500 mb-2">{t('settings.account')}</Text>
                <View className="bg-surface rounded-2xl mb-6 shadow-sm border border-gray-100 px-4">
                    <SettingItem icon={User} title={t('settings.driverProfile')} onPress={() => navigation.navigate('DriverProfile')} />
                    <SettingItem icon={Users} title="Emergency Contacts" onPress={() => navigation.navigate('EmergencyContacts')} />
                    <SettingItem icon={Globe} title={t('settings.appLanguage')} onPress={() => navigation.navigate('AppLanguage')} />
                    <SettingItem icon={ShieldCheck} title={t('settings.privacy')} onPress={() => navigation.navigate('Privacy')} />
                </View>

                {/* General Section */}
                <Text className="text-sm font-outfit-bold text-gray-500 mb-2">{t('settings.general')}</Text>
                <View className="bg-surface rounded-2xl mb-6 shadow-sm border border-gray-100 px-4">
                    <SettingItem icon={Bell} title={t('settings.notifications')} onPress={() => navigation.navigate('Notifications')} />
                    <SettingItem icon={HardDrive} title={t('settings.storage')} onPress={() => navigation.navigate('Storage')} />
                    <SettingItem icon={RefreshCw} title={t('settings.appUpdates')} onPress={() => navigation.navigate('AppUpdate')} />
                </View>

                {/* Support Section */}
                <Text className="text-sm font-outfit-bold text-gray-500 mb-2">{t('settings.support')}</Text>
                <View className="bg-surface rounded-2xl mb-6 shadow-sm border border-gray-100 px-4">
                    <SettingItem icon={HelpCircle} title={t('settings.helpFeedback')} onPress={() => navigation.navigate('HelpFeedback')} />
                </View>

                <View className="mt-4 mb-8">
                    <SettingItem icon={LogOut} title={t('settings.logout')} onPress={handleLogout} isLogout />
                </View>
            </ScrollView>
        </View>
    );
}
