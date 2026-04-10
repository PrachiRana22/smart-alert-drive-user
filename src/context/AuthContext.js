import React, { createContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useColorScheme } from 'nativewind';
import SecureStore from '../utils/SecureStore';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLicenseDone, setIsLicenseDone] = useState(false);
    const [appLanguage, setAppLanguage] = useState("English");
    const [licenseData, setLicenseData] = useState(null);
    const [trips, setTrips] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [emergencyContacts, setEmergencyContacts] = useState([]);

    const theme = "light";
    const setTheme = () => {};

    const { colorScheme: nativeWindTheme, setColorScheme: setNativeWindTheme } = useColorScheme();

    // Check login status on mount
    useEffect(() => {
        // Force light mode in NativeWind internal state
        setNativeWindTheme("light");
        checkLoginStatus();
    }, []);

    const checkLoginStatus = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (token) {
                // Fetch profile to verify token and get user info
                const response = await api.get('/user/profile/');
                const userData = response.data;
                setUser(userData);
                setIsLicenseDone(!!userData.license_number);
                fetchTrips();
                fetchVehicles();
                fetchEmergencyContacts();
            }
        } catch (error) {
            console.log("Auto-login failed:", error);
            await SecureStore.deleteItemAsync('userToken');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchVehicles = async () => {
        try {
            const response = await api.get('/user/vehicles/');
            setVehicles(response.data);
        } catch (error) {
            console.error("Failed to fetch vehicles:", error);
        }
    };

    const fetchEmergencyContacts = async () => {
        try {
            const response = await api.get('/user/emergency-contacts/');
            setEmergencyContacts(response.data);
        } catch (error) {
            console.error("Failed to fetch emergency contacts:", error);
        }
    };

    const addEmergencyContact = async (contactData) => {
        try {
            const response = await api.post('/user/emergency-contacts/', contactData);
            setEmergencyContacts(prev => [...prev, response.data]);
            return response.data;
        } catch (error) {
            console.error("Failed to add emergency contact:", error);
            throw error;
        }
    };

    const deleteEmergencyContact = async (id) => {
        try {
            await api.delete(`/user/emergency-contacts/${id}/`);
            setEmergencyContacts(prev => prev.filter(c => c.id !== id && c.pk !== id));
        } catch (error) {
            console.error("Failed to delete emergency contact:", error);
            throw error;
        }
    };

    const updateEmergencyContact = async (id, contactData) => {
        try {
            const response = await api.put(`/user/emergency-contacts/${id}/`, contactData);
            setEmergencyContacts(prev => prev.map(c => (c.id === id || c.pk === id) ? response.data : c));
            return response.data;
        } catch (error) {
            console.error("Failed to update emergency contact:", error);
            throw error;
        }
    };

    const fetchTrips = async () => {
        try {
            const response = await api.get('/user/trips/');
            setTrips(response.data);
        } catch (error) {
            console.error("Failed to fetch trips:", error);
        }
    };

    const saveTrip = async (tripData) => {
        try {
            const response = await api.post('/user/trips/', tripData);
            setTrips(prev => [response.data, ...prev]);
            console.log("Trip saved to backend:", response.data);
            return response.data;
        } catch (error) {
            const errorData = error.response?.data;
            const detailMsg = typeof errorData === 'object' ? JSON.stringify(errorData) : errorData || error.message;
            console.error("Failed to save trip. Backend error details:", detailMsg);
            Alert.alert("Trip Error", `Could not start trip. ${detailMsg}`);
            throw error;
        }
    };

    const updateTripStatus = async (tripId, tripData) => {
        try {
            const response = await api.patch(`/user/trips/${tripId}/`, tripData);
            setTrips(prev => prev.map(t => t.id === tripId ? response.data : t));
            console.log("Trip updated in backend:", response.data);
            return response.data;
        } catch (error) {
            console.error("Failed to update trip. Backend error details:", error.response?.data || error.message);
            throw error;
        }
    };

    const reportAlert = async (alertData) => {
        try {
            // alertData should contain trip, alert_type, severity, location, latitude, longitude, vehicle_speed
            const response = await api.post('/user/alerts/', alertData);
            console.log("Alert reported to backend:", response.data);
            return response.data;
        } catch (error) {
            console.error("Failed to report alert:", error);
        }
    };

    const resolveAlert = async (alertId) => {
        try {
            const response = await api.patch(`/user/alerts/${alertId}/`, { is_resolved: true });
            console.log("Alert resolved:", response.data);
            return response.data;
        } catch (error) {
            console.error("Failed to resolve alert:", error);
        }
    };

    const sendEmergencyEmail = async (alertData) => {
        try {
            const response = await api.post('/user/emergency-contacts/send-alert/', alertData);
            console.log("Emergency email dispatched:", response.data);
            return response.data;
        } catch (error) {
            console.error("Failed to send emergency email:", error);
            throw error;
        }
    };

    const login = async (username, password) => {
        setIsLoading(true);
        try {
            const trimmedUsername = username.trim();
            const response = await api.post('/auth/login/', {
                username: trimmedUsername,
                password: password
            });
            
            // Be robust with different token response formats
            const access = response.data.access || response.data.token || response.data.accessToken;
            if (!access) {
                console.error("Token missing in response:", response.data);
                throw "Server authentication response missing token.";
            }

            await SecureStore.setItemAsync('userToken', access);
            
            // Get profile after login
            const profileResponse = await api.get('/user/profile/');
            const userData = profileResponse.data;
            setUser(userData);
            setIsLicenseDone(!!userData.license_number);
            fetchTrips();
            fetchVehicles();
            fetchEmergencyContacts();
            
            setIsLoading(false);
            return true;
        } catch (error) {
            setIsLoading(false);
            console.log("Login error detail:", error.response?.data || error.message);
            
            let message = "Login failed.";
            if (error.response?.data) {
                const data = error.response.data;
                if (typeof data === 'string') {
                    message = data;
                } else if (data.detail) {
                    message = data.detail;
                } else if (data.non_field_errors) {
                    message = data.non_field_errors[0];
                } else {
                    // Try to extract first error from any field
                    const firstKey = Object.keys(data)[0];
                    if (firstKey && Array.isArray(data[firstKey])) {
                        message = `${firstKey}: ${data[firstKey][0]}`;
                    }
                }
            } else if (error.request) {
                message = "No response from server. Please check your internet or IP address.";
            } else if (error.message) {
                message = error.message;
            }
            throw typeof message === 'string' ? message : JSON.stringify(message);
        }
    };

    const signup = async (name, email, password) => {
        setIsLoading(true);
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedName = name.trim();

        try {
            // Use email as the username for consistency
            const generatedUsername = trimmedEmail;

            await api.post('/auth/register/', {
                username: generatedUsername,
                email: trimmedEmail,
                password,
                first_name: trimmedName.split(' ')[0] || "",
                last_name: trimmedName.split(' ').slice(1).join(' ') || ""
            });
            
            // After signup, automatically login
            return await login(generatedUsername, password);
        } catch (error) {
            setIsLoading(false);
            console.log("Signup error data:", error.response?.data);
            
            // Extract detailed error messages
            const data = error.response?.data;
            let errorMsg = "Registration failed.";
            
            if (data) {
                if (typeof data === 'string') {
                    errorMsg = data;
                } else if (data.email) {
                    errorMsg = `Email: ${data.email[0]}`;
                } else if (data.username) {
                    // Logic to detect if username error is basically email error
                    if (trimmedEmail === data.username[0] || 
                        (typeof data.username[0] === 'string' && data.username[0].toLowerCase().includes("exists"))) {
                        errorMsg = "An account with this email already exists.";
                    } else {
                        errorMsg = `Username: ${data.username[0]}`;
                    }
                } else if (data.password) {
                    errorMsg = `Password: ${data.password[0]}`;
                } else if (data.detail) {
                    errorMsg = data.detail;
                } else if (data.non_field_errors) {
                    errorMsg = data.non_field_errors[0];
                }
            } else if (error.request) {
                errorMsg = "No response from server. Please check your internet or IP address.";
            } else if (error.message) {
                errorMsg = `Network error: ${error.message}`;
            }
            
            throw errorMsg;
        }
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('userToken');
        setUser(null);
        setIsLicenseDone(false);
        setTrips([]);
    };

    const updateUser = async (newData) => {
        try {
            const response = await api.patch('/user/profile/', newData);
            setUser(response.data);
            return response.data;
        } catch (error) {
            console.error("Failed to update user:", error);
            throw error;
        }
    };

    const updatePersona = async (newPersona) => {
        return await updateUser({ persona: newPersona });
    };

    const updateLicense = async (licenseInfo) => {
        // licenseInfo: { full_name, license_number, dob }
        return await updateUser(licenseInfo);
    };

    const saveVehicle = async (vehicleData) => {
        try {
            const response = await api.post('/user/vehicles/', vehicleData);
            fetchVehicles(); // Refresh list
            return response.data;
        } catch (error) {
            console.error("Failed to save vehicle:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            isLoading,
            login,
            signup,
            logout,
            isLicenseDone,
            setIsLicenseDone,
            licenseData,
            setLicenseData,
            updateUser,
            theme,
            setTheme,
            trips,
            saveTrip,
            updateTripStatus,
            vehicles,
            fetchVehicles,
            reportAlert,
            appLanguage,
            setAppLanguage,
            fetchTrips,
            updatePersona,
            updateLicense,
            saveVehicle,
            emergencyContacts,
            fetchEmergencyContacts,
            addEmergencyContact,
            deleteEmergencyContact,
            updateEmergencyContact,
            resolveAlert,
            sendEmergencyEmail
        }}>
            {children}
        </AuthContext.Provider>
    );
};
