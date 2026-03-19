import ReadingsPanel from './readings-panel';

export const metadata = {
  title: 'My Readings | Settings',
};

export default function Page() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <ReadingsPanel />
    </div>
  );
}
