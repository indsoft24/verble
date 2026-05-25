import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Box, Paper, Divider, IconButton, Tooltip, Typography,
  Menu, Grid, FormControl, InputLabel, Select, MenuItem, type SelectChangeEvent
} from '@mui/material';
import {
  FormatBold, FormatItalic, StrikethroughS, FormatQuote, Code, FormatListBulleted, FormatListNumbered,
  FormatAlignLeft, FormatAlignCenter, FormatAlignRight,
  AddPhotoAlternate, TableChart, AddLink,
  Delete as DeleteTableIcon,
  ArrowUpward as AddRowBeforeIcon,
  ArrowDownward as AddRowAfterIcon,
  ArrowBack as AddColBeforeIcon,
  ArrowForward as AddColAfterIcon,
  DeleteSweep as DeleteRowIcon,
  DeleteOutline as DeleteColIcon,
  FormatUnderlined, LinkOff, Highlight as HighlightIcon, Link as LinkIcon, AttachFile as AddFileIcon
} from '@mui/icons-material';

// Tiptap Extensions
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CallToActionButton from './CallToActionButtonNode';
import TextStyle from '@tiptap/extension-text-style';
import { FontSize } from './FontSizeExtension';
import GatedDownloadNode from './GatedDownloadNode';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';

import { uploadBlogContentImage } from '../../../services/blogAdminService';

interface MenuBarProps {
  editor: any;
  onImageUploadClick: () => void;
  onTableIconClick: (event: React.MouseEvent<HTMLElement>) => void;
  onAddGatedFileClick: () => void;

}

