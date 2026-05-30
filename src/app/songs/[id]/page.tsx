import { SongView } from "./SongView";

// Static export (`output: "export"`) requires every dynamic route to declare
// its params at build time. Song ids only exist client-side (IndexedDB /
// Firestore), so we emit a single placeholder page shell here and let Firebase
// Hosting rewrite every `/songs/<id>` request to it; the client reads the real
// id from the URL via `useParams()`.
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function ViewSongPage() {
  return <SongView />;
}
