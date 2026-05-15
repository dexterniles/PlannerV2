export function EditorSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="h-4 w-2/3 rounded bg-bg-hover" />
      <div className="h-4 w-full rounded bg-bg-hover" />
      <div className="h-4 w-5/6 rounded bg-bg-hover" />
      <div className="h-4 w-1/2 rounded bg-bg-hover" />
    </div>
  );
}
