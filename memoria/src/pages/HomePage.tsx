import NotesList from '../components/NotesList';
import NoteEditor from '../components/NoteEditor';

export default function HomePage() {
  return (
    <div className="h-full flex flex-nowrap overflow-hidden">
      <NotesList />
      <NoteEditor />
    </div>
  );
}