import '../opus.css';
import ProductFeedback from '@/components/ui/ProductFeedback';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="opusApp">{children}<ProductFeedback /></div>;
}
