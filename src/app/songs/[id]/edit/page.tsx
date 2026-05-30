import { SongEditor } from "./SongEditor";

// See `/songs/[id]/page.tsx` for why static export needs a placeholder param
// here; Firebase Hosting rewrites the real `/songs/<id>/edit` to this shell.
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function EditSongPage() {
  return <SongEditor />;
}
