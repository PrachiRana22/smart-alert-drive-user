import React, { createContext, useState } from 'react';
import { useColorScheme } from 'nativewind';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [isLicenseDone, setIsLicenseDone] = useState(false);
    
    // Translation Context
    const [appLanguage, setAppLanguage] = useState("English");

    // ✅ ADD THIS
    const [licenseData, setLicenseData] = useState({
        name: "",
        licenseNumber: ""
    });

    const [trips, setTrips] = useState([]);

    const saveTrip = (trip) => {
        setTrips(prev => [...prev, trip]);
        console.log("Trip saved:", trip);
    };

    const [registeredUsers, setRegisteredUsers] = useState([
        { name: "Test Driver", email: "test@driver.com", password: "password123" }
    ]);

    const getDashboardData = (name) => ({
        safetyScore: Math.floor(Math.random() * (100 - 80 + 1)) + 80,
        driveTime: "4h 20m",
        totalDistance: "142 mi",
        recentAlerts: []
    });

    const login = async (email, password) => {
        setIsLoading(true);
        return new Promise((resolve, reject) => {
            setTimeout(() => {

                const foundUser = registeredUsers.find(
                    u => u.email.toLowerCase() === email.toLowerCase()
                );

                if (!foundUser) {
                    setIsLoading(false);
                    return reject("Account not found.");
                }

                if (foundUser.password !== password) {
                    setIsLoading(false);
                    return reject("Incorrect password.");
                }

                setIsLicenseDone(false);

                setUser({
                    name: foundUser.name,
                    email: foundUser.email,
                });

                setIsLoading(false);
                resolve(true);

            }, 1000);
        });
    };

    const signup = async (name, email, password) => {
        setRegisteredUsers([...registeredUsers, { name, email, password }]);
    };

    const logout = () => {
        setUser(null);
        setIsLicenseDone(false);
    };

    const updateUser = (newData) => {
    setUser(prev => ({ ...prev, ...newData }));
};

const { colorScheme: theme, setColorScheme: setTheme } = useColorScheme();

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
            appLanguage,
            setAppLanguage

        }}>
            {children}
        </AuthContext.Provider>
    );
};