const MenuBar: React.FC<MenuBarProps> = ({ editor, onImageUploadClick, onTableIconClick, onAddGatedFileClick }) => {
  if (!editor) return null;

  const setLink = useCallback(() => {
    const url = window.prompt('URL', editor.getAttributes('link').href);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  }, [editor]);

  const fontSizes = ['8px', '10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px', '48px'];

  const handleFontSizeChange = (event: SelectChangeEvent<string>) => {
    const size = event.target.value;
    if (size === 'default') {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(size).run();
    }
  };

  return (
    <Paper elevation={2} sx={{ display: 'flex', flexWrap: 'wrap', p: 1, position: 'sticky', top: 0, zIndex: 1000, background: '#fff' }}>
      <Tooltip title="Bold"><IconButton onClick={() => editor.chain().focus().toggleBold().run()} color={editor.isActive('bold') ? 'primary' : 'default'}><FormatBold /></IconButton></Tooltip>
      <Tooltip title="Italic"><IconButton onClick={() => editor.chain().focus().toggleItalic().run()} color={editor.isActive('italic') ? 'primary' : 'default'}><FormatItalic /></IconButton></Tooltip>
      <Tooltip title="Underline"><IconButton onClick={() => editor.chain().focus().toggleUnderline().run()} color={editor.isActive('underline') ? 'primary' : 'default'}><FormatUnderlined /></IconButton></Tooltip>
      <Tooltip title="Strike"><IconButton onClick={() => editor.chain().focus().toggleStrike().run()} color={editor.isActive('strike') ? 'primary' : 'default'}><StrikethroughS /></IconButton></Tooltip>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      <Tooltip title="Text Color">
        <input
          type="color"
          onChange={event => editor.chain().focus().setColor(event.target.value).run()}
          value={editor.getAttributes('textStyle').color || '#000000'}
          style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', marginLeft: '4px' }}
        />
      </Tooltip>
      <Tooltip title="Highlight Text">
        <IconButton onClick={() => editor.chain().focus().toggleHighlight({ color: '#ffc107' }).run()} color={editor.isActive('highlight') ? 'primary' : 'default'}>
          <HighlightIcon />
        </IconButton>
      </Tooltip>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      <FormControl size="small" sx={{ m: 0.5, minWidth: 120 }}>
        <InputLabel>Style</InputLabel>
        <Select
          value={
            editor.isActive('heading', { level: 1 }) ? 'h1' :
              editor.isActive('heading', { level: 2 }) ? 'h2' :
                editor.isActive('heading', { level: 3 }) ? 'h3' :
                  editor.isActive('heading', { level: 4 }) ? 'h4' :
                    editor.isActive('heading', { level: 5 }) ? 'h5' :
                      editor.isActive('heading', { level: 6 }) ? 'h6' : 'p'
          }
          onChange={(e: SelectChangeEvent) => {
            const value = e.target.value;
            if (value === 'p') {
              editor.chain().focus().setParagraph().run();
            } else {
              const level = parseInt(value.replace('h', '')) as 1 | 2 | 3 | 4 | 5 | 6;
              editor.chain().focus().toggleHeading({ level }).run();
            }
          }}
          label="Style"
        >
          <MenuItem value="p">Paragraph</MenuItem>
          <MenuItem value="h1">Heading 1</MenuItem>
          <MenuItem value="h2">Heading 2</MenuItem>
          <MenuItem value="h3">Heading 3</MenuItem>
          <MenuItem value="h4">Heading 4</MenuItem>
          <MenuItem value="h5">Heading 5</MenuItem>
          <MenuItem value="h6">Heading 6</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ m: 0.5, minWidth: 100 }}>
        <InputLabel>Font Size</InputLabel>
        <Select
          value={editor.getAttributes('textStyle').fontSize || 'default'}
          onChange={handleFontSizeChange}
          label="Font Size"
        >
          <MenuItem value="default"><em>Default</em></MenuItem>
          {fontSizes.map(size => <MenuItem key={size} value={size}>{size}</MenuItem>)}
        </Select>
      </FormControl>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Tooltip title="Align Left"><IconButton onClick={() => editor.chain().focus().setTextAlign('left').run()} color={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}><FormatAlignLeft /></IconButton></Tooltip>
      <Tooltip title="Align Center"><IconButton onClick={() => editor.chain().focus().setTextAlign('center').run()} color={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}><FormatAlignCenter /></IconButton></Tooltip>
      <Tooltip title="Align Right"><IconButton onClick={() => editor.chain().focus().setTextAlign('right').run()} color={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}><FormatAlignRight /></IconButton></Tooltip>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      <Tooltip title="Bullet List"><IconButton onClick={() => editor.chain().focus().toggleBulletList().run()} color={editor.isActive('bulletList') ? 'primary' : 'default'}><FormatListBulleted /></IconButton></Tooltip>
      <Tooltip title="Ordered List"><IconButton onClick={() => editor.chain().focus().toggleOrderedList().run()} color={editor.isActive('orderedList') ? 'primary' : 'default'}><FormatListNumbered /></IconButton></Tooltip>
      <Tooltip title="Blockquote"><IconButton onClick={() => editor.chain().focus().toggleBlockquote().run()} color={editor.isActive('blockquote') ? 'primary' : 'default'}><FormatQuote /></IconButton></Tooltip>
      <Tooltip title="Code Block"><IconButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} color={editor.isActive('codeBlock') ? 'primary' : 'default'}><Code /></IconButton></Tooltip>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      <Tooltip title="Set Link"><IconButton onClick={setLink} color={editor.isActive('link') ? 'primary' : 'default'}><LinkIcon /></IconButton></Tooltip>
      <Tooltip title="Remove Link"><span><IconButton onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')}><LinkOff /></IconButton></span></Tooltip>
      <Tooltip title="Upload Image"><IconButton onClick={onImageUploadClick}><AddPhotoAlternate /></IconButton></Tooltip>
      <Tooltip title="Insert Table"><IconButton onClick={onTableIconClick}><TableChart /></IconButton></Tooltip>
      <Tooltip title="Add CTA Button"><IconButton onClick={() => editor.chain().focus().setCallToAction().run()}><AddLink /></IconButton></Tooltip>
      <Tooltip title="Add Gated File Download"><IconButton onClick={onAddGatedFileClick}><AddFileIcon /></IconButton></Tooltip>
      {editor.isActive('table') && (
        <>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <Tooltip title="Add Column Before"><IconButton onClick={() => editor.chain().focus().addColumnBefore().run()}><AddColBeforeIcon /></IconButton></Tooltip>
          <Tooltip title="Add Column After"><IconButton onClick={() => editor.chain().focus().addColumnAfter().run()}><AddColAfterIcon /></IconButton></Tooltip>
          <Tooltip title="Delete Column"><IconButton onClick={() => editor.chain().focus().deleteColumn().run()}><DeleteColIcon /></IconButton></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />
          <Tooltip title="Add Row Before"><IconButton onClick={() => editor.chain().focus().addRowBefore().run()}><AddRowBeforeIcon /></IconButton></Tooltip>
          <Tooltip title="Add Row After"><IconButton onClick={() => editor.chain().focus().addRowAfter().run()}><AddRowAfterIcon /></IconButton></Tooltip>
          <Tooltip title="Delete Row"><IconButton onClick={() => editor.chain().focus().deleteRow().run()}><DeleteRowIcon /></IconButton></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />
          <Tooltip title="Delete Table"><IconButton onClick={() => editor.chain().focus().deleteTable().run()}><DeleteTableIcon color="error" /></IconButton></Tooltip>
        </>
      )}
    </Paper>
  );
};

interface TableCreatorProps {
  anchorEl: null | HTMLElement;
  onClose: () => void;
  onSelect: (rows: number, cols: number) => void;
}

