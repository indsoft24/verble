import React from 'react';
import useDocumentHead from '../../hooks/useDocumentHead'; 

interface DocumentHeadProps {
  title: string;
  description: string;
  canonicalUrl: string;
}

const DocumentHead: React.FC<DocumentHeadProps> = ({ title, description, canonicalUrl }) => {
  useDocumentHead({ title, description, canonicalUrl });
    return null; 
};

export default DocumentHead;
