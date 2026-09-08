export default function LoadingRows({ label = 'Loading records' }: { label?: string }) {
  return <div className="ocSkeleton" role="status" aria-label={label}><span /><span /><span /></div>;
}
