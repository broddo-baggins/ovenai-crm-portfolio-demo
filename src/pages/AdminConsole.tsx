import React from 'react';
import { useTranslation } from 'react-i18next';
import AdminConsole from '@/components/admin/AdminConsole';
import { useLang } from '@/hooks/useLang';

const AdminConsolePage: React.FC = () => {
  const { t } = useTranslation(['pages', 'common']);
  const { isRTL } = useLang();

  return (
    <div className={`${isRTL ? 'font-rubik' : ''}`}>
      <AdminConsole />
    </div>
  );
};

export default AdminConsolePage; 