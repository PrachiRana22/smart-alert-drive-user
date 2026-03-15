import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [registeredUsers, setRegisteredUsers] = useState([
        { name: "Test Driver", email: "test@driver.com", password: "password123" }
    ]);

    const getDashboardData = (name) => ({
        safetyScore: Math.floor(Math.random() * (100 - 80 + 1)) + 80,
        driveTime: "4h 20m",
        totalDistance: "142 mi",
        recentAlerts: [
            { id: 1, type: 'Harsh Braking', location: 'Main St & 4th Ave', time: '10 min ago', severity: 'high' },
            { id: 2, type: 'Speeding Warning', location: 'Highway 65', time: '2 hrs ago', severity: 'medium' },
        ]
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
                    return reject("Account not found. Please sign up.");
                }

                if (foundUser.password !== password) {
                    setIsLoading(false);
                    return reject("Incorrect password.");
                }

                setUser({
                    name: foundUser.name,
                    email: foundUser.email,
                    token: "mock-jwt-token-123",
                    dashboard: getDashboardData(foundUser.name),
                    recentTrip: null,
                });

                setIsLoading(false);
                resolve(true);

            }, 1000);
        });
    };

    const signup = async (name, email, password) => {
        setIsLoading(true);

        return new Promise((resolve, reject) => {

            setTimeout(() => {

                const userExists = registeredUsers.some(
                    u => u.email.toLowerCase() === email.toLowerCase()
                );

                if (userExists) {
                    setIsLoading(false);
                    return reject("An account with this email already exists.");
                }

                setRegisteredUsers([
                    ...registeredUsers,
                    { name, email, password }
                ]);

                setIsLoading(false);
                resolve(true);

            }, 1000);

        });
    };

    const logout = () => {
        setUser(null);
    };

    const saveTrip = (tripData) => {
        if (user) {
            setUser({
                ...user,
                recentTrip: tripData
            });
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, isLoading, login, signup, logout, saveTrip }}>
            {children}
        </AuthContext.Provider>
    );
};
