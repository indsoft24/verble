import { useEffect } from 'react';
import { DEFAULT_ROBOTS } from '../config/siteSeo';

export interface HeadTags {
    title: string;
    description: string;
    canonicalUrl: string;
    robots?: string;
    ogImage?: string;
    ogType?: string;
}

function setMetaName(name: string, content: string) {
    if (!content) return;
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function setMetaProperty(property: string, content: string) {
    if (!content) return;
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function setLinkRel(rel: string, href: string) {
    if (!href) return;
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
    }
    el.setAttribute('href', href);
}

const useDocumentHead = (tags: HeadTags) => {
    const { title, description, canonicalUrl, robots = DEFAULT_ROBOTS, ogImage, ogType = 'website' } = tags;

    useEffect(() => {
        if (title) {
            document.title = title;
        }

        setMetaName('description', description);
        setMetaName('robots', robots);
        setLinkRel('canonical', canonicalUrl);

        setMetaProperty('og:title', title);
        setMetaProperty('og:description', description);
        setMetaProperty('og:url', canonicalUrl);
        setMetaProperty('og:type', ogType);
        setMetaProperty('og:site_name', 'Verble');
        if (ogImage) {
            setMetaProperty('og:image', ogImage);
        }

        setMetaName('twitter:card', ogImage ? 'summary_large_image' : 'summary');
        setMetaName('twitter:title', title);
        setMetaName('twitter:description', description);
        if (ogImage) {
            setMetaName('twitter:image', ogImage);
        }
    }, [title, description, canonicalUrl, robots, ogImage, ogType]);
};

export default useDocumentHead;
