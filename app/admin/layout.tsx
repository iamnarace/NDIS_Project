import '../opus.css';
import ProductFeedback from '@/components/ui/ProductFeedback';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ProductFeedback />
    </>
  );
}
