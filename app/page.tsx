import { redirect } from 'next/navigation';

/**
 * Root Page: By default, every user comes to the login page only.
 */
export default function RootPage() {
  redirect('/login');
}

