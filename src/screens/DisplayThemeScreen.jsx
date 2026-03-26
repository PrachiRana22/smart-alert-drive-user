import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, Sun, Moon, Smartphone } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import { AuthContext } from '../context/AuthContext';

// Removed duplicate imports

export default function DisplayThemeScreen() {

    const navigation = useNavigation();
    const { theme, setTheme } = React.useContext(AuthContext);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const Option = ({ icon: Icon, title, value }) => (
        <TouchableOpacity
            onPress={() => setTheme(value)}
            className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800"
        >
            <View className="flex-row items-center">
                <Icon size={20} color={isDark ? "#60A5FA" : "#2563eb"} />
                <Text className="ml-3 text-base text-secondary dark:text-gray-100">{title}</Text>
            </View>

            {theme === value && (
                <Text className="text-blue-600 font-bold">✓</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-background dark:bg-slate-900">

            {/* HEADER */}
            <View className="flex-row items-center pt-16 pb-4 px-6 border-b border-gray-200 dark:border-gray-800 bg-surface dark:bg-slate-800">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={26} color={isDark ? "#f3f4f6" : "#1E293B"} />
                </TouchableOpacity>
                <Text className="text-xl font-bold ml-4 text-secondary dark:text-gray-100">Display & Theme</Text>
            </View>

            {/* OPTIONS */}
            <View className="bg-surface dark:bg-slate-800 mt-4">
                <Option icon={Sun} title="Light Mode" value="light" />
                <Option icon={Moon} title="Dark Mode" value="dark" />
                <Option icon={Smartphone} title="Auto (System Default)" value="system" />
            </View>

        </View>
    );
}
