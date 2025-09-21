"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Document from "@tiptap/extension-document"
import Paragraph from "@tiptap/extension-paragraph"
import Text from "@tiptap/extension-text"
import HardBreak from "@tiptap/extension-hard-break"
import { Bold, Italic, Strikethrough } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph.configure({
        HTMLAttributes: {
          class: 'mb-3 last:mb-0',
        },
      }),
      Text,
      HardBreak.configure({
        HTMLAttributes: {
          class: 'block my-2',
        },
      }),
      StarterKit.configure({
        document: false,
        paragraph: false,
        text: false,
        hardBreak: false,
        heading: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[120px] p-3",
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter') {
          if (event.shiftKey) {
            // Shift+Enter creates a hard break
            const { state, dispatch } = view
            const { selection } = state
            const hardBreak = state.schema.nodes.hardBreak
            if (hardBreak) {
              const transaction = state.tr.replaceSelectionWith(hardBreak.create())
              dispatch(transaction)
              return true
            }
          } else {
            // Regular Enter creates a new paragraph
            const { state, dispatch } = view
            const { selection } = state
            const paragraph = state.schema.nodes.paragraph
            if (paragraph) {
              const transaction = state.tr.replaceSelectionWith(paragraph.create())
              dispatch(transaction)
              return true
            }
          }
        }
        return false
      },
    },
    immediatelyRender: false, // Fix SSR hydration issue
  })

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-lg">
      <div className="border-b bg-gray-50 p-2 flex gap-1">
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-8 w-8 p-0"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-8 w-8 p-0"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("strike") ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className="h-8 w-8 p-0"
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent
        editor={editor}
        placeholder={placeholder}
        className="[&_.ProseMirror]:min-h-[120px] [&_.ProseMirror]:p-3 [&_.ProseMirror]:focus:outline-none"
      />
    </div>
  )
}