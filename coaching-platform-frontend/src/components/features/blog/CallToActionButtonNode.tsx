import { useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { 
    Box, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, 
    FormControl, InputLabel, Select, MenuItem, type SelectChangeEvent 
} from '@mui/material';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callToAction: {
      setCallToAction: (options?: { buttonText?: string, buttonUrl?: string }) => ReturnType,
    }
  }
}

const CtaButtonComponent = (props: any) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [buttonText, setButtonText] = useState(props.node.attrs.buttonText || 'Know More');
    const [buttonUrl, setButtonUrl] = useState(props.node.attrs.buttonUrl || '');
    const ctaOptions = ['Buy Now', 'Enroll Now', 'Know More', 'Call Now', 'WhatsApp Now'];

    const handleSave = () => {
        props.updateAttributes({ buttonText, buttonUrl });
        setIsDialogOpen(false);
    };

    return (
        <NodeViewWrapper>
            <Box component="div" sx={{ my: 2, textAlign: 'center' }}>
                <Button
                    variant="contained"
                    onClick={() => props.editor.isEditable && setIsDialogOpen(true)}
                    href={!props.editor.isEditable ? buttonUrl : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {buttonText}
                </Button>
                
                {props.editor.isEditable && (
                    <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
                        <DialogTitle>Edit Call-to-Action Button</DialogTitle>
                        <DialogContent>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Button Text</InputLabel>
                                <Select value={buttonText} label="Button Text" onChange={(e: SelectChangeEvent) => setButtonText(e.target.value)}>
                                    {ctaOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField autoFocus margin="dense" label="Button Link/URL" type="url" fullWidth variant="standard" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave}>Save</Button>
                        </DialogActions>
                    </Dialog>
                )}
            </Box>
        </NodeViewWrapper>
    );
};

export default Node.create({
    name: 'callToAction',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            buttonText: { default: 'Know More' },
            buttonUrl: { default: '' },
        };
    },

    parseHTML() {
        return [{ 
            tag: 'div[data-cta-button]',
            getAttrs: dom => {
                const element = dom as HTMLElement;
                return {
                    buttonText: element.getAttribute('data-button-text'),
                    buttonUrl: element.getAttribute('data-button-url'),
                };
            },
        }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(this.options.HTMLAttributes, { 
            'data-cta-button': 'true',
            'data-button-text': HTMLAttributes.buttonText,
            'data-button-url': HTMLAttributes.buttonUrl,
        })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(CtaButtonComponent);
    },
    
    addCommands() {
        return {
            setCallToAction: (attributes) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: attributes,
                });
            },
        };
    },
});