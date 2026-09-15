import ReadingsPanel from './readings-panel';

export const metadata = {
  title: 'My Readings | Settings',
};

export default function Page() {
  return (
    <div className="p-6 w-[70%] max-w-6xl mx-auto">
      <ReadingsPanel />
    </div>
  );
}
