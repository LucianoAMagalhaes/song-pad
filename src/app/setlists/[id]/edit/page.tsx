import { SetlistEditor } from "./SetlistEditor";

// See `/songs/[id]/page.tsx` for why static export needs a placeholder param
// here; Firebase Hosting rewrites the real `/setlists/<id>/edit` to this shell.
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function EditSetlistPage() {
  return <SetlistEditor />;
}
