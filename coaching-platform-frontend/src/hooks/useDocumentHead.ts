import { useEffect } from 'react';

interface HeadTags {
  title: string;
  description: string;
  canonicalUrl: string;
}

const useDocumentHead = (tags: HeadTags) => {
  useEffect(() => {
    const { title, description, canonicalUrl } = tags;

    // Set document title
    if (title) {
      document.title = title;
    }

    // Find or create the meta description tag
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    // Find or create the canonical link tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Cleanup function to reset tags when the component unmounts
    return () => {
        // You can decide if you want to reset the title or leave it
        // document.title = 'Your Default Site Title'; 
    };
  }, [tags]); // Re-run effect if tags change
};

export default useDocumentHead;
