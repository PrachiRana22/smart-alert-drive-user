// Mock storage for when native modules are missing
// This stores data only in memory (will be lost on app restart)

const storage = {};

const MockSecureStore = {
    setItemAsync: async (key, value) => {
        storage[key] = value;
        return null;
    },
    getItemAsync: async (key) => {
        return storage[key] || null;
    },
    deleteItemAsync: async (key) => {
        delete storage[key];
        return null;
    }
};

export default MockSecureStore;
