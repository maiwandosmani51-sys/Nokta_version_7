import { CrudPage } from '@/features/resources/pages/CrudPage';
import { modulesConfig } from '@/features/resources/config/modules';

export function UsersPage() {
  return <CrudPage config={modulesConfig.users} />;
}
