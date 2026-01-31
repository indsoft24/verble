import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Box, Button } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    gatedDownload: {
      setGatedDownload: (options: { attachmentId: string, label: string }) => ReturnType,
    }
  }
}

const GatedDownloadComponent = (props: any) => {
    const { label } = props.node.attrs;

    return (
        <NodeViewWrapper>
            <Box contentEditable={false} sx={{ my: 2, p: 2, border: '2px dashed', borderColor: 'divider', borderRadius: 1, display: 'inline-block' }}>
                <Button
                    variant="contained"
                    startIcon={<FileDownloadIcon />}
                    sx={{ pointerEvents: 'none' }}
                >
                    {label || 'Download File'}
                </Button>
            </Box>
        </NodeViewWrapper>
    );
};

export default Node.create({
    name: 'gatedDownload',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            attachmentId: {
                default: null,
                parseHTML: element => element.getAttribute('data-attachment-id'),
                renderHTML: attributes => ({ 'data-attachment-id': attributes.attachmentId }),
            },
            label: {
                default: 'Download Now',
                parseHTML: element => element.getAttribute('data-label'),
                renderHTML: attributes => ({ 'data-label': attributes.label }),
            },
        };
    },

    parseHTML() {
        return [{ 
            tag: 'div[data-gated-download]',
        }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-gated-download': 'true' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(GatedDownloadComponent);
    },

    addCommands() {
        return {
            setGatedDownload: (options) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: {
                        attachmentId: options.attachmentId,
                        label: options.label,
                    },
                });
            },
        };
    },
});