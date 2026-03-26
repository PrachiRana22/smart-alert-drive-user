import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronLeft, Globe, MessageCircle, BookOpen, AlertTriangle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from '../locales';

export default function AppLanguageScreen() {

    const navigation = useNavigation();

    const { appLanguage, setAppLanguage } = React.useContext(AuthContext);
    const { t } = useTranslation();
    
    // Currently only updating global appLanguage. Setting SOS differently if you want.
    const [sosLanguage, setSosLanguage] = useState(appLanguage);

    const languages = ["English", "Hindi", "Gujarati"];

    return (
        <View className="flex-1 bg-white">

            {/* 🔙 HEADER */}
            <View className="flex-row items-center pt-16 pb-4 px-6 border-b">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={26} color="#000" />
                </TouchableOpacity>
                <Text className="text-xl font-bold ml-4">{t('languageScreen.title')}</Text>
            </View>

            <ScrollView 
                className="p-6"
                contentContainerStyle={{ paddingBottom: 80 }}
            >

                {/* 🌍 ALERT LANGUAGE */}
                <View className="flex-row items-center mb-3">
                    <Globe size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">{t('languageScreen.alertTitle')}</Text>
                </View>

                {languages.map(lang => (
                    <TouchableOpacity key={lang} onPress={() => setAppLanguage(lang)}>
                        <Text className={`p-2 ${appLanguage === lang ? 'text-blue-600 font-bold' : ''}`}>
                            {lang}
                        </Text>
                    </TouchableOpacity>
                ))}

                <Text className="text-gray-500 mt-2">
                    {t('languageScreen.alertDesc')}
                </Text>

                {/* 📘 GUIDE */}
                <View className="flex-row items-center mt-6 mb-3">
                    <BookOpen size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">{t('languageScreen.guideTitle')}</Text>
                </View>

                <Text className="text-gray-600">
                    {t('languageScreen.guideDesc')}
                </Text>

                {/* 🚨 SOS LANGUAGE */}
                <View className="flex-row items-center mt-6 mb-3">
                    <AlertTriangle size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">{t('languageScreen.sosTitle')}</Text>
                </View>

                {languages.map(lang => (
                    <TouchableOpacity key={lang} onPress={() => setSosLanguage(lang)}>
                        <Text className={`p-2 ${sosLanguage === lang ? 'text-blue-600 font-bold' : ''}`}>
                            {lang}
                        </Text>
                    </TouchableOpacity>
                ))}

                <Text className="text-gray-500 mt-2">
                    {t('languageScreen.sosDesc')}
                </Text>

                {/* 🧾 LABELS */}
                <View className="flex-row items-center mt-6 mb-3">
                    <MessageCircle size={20} color="#2563eb" />
                    <Text className="text-lg font-bold ml-2">{t('languageScreen.labelsTitle')}</Text>
                </View>

                <Text className="text-gray-600">
                    {t('languageScreen.labelsDesc')}
                </Text>

            </ScrollView>
        </View>
    );
}
