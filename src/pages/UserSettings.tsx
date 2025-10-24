import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';
import UserSettingsForm from '@/components/settings/UserSettingsForm';
import { useLang } from '@/hooks/useLang';

const UserSettings: React.FC = () => {
  const { t } = useTranslation(['pages', 'common']);
  const { isRTL } = useLang();

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'font-rubik' : ''}`}>
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('User Settings')}
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('Manage your account preferences and system configuration')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="max-w-7xl mx-auto">
        <UserSettingsForm />
      </div>
    </div>
  );
};

export default UserSettings; 