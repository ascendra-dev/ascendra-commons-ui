import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

/** A person you can sign in as — ascendra-commons-sandbox's `GET /dev/personas` rows. */
export interface DevPersona {
  id: string;
  persona: string;
  tenantId: string | null;
  /** Short display name — the avatar's initials come from it. */
  name: string;
  label: string;
}

/** What the dev sign-in keeps in the next-auth JWT. */
interface DevTokenFields {
  accessToken?: string;
  accessTokenExpiresAt?: string;
}

/**
 * Dev sign-in — testbed only, outside app/observability so it never ships with packages/observability. A next-auth
 * credentials provider that asks ascendra-commons-sandbox for a dev token (`POST /dev/token`) and exposes it as
 * `session.accessToken` — exactly what ascendra-ui's api client sends as `Authorization: Bearer …`. A real app's own
 * next-auth (or Supabase) configuration takes this file's place; nothing under app/observability depends on it.
 *
 * `session.accessToken` is deliberately left off next-auth's Session type: ascendra-ui's client reads it under a
 * `@ts-expect-error`, which a declared field would turn into a type error.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      id: 'dev',
      name: 'Dev sign-in',
      credentials: { actorId: { label: 'Actor id', type: 'text' } },
      async authorize(credentials) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl || !credentials?.actorId) return null;
        const res = await fetch(`${apiUrl}/dev/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actorId: credentials.actorId }),
        });
        if (!res.ok) return null;
        const { token, expiresAt, actor } = (await res.json()) as { token: string; expiresAt: string; actor: { id: string } };
        return { id: actor.id, email: actor.id, accessToken: token, accessTokenExpiresAt: expiresAt };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const fields = user as DevTokenFields;
        token.accessToken = fields.accessToken;
        token.accessTokenExpiresAt = fields.accessTokenExpiresAt;
      }
      return token;
    },
    session({ session, token }) {
      const { accessToken, accessTokenExpiresAt } = token as DevTokenFields;
      // An expired dev token (12 h) reads as signed out, so the persona menu asks you to pick again.
      if (!accessToken || (accessTokenExpiresAt && Date.parse(accessTokenExpiresAt) <= Date.now())) {
        return { expires: session.expires };
      }
      return { ...session, accessToken };
    },
  },
};
