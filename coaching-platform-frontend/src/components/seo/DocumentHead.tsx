import React from 'react';
import useDocumentHead, { type HeadTags } from '../../hooks/useDocumentHead';

type DocumentHeadProps = HeadTags;

const DocumentHead: React.FC<DocumentHeadProps> = (props) => {
    useDocumentHead(props);
    return null;
};

export default DocumentHead;
