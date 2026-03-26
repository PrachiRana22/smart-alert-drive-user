import en from './en.json';
import hi from './hi.json';
import gu from './gu.json';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const translations = {
  English: en,
  Hindi: hi,
  Gujarati: gu
};

export const useTranslation = () => {
    const context = useContext(AuthContext);
    const appLanguage = context?.appLanguage || 'English';

    const t = (key) => {
        const keys = key.split('.');
        let value = translations[appLanguage] || translations['English'];
        
        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                return key; // fallback to key path if missing
            }
        }
        return value;
    };

    return { t, language: appLanguage };
};
