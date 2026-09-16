'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { toErrorMessage } from '@/lib/storage/store';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';

type OAuthProvider = 'discord' | 'google';

const MIN_PASSWORD_LENGTH = 8;

function callbackUrl(next: string) {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

function withNext(path: string, next: string) {
  return next === '/' ? path : `${path}?next=${encodeURIComponent(next)}`;
}

function friendlyError(error: unknown) {
  const message = toErrorMessage(error);
  if (/email not confirmed/i.test(message)) return 'Confirm your email address first. Check your inbox for the link.';
  if (/invalid login credentials/i.test(message)) return 'That email and password don’t match an account.';
  return message;
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
      {message}
    </p>
  );
}

function FormNotice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
      {children}
    </p>
  );
}

function DiscordIcon() {
  return (
    <svg aria-hidden className="size-5" viewBox="0 0 24 24" fill="#5865F2">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.618-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.028C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.042-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.098.246.197.373.291a.077.077 0 0 1-.007.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.029ZM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden className="size-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
    </svg>
  );
}

const providers: { id: OAuthProvider; label: string; icon: ReactNode }[] = [
  { id: 'discord', label: 'Discord', icon: <DiscordIcon /> },
  { id: 'google', label: 'Google', icon: <GoogleIcon /> },
];

function OAuthButtons({ next, disabled, onError }: { next: string; disabled: boolean; onError: (message: string) => void }) {
  const [pending, setPending] = useState<OAuthProvider | null>(null);

  async function signIn(provider: OAuthProvider) {
    setPending(provider);
    const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl(next) },
    });
    if (error) {
      setPending(null);
      onError(friendlyError(error));
    }
  }

  return (
    <div className="grid gap-2">
      {providers.map((provider) => (
        <Button key={provider.id} className="w-full" disabled={disabled || pending !== null} onClick={() => signIn(provider.id)}>
          {provider.icon}
          {pending === provider.id ? 'Redirecting…' : `Continue with ${provider.label}`}
        </Button>
      ))}
    </div>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
      <span className="h-px flex-1 bg-border" />
      or use email
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function SignInForm({ next, initialError }: { next: string; initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await getSupabaseBrowserClient().auth.signInWithPassword({ email, password });
    if (error) {
      setSubmitting(false);
      setError(friendlyError(error));
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <FormError message={error} />
      <OAuthButtons next={next} disabled={submitting} onError={setError} />
      <Divider />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField id="email" label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          labelAction={
            <Link href="/forgot-password" className="text-xs text-muted underline-offset-4 hover:text-text hover:underline">
              Forgot password?
            </Link>
          }
        />
        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}

export function SignUpForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { data, error } = await getSupabaseBrowserClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: callbackUrl(next) },
    });
    if (error) {
      setSubmitting(false);
      setError(friendlyError(error));
      return;
    }
    if (data.session) {
      router.replace(next);
      router.refresh();
      return;
    }
    setSubmitting(false);
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <FormNotice>
        We sent a confirmation link to <strong>{sentTo}</strong>. Open it in this browser to finish creating your account.
      </FormNotice>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <FormError message={error} />
      <OAuthButtons next={next} disabled={submitting} onError={setError} />
      <Divider />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField id="email" label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(email, {
      redirectTo: callbackUrl('/update-password'),
    });
    setSubmitting(false);
    if (error) setError(friendlyError(error));
    else setSentTo(email);
  }

  if (sentTo) {
    return (
      <FormNotice>
        If an account exists for <strong>{sentTo}</strong>, a reset link is on its way. Open it in this browser.
      </FormNotice>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormError message={error} />
      <TextField id="email" label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  );
}

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await getSupabaseBrowserClient().auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setError(friendlyError(error));
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <FormNotice>Your password has been updated.</FormNotice>
        <Link href="/quest-tracker" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
          Go to the Quest Tracker
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormError message={error} />
      <TextField
        id="new-password"
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save password'}
      </Button>
    </form>
  );
}

export function AuthSwitchLink({ href, next, children }: { href: string; next: string; children: ReactNode }) {
  return (
    <Link href={withNext(href, next)} className="font-medium text-accent underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
