/**
 * Safe SecureStore Implementation (Mock)
 * 
 * This version completely removes all references to 'expo-secure-store' 
 * to prevent crashes in environments where the native module is missing.
 * 
 * NOTE: This will store data only in memory (lost on app restart).
 */

const inMemoryStorage = {};

const SafeSecureStore = {
    setItemAsync: async (key, value) => {
        inMemoryStorage[key] = value;
        return Promise.resolve(null);
    },
    getItemAsync: async (key) => {
        return Promise.resolve(inMemoryStorage[key] || null);
    },
    deleteItemAsync: async (key) => {
        delete inMemoryStorage[key];
        return Promise.resolve(null);
    }
};

export default SafeSecureStore;
