import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={() => changeLanguage('zh')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${i18n.language === 'zh'
                    ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
            >
                CN
            </button>
            <button
                onClick={() => changeLanguage('en')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${i18n.language === 'en'
                    ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
            >
                EN
            </button>
        </div>
    );
};