const TableCreator: React.FC<TableCreatorProps> = ({ anchorEl, onClose, onSelect }) => {
  const [grid, setGrid] = useState({ rows: 1, cols: 1 });
  const handleSelect = () => {
    onSelect(grid.rows, grid.cols);
    onClose();
  };
  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose} sx={{ p: 2 }}>
      <Box sx={{ p: 2, width: 240 }}>
        <Typography>Insert Table: {grid.rows} x {grid.cols}</Typography>
        <Grid container spacing={0.5} sx={{ mt: 1, cursor: 'pointer' }}>
          {Array.from({ length: 100 }).map((_, index) => {
            const row = Math.floor(index / 10) + 1;
            const col = (index % 10) + 1;
            return (
              <Grid key={index}>
                <Paper
                  variant="outlined"
                  onMouseEnter={() => setGrid({ rows: row, cols: col })}
                  onClick={handleSelect}
                  sx={{
                    height: 20, width: 20,
                    backgroundColor: (row <= grid.rows && col <= grid.cols) ? 'primary.light' : 'grey.200',
                  }}
                />
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Menu>
  );
};

interface TiptapEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  readOnly?: boolean;
  onEditorReady?: (editor: any) => void;
  onAddGatedFileClick: () => void;
  attachmentToInsert: { id: string; label: string } | null;
  onAttachmentInserted: () => void;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange, readOnly = false, onEditorReady, onAddGatedFileClick, attachmentToInsert, onAttachmentInserted }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tableMenuAnchor, setTableMenuAnchor] = useState<null | HTMLElement>(null);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

  const transformPastedHTMLForFontSize = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;
    const tagsToStyle = ['p', 'li', 'td', 'th', 'div', 'blockquote'];
    const elements = body.querySelectorAll(tagsToStyle.join(','));

    elements.forEach(el => {
      if (el.querySelector('span[data-styled="true"]')) {
        return;
      }
      const span = doc.createElement('span');
      span.style.fontSize = '14px';
      span.dataset.styled = 'true'; 
      while (el.firstChild) {
        span.appendChild(el.firstChild);
      }
      el.appendChild(span);
    });

    return body.innerHTML;
  };


  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: true }),
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
      GatedDownloadNode,
      CallToActionButton,
      TextStyle,
      FontSize,
    ],
    content: content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onCreate({ editor }) {
      if (onEditorReady) {
        onEditorReady(editor);
      }
    },
    editorProps: {
      attributes: {
        'data-gramm': 'false',
        'spellcheck': 'false',
      },
      transformPastedHTML(html) {
        return transformPastedHTMLForFontSize(html);
      },
    },
  });

  // Track previous content to avoid unnecessary updates
  const previousContentRef = useRef<string>(content);

  // Update editor content when content prop changes (e.g., when loading data for editing)
  useEffect(() => {
    if (!editor) return;
    
    const normalizedContent = content || '';
    const currentEditorHTML = editor.getHTML();
    
    // Only update if:
    // 1. Content prop has changed from previous value (external update, not from user typing)
    // 2. Current editor content is different from new content prop
    if (normalizedContent !== previousContentRef.current) {
      // Check if editor content is different from the new content
      // This prevents unnecessary updates when content is already in sync
      if (currentEditorHTML !== normalizedContent) {
        // Update editor content without triggering onChange to avoid loops
        editor.commands.setContent(normalizedContent, false);
      }
      previousContentRef.current = normalizedContent;
    }
  }, [content, editor]);

  useEffect(() => {
    if (attachmentToInsert && editor) {
      editor.chain().focus().setGatedDownload({
        attachmentId: attachmentToInsert.id,
        label: attachmentToInsert.label,
      }).run();
      onAttachmentInserted();
    }
  }, [attachmentToInsert, editor, onAttachmentInserted]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editor) {
      try {
        const { imageUrl: uploadedImageUrl } = await uploadBlogContentImage(file);

        if (uploadedImageUrl) {
          const url = new URL(uploadedImageUrl);
          const pathSegments = url.pathname.split('/');
          const fileName = pathSegments[pathSegments.length - 1];
          const secureImageUrl = `${apiBaseUrl}/blog/content-image/${fileName}`;
          editor.chain().focus().setImage({ src: secureImageUrl }).run();
        }
      } catch (error) {
        alert("Image upload failed. Please try again.");
      }
    }
  };

  const handleInsertTable = (rows: number, cols: number) => {
    editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
  };

  return (
    <Box sx={{ border: '1px solid #ccc', borderRadius: 1 }}>
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />
      {editor && <MenuBar editor={editor} onImageUploadClick={() => fileInputRef.current?.click()} onTableIconClick={(e) => setTableMenuAnchor(e.currentTarget)} onAddGatedFileClick={onAddGatedFileClick} />}

      <TableCreator
        anchorEl={tableMenuAnchor}
        onClose={() => setTableMenuAnchor(null)}
        onSelect={handleInsertTable}
      />
      <Box sx={{ p: 2, minHeight: 300, overflowX: 'auto', '& .ProseMirror': { outline: 'none' }, '& table': { borderCollapse: 'collapse', width: '100%', minWidth: '600px' }, '& td, & th': { border: '1px solid #ccc', padding: '8px', verticalAlign: 'top' }, '& th': { fontWeight: 'bold', backgroundColor: '#f2f2f2', textAlign: 'left' } }}>
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
};

export default TiptapEditor;