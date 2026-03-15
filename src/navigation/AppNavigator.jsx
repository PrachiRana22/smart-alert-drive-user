import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Signup" component={SignupScreen} />
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="Alerts" component={AlertsScreen} />
                <Stack.Screen name="TripSetup" component={TripSetupScreen} />
                <Stack.Screen name="DriverMonitor" component={DriverMonitorScreen} />
                <Stack.Screen name="DriverProfile" component={DriverProfileScreen}/>
                <Stack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
                <Stack.Screen name="TripFeedback" component={TripFeedbackScreen} />


            </Stack.Navigator>
        </NavigationContainer>
    );
}


