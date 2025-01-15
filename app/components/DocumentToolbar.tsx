import { type Editor } from '@tiptap/react'
import { Toggle } from "@/components/ui/toggle"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LucideIcon } from 'lucide-react'
import { 
  Bold, 
  Italic, 
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code2,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Strikethrough,
  Table,
  Link,
  Undo,
  Redo,
  FileDown
} from 'lucide-react'

interface ToolbarButtonProps {
  icon: LucideIcon;
  title: string;
  action: () => void;
  isActive?: boolean;
}

interface DocumentToolbarProps {
  editor: Editor | null;
  onExport?: () => void;
  ExportButton?: React.ComponentType;
}

export function DocumentToolbar({ editor, ExportButton }: DocumentToolbarProps) {
  if (!editor) return null

  const ToolbarButton = ({ icon: Icon, title, action, isActive = false }: ToolbarButtonProps) => (
    <Toggle
      size="sm"
      pressed={isActive}
      onPressedChange={action}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </Toggle>
  )

  return (
    <div className="border-b p-2 flex flex-wrap gap-2 items-center">
      {/* Text Formatting */}
      <ToolbarButton
        icon={Bold}
        title="Bold"
        action={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
      />
      <ToolbarButton
        icon={Italic}
        title="Italic"
        action={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
      />
      <ToolbarButton
        icon={Strikethrough}
        title="Strikethrough"
        action={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
      />

      <Separator orientation="vertical" className="h-6" />

      {/* Headings */}
      <ToolbarButton
        icon={Heading1}
        title="Heading 1"
        action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
      />
      <ToolbarButton
        icon={Heading2}
        title="Heading 2"
        action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
      />
      <ToolbarButton
        icon={Heading3}
        title="Heading 3"
        action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
      />

      <Separator orientation="vertical" className="h-6" />

      {/* Lists */}
      <ToolbarButton
        icon={List}
        title="Bullet List"
        action={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
      />
      <ToolbarButton
        icon={ListOrdered}
        title="Numbered List"
        action={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
      />

      <Separator orientation="vertical" className="h-6" />

      {/* Alignment */}
      <ToolbarButton
        icon={AlignLeft}
        title="Align Left"
        action={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
      />
      <ToolbarButton
        icon={AlignCenter}
        title="Align Center"
        action={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
      />
      <ToolbarButton
        icon={AlignRight}
        title="Align Right"
        action={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
      />

      <Separator orientation="vertical" className="h-6" />

      {/* Special Blocks */}
      <ToolbarButton
        icon={Code2}
        title="Code Block"
        action={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
      />
      <ToolbarButton
        icon={Quote}
        title="Blockquote"
        action={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
      />
      <ToolbarButton
        icon={Table}
        title="Insert Table"
        action={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      />

      <Separator orientation="vertical" className="h-6" />

      {/* History */}
      <ToolbarButton
        icon={Undo}
        title="Undo"
        action={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        icon={Redo}
        title="Redo"
        action={() => editor.chain().focus().redo().run()}
      />

      <div className="ml-auto">
        {ExportButton && <ExportButton />}
      </div>
    </div>
  )
}
