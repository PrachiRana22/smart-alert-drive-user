import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AlertsScreen from '../screens/AlertsScreen';
import TripSetupScreen from '../screens/TripSetupScreen';
import DriverMonitorScreen from '../screens/DriverMonitorScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';
import VehicleDetailsScreen from '../screens/VehicleDetailsScreen';
import TripFeedbackScreen from '../screens/TripFeedbackScreen';
import LicenseDetails from "../screens/License_Details";
import PrivacyScreen from '../screens/PrivacyScreen';
import NotificationScreen from '../screens/NotificationScreen';
import StorageScreen from '../screens/StorageScreen';
import AppLanguageScreen from '../screens/AppLanguageScreen';
import AppUpdateScreen from '../screens/AppUpdateScreen';
import HelpFeedbackScreen from '../screens/HelpFeedbackScreen';
import DisplayThemeScreen from '../screens/DisplayThemeScreen';
import EmergencyContactsScreen from '../screens/EmergencyContactsScreen';


const Stack = createNativeStackNavigator();
 
export default function AppNavigator() {
    const { user, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    // ✅ APP STACK (Authorized)
                    <>
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="Alerts" component={AlertsScreen} />
                        <Stack.Screen name="TripSetup" component={TripSetupScreen} />
                        <Stack.Screen name="DriverMonitor" component={DriverMonitorScreen} />
                        <Stack.Screen name="DriverProfile" component={DriverProfileScreen}/>
                        <Stack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
                        <Stack.Screen name="TripFeedback" component={TripFeedbackScreen} />
                        <Stack.Screen name="LicenseDetails" component={LicenseDetails} />
                        <Stack.Screen name="Privacy" component={PrivacyScreen} />
                        <Stack.Screen name="Notifications" component={NotificationScreen} />
                        <Stack.Screen name="Storage" component={StorageScreen} />
                        <Stack.Screen name="AppLanguage" component={AppLanguageScreen} />
                        <Stack.Screen name="AppUpdate" component={AppUpdateScreen} />
                        <Stack.Screen name="HelpFeedback" component={HelpFeedbackScreen} />
                        <Stack.Screen name="DisplayTheme" component={DisplayThemeScreen} />
                        <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
                    </>
                ) : (
                    // 🔒 AUTH STACK (Unauthorized)
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Signup" component={SignupScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    </>
                )}
            </Stack.Navigator>
    );
}


