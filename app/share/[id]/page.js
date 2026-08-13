/**
 * Share page — redirects to /builder/[id] for backwards compatibility.
 * The builder profile page has proper OG metadata for social previews.
 */

import { redirect } from 'next/navigation';

export default async function SharePage({ params }) {
  const { id } = await params;
  redirect(`/builder/${id}`);
}
