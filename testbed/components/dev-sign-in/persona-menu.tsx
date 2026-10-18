'use client';

import { Fragment } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { signIn, signOut, useSession } from 'next-auth/react';
import { LuChevronDown } from 'react-icons/lu';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  NameAvatar,
} from '@/ascendra-ui';
import { api } from '@/ascendra-ui/lib/api';
import type { DevPersona } from '@/lib/dev-auth/auth-options';

/** Menu sections, in order, by persona. A persona the sandbox adds later lands in a section of its own name. */
const PERSONA_GROUPS: Record<string, string> = {
  'platform-admin': 'Platform',
  'tenant-admin': 'Tenant admins',
  member: 'No audit access',
};

function groupByPersona(personas: DevPersona[]): { title: string; personas: DevPersona[] }[] {
  const groups = new Map<string, DevPersona[]>();
  for (const persona of personas) {
    const title = PERSONA_GROUPS[persona.persona] ?? persona.persona;
    groups.set(title, [...(groups.get(title) ?? []), persona]);
  }
  return [...groups].map(([title, members]) => ({ title, personas: members }));
}

/**
 * The testbed's dev sign-in: pick who you are from ascendra-commons-sandbox's personas, switch at any time, or sign
 * out. Testbed only — it stands in for a real app's account menu and identity provider (lib/dev-auth). Switching
 * resets every cached query, so each screen refetches as the new person.
 */
export function PersonaMenu() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const personasQuery = useQuery({
    queryKey: ['dev-personas'],
    queryFn: () => api.get<DevPersona[]>('/dev/personas'),
    staleTime: Infinity,
  });

  const currentId = session?.user?.email ?? '';
  const current = personasQuery.data?.find((p) => p.id === currentId);
  const groups = groupByPersona(personasQuery.data ?? []);
  const signedIn = status === 'authenticated' && Boolean(currentId);

  const switchTo = async (actorId: string) => {
    if (actorId === currentId) return;
    await signIn('dev', { actorId, redirect: false });
    await queryClient.resetQueries();
  };
  const signOutDev = async () => {
    await signOut({ redirect: false });
    await queryClient.resetQueries();
  };

  const trigger = signedIn ? (
    <NameAvatar
      href="#"
      name={current?.name ?? currentId}
      title={`Signed in as ${current?.label ?? currentId}`}
      aria-label="Switch dev persona"
      onClick={(e) => e.preventDefault()}
    />
  ) : (
    <Button variant="secondary" size="sm" disabled={status === 'loading'}>
      Sign in <LuChevronDown />
    </Button>
  );

  const personaList = personasQuery.isError ? (
    <DropdownMenuItem disabled>Sandbox not reachable at {process.env.NEXT_PUBLIC_API_URL ?? '(NEXT_PUBLIC_API_URL unset)'}</DropdownMenuItem>
  ) : (
    <DropdownMenuRadioGroup value={currentId} onValueChange={switchTo}>
      {groups.map((group) => (
        <Fragment key={group.title}>
          <DropdownMenuLabel className="text-muted-foreground text-xs">{group.title}</DropdownMenuLabel>
          {group.personas.map((persona) => (
            <DropdownMenuRadioItem key={persona.id} value={persona.id}>
              {persona.label}
            </DropdownMenuRadioItem>
          ))}
        </Fragment>
      ))}
    </DropdownMenuRadioGroup>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        {signedIn && (
          <>
            <DropdownMenuLabel>
              <div className="text-muted-foreground text-xs font-normal">Signed in as</div>
              <div>{current?.label ?? currentId}</div>
              <div className="text-muted-foreground text-xs font-normal">{currentId}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuGroup>{personaList}</DropdownMenuGroup>
        {signedIn && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={signOutDev}>Sign out</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
