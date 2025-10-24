import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { cn } from '@/lib/utils';

export const UserNav: React.FC = () => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation('common');
  const { isRTL, textStart } = useLang();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata.avatar_url} alt={user.email || ''} />
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={cn("w-56", isRTL && "font-hebrew")} align="end" forceMount>
        <DropdownMenuLabel className={cn("font-normal", textStart())}>
          <div className="flex flex-col space-y-1">
            <p className={cn("text-sm font-medium leading-none", textStart())}>{user.email}</p>
            <p className={cn("text-xs leading-none text-muted-foreground", textStart())}>
              {user.user_metadata.full_name}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className={textStart()}>
            {t('toolbar.profile', 'Profile')}
          </DropdownMenuItem>
          <DropdownMenuItem className={textStart()}>
            {t('toolbar.settings', 'Settings')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className={textStart()}>
          {t('toolbar.logout', 'Log out')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 