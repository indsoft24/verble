import React, { useCallback } from 'react';
import {
    Box, IconButton, Tooltip, Divider,
    Select, MenuItem, FormControl, InputLabel, type SelectChangeEvent
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import ImageIcon from '@mui/icons-material/Image';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import HighlightIcon from '@mui/icons-material/Highlight';

interface MenuBarProps {
    editor: any | null;
    onImageUploadClick: () => void;
}

const MenuBar: React.FC<MenuBarProps> = ({ editor, onImageUploadClick }) => {
    if (!editor) {
        return null;
    }

    const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('Enter link URL:', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
    }, [editor]);

    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', p: 1, borderBottom: '1px solid', borderColor: 'divider', mb: 1, position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper' }}>
            <Tooltip title="Bold"><IconButton onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().toggleBold()} color={editor.isActive('bold') ? 'primary' : 'default'}><FormatBoldIcon /></IconButton></Tooltip>
            <Tooltip title="Italic"><IconButton onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().toggleItalic()} color={editor.isActive('italic') ? 'primary' : 'default'}><FormatItalicIcon /></IconButton></Tooltip>
            <Tooltip title="Underline"><IconButton onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().toggleUnderline()} color={editor.isActive('underline') ? 'primary' : 'default'}><FormatUnderlinedIcon /></IconButton></Tooltip>
            <Tooltip title="Strike"><IconButton onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().toggleStrike()} color={editor.isActive('strike') ? 'primary' : 'default'}><StrikethroughSIcon /></IconButton></Tooltip>
            <Tooltip title="Inline Code"><IconButton onClick={() => editor.chain().focus().toggleCode().run()} disabled={!editor.can().toggleCode()} color={editor.isActive('code') ? 'primary' : 'default'}><CodeIcon /></IconButton></Tooltip>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />
            
            <FormControl size="small" sx={{ m: 0.5, minWidth: 120 }}>
                <InputLabel id="heading-select-label" sx={{ fontSize: '0.8rem' }}>Style</InputLabel>
                <Select
                    labelId="heading-select-label"
                    value={
                        editor.isActive('heading', { level: 1 }) ? '1' :
                        editor.isActive('heading', { level: 2 }) ? '2' :
                        editor.isActive('heading', { level: 3 }) ? '3' :
                        editor.isActive('heading', { level: 4 }) ? '4' : '0'
                    }
                    onChange={(e: SelectChangeEvent<string>) => {
                        const level = parseInt(e.target.value, 10);
                        if (level === 0) editor.chain().focus().setParagraph().run();
                        else editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 }).run();
                    }}
                    label="Style"
                    sx={{ fontSize: '0.8rem' }}
                >
                    <MenuItem value="0" sx={{ fontSize: '0.9rem' }}>Paragraph</MenuItem>
                    <MenuItem value="1" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Heading 1</MenuItem>
                    <MenuItem value="2" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Heading 2</MenuItem>
                    <MenuItem value="3" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Heading 3</MenuItem>
                    <MenuItem value="4" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Heading 4</MenuItem>
                </Select>
            </FormControl>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />
            
            <Tooltip title="Bullet List"><IconButton onClick={() => editor.chain().focus().toggleBulletList().run()} color={editor.isActive('bulletList') ? 'primary' : 'default'}><FormatListBulletedIcon /></IconButton></Tooltip>
            <Tooltip title="Ordered List"><IconButton onClick={() => editor.chain().focus().toggleOrderedList().run()} color={editor.isActive('orderedList') ? 'primary' : 'default'}><FormatListNumberedIcon /></IconButton></Tooltip>
            <Tooltip title="Blockquote"><IconButton onClick={() => editor.chain().focus().toggleBlockquote().run()} color={editor.isActive('blockquote') ? 'primary' : 'default'}><FormatQuoteIcon /></IconButton></Tooltip>
            <Tooltip title="Horizontal Rule"><IconButton onClick={() => editor.chain().focus().setHorizontalRule().run()}><HorizontalRuleIcon /></IconButton></Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />
            
            <Tooltip title="Set Link"><IconButton onClick={setLink} color={editor.isActive('link') ? 'primary' : 'default'}><LinkIcon /></IconButton></Tooltip>
            <Tooltip title="Unset Link"><span><IconButton onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')}> <LinkOffIcon /></IconButton> </span></Tooltip>
            <Tooltip title="Upload Image"><IconButton onClick={onImageUploadClick}><ImageIcon /></IconButton></Tooltip>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />
            
            <Tooltip title="Text Color">
                <IconButton onClick={() => { const color = window.prompt("Enter color (e.g., #RRGGBB, red):"); if (color) editor.chain().focus().setColor(color).run(); }} color={editor.isActive('textStyle') ? 'primary' : 'default'}>
                    <FormatColorTextIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Highlight Text">
                <IconButton onClick={() => editor.chain().focus().toggleHighlight({ color: '#ffcc00' }).run()} color={editor.isActive('highlight') ? 'primary' : 'default'}>
                    <HighlightIcon />
                </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />
            
            <Tooltip title="Clear Formats"><IconButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><FormatClearIcon /></IconButton></Tooltip>
            <Tooltip title="Undo"><span><IconButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}> <UndoIcon /></IconButton></span></Tooltip>
            <Tooltip title="Redo"><span> <IconButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} > <RedoIcon /> </IconButton> </span></Tooltip>
        </Box>
    );
};
export default MenuBar;