import type { ReactNode } from 'react';
import { Page } from '../components/ui/Page';

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <Page className="flex justify-center sm:items-center">
      <div className="w-full max-w-sm">{children}</div>
    </Page>
  );
}
