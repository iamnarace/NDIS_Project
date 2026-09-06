import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight, Lightbulb, ExternalLink } from 'lucide-react';

export function NdisBlogNewsSection() {
  const articles = [
    {
      image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80",
      tag: "NDIS Guides",
      readTime: "7 min read",
      title: "Important Changes Ahead: Mandatory Quality & Safety Reforms",
      excerpt: "From 2026, the NDIA and NDIS Commission are rolling out key quality and safety updates. Here is what every participant and family needs to know."
    },
    {
      image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80",
      tag: "NDIS News",
      readTime: "6 min read",
      title: "Participant Advisory Consultations: Shaping Regional NSW Care",
      excerpt: "The Department of Social Services continues community consultations to hear directly from rural and coastal NDIS participants in Clarence Valley."
    },
    {
      image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
      tag: "NDIS Guides",
      readTime: "7 min read",
      title: "NDIS Evidence Requirements Simplified: What the NDIA Looks For",
      excerpt: "Good clinical and functional evidence is the key difference between an approved support plan and delays. Learn how to structure reports."
    },
    {
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
      tag: "Community & Living",
      readTime: "6 min read",
      title: "Demystifying In-Home Respite & Accommodation in the NDIS",
      excerpt: "How short and medium-term respite options work, when they are funded, and how families can utilize respite allowances with complete peace of mind."
    }
  ];

  return (
    <section className="cleanSectionPadding ndisBlogSectionWrap">
      <div className="shell">
        <div className="sectionHeaderCenter">
          <span className="greenCategoryTag">FROM THE BLOG</span>
          <h2 className="sectionSerifTitle">A few reads picked for you</h2>
          <p className="sectionSubDesc">
            Tips, guides and updates on the NDIS, plan management and daily living supports.
          </p>
        </div>

        <div className="blogReadsGrid4">
          {articles.map((item, idx) => (
            <article key={idx} className="controlledCardPane blogCardPane">
              <div className="blogCardImgWrap">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={500}
                  height={280}
                  className="blogCardPhoto"
                />
              </div>
              <div className="blogCardContent">
                <div className="blogMetaTagsRow">
                  <span className="blogCatBadge">{item.tag}</span>
                  <span className="blogReadTime">
                    <Clock size={12} /> {item.readTime}
                  </span>
                </div>
                <h3 className="blogCardTitle">{item.title}</h3>
                <p className="blogCardExcerpt">{item.excerpt}</p>
                <div className="blogCardFooter">
                  <Link href="/faq" className="readMoreArticleLink">
                    <span>Read Article</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Suggest a Topic Bottom Callout Bar */}
        <div className="blogTopicSuggestRow">
          <div className="suggestTextCol">
            <h4>Want us to cover any other topic of your interest?</h4>
            <p>Have a question about NDIS, plan management or daily living? Let our team know and we will write about it.</p>
          </div>
          <div className="suggestActionsCol">
            <Link href="/faq" className="suggestOutlineBtn">
              <span>Read more articles</span>
              <ArrowRight size={15} />
            </Link>
            <Link href="/contact" className="suggestPrimaryBtn">
              <Lightbulb size={16} />
              <span>Suggest a topic</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default NdisBlogNewsSection;
