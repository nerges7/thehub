'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import Paragraph from '@tiptap/extension-paragraph';
import { BoldIcon, ItalicIcon, ListIcon } from 'lucide-react';
import Heading from '@tiptap/extension-heading';
import { Button } from '@shopify/polaris';
import clsx from 'clsx';
import './editor.css'; // Creamos un CSS con estilos personalizados (lo explico abajo)

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Bold, Italic, BulletList, ListItem, Paragraph,  Heading.configure({
      levels: [2, 3],
    }),],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="rich-editor-container">
      <div className="toolbar">
        <button
  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
  className={clsx('tool-btn', { active: editor?.isActive('heading', { level: 2 }) })}
>
  H2
</button>

<button
  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
  className={clsx('tool-btn', { active: editor?.isActive('heading', { level: 3 }) })}
>
  H3
</button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={clsx('tool-btn', { active: editor.isActive('bold') })}
        >
          <BoldIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={clsx('tool-btn', { active: editor.isActive('italic') })}
        >
          <ItalicIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={clsx('tool-btn', { active: editor.isActive('bulletList') })}
        >
          <ListIcon size={16} />
        </button>
      </div>

      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}
