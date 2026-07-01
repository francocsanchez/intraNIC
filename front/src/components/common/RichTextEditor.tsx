import { EditorContent, useEditor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Columns2,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Rows3,
  Table2,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { richTextExtensions } from "./richTextConfig";
import { hasMeaningfulRichText, sanitizeRichTextHtml } from "@/utils/richTextSanitize";

type RichTextEditorProps = {
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

type ToolbarButtonProps = {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
};

function ToolbarButton({
  active = false,
  disabled = false,
  label,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm transition ${
        active
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({
  disabled = false,
  onChange,
  placeholder = "Escribí el desarrollo...",
  value,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: richTextExtensions,
    content: sanitizeRichTextHtml(value || "<p></p>"),
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] px-4 py-3 text-sm text-gray-900 outline-none [&_a]:text-blue-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_hr]:my-4 [&_hr]:border-gray-300 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_tbody_td]:border [&_tbody_td]:border-gray-300 [&_tbody_td]:px-3 [&_tbody_td]:py-2 [&_thead_th]:border [&_thead_th]:border-gray-300 [&_thead_th]:bg-gray-100 [&_thead_th]:px-3 [&_thead_th]:py-2 [&_ul]:list-disc [&_ul]:pl-6",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = sanitizeRichTextHtml(currentEditor.getHTML());
      onChange(hasMeaningfulRichText(html) ? html : "");
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) return;
    const sanitized = sanitizeRichTextHtml(value || "<p></p>");

    if (editor.getHTML() !== sanitized) {
      editor.commands.setContent(sanitized, { emitUpdate: false });
    }
  }, [editor, value]);

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Ingresá la URL del enlace", previousUrl || "https://");

    if (url === null) return;

    const normalizedUrl = url.trim();
    if (!normalizedUrl) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: normalizedUrl }).run();
  };

  const insertTable = () => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const isTableActive = Boolean(editor?.isActive("table"));

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 bg-gray-50 p-3">
        <ToolbarButton
          label="Negrita"
          disabled={!editor || disabled}
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Itálica"
          disabled={!editor || disabled}
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Subrayado"
          disabled={!editor || disabled}
          active={editor?.isActive("underline")}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Título 1"
          disabled={!editor || disabled}
          active={editor?.isActive("heading", { level: 1 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Título 2"
          disabled={!editor || disabled}
          active={editor?.isActive("heading", { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Título 3"
          disabled={!editor || disabled}
          active={editor?.isActive("heading", { level: 3 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Lista con viñetas"
          disabled={!editor || disabled}
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Lista ordenada"
          disabled={!editor || disabled}
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Link"
          disabled={!editor || disabled}
          active={editor?.isActive("link")}
          onClick={setLink}
        >
          <Link2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Tabla"
          disabled={!editor || disabled}
          active={editor?.isActive("table")}
          onClick={insertTable}
        >
          <Table2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Separador"
          disabled={!editor || disabled}
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Alinear izquierda"
          disabled={!editor || disabled}
          active={editor?.isActive({ textAlign: "left" })}
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Centrar"
          disabled={!editor || disabled}
          active={editor?.isActive({ textAlign: "center" })}
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Alinear derecha"
          disabled={!editor || disabled}
          active={editor?.isActive({ textAlign: "right" })}
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight size={15} />
        </ToolbarButton>
      </div>

      {isTableActive ? (
        <div className="flex flex-wrap gap-2 border-b border-gray-200 bg-gray-50/80 px-3 pb-3">
          <ToolbarButton
            label="Agregar columna antes"
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().addColumnBefore().run()}
          >
            <Columns2 size={15} />
            <span className="ml-2 text-xs">+ Col antes</span>
          </ToolbarButton>
          <ToolbarButton
            label="Agregar columna después"
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().addColumnAfter().run()}
          >
            <Columns2 size={15} />
            <span className="ml-2 text-xs">+ Col después</span>
          </ToolbarButton>
          <ToolbarButton
            label="Eliminar columna"
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().deleteColumn().run()}
          >
            <Columns2 size={15} />
            <span className="ml-2 text-xs">Eliminar col</span>
          </ToolbarButton>
          <ToolbarButton
            label="Agregar fila arriba"
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().addRowBefore().run()}
          >
            <Rows3 size={15} />
            <span className="ml-2 text-xs">+ Fila arriba</span>
          </ToolbarButton>
          <ToolbarButton
            label="Agregar fila abajo"
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().addRowAfter().run()}
          >
            <Rows3 size={15} />
            <span className="ml-2 text-xs">+ Fila abajo</span>
          </ToolbarButton>
          <ToolbarButton
            label="Eliminar fila"
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().deleteRow().run()}
          >
            <Rows3 size={15} />
            <span className="ml-2 text-xs">Eliminar fila</span>
          </ToolbarButton>
          <ToolbarButton
            label="Eliminar tabla"
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().deleteTable().run()}
          >
            <Eraser size={15} />
            <span className="ml-2 text-xs">Borrar tabla</span>
          </ToolbarButton>
        </div>
      ) : null}

      <div className="relative bg-white">
        <EditorContent editor={editor} />
        {!hasMeaningfulRichText(value) ? (
          <div className="pointer-events-none absolute left-0 top-0 px-4 py-3 text-sm text-gray-400">{placeholder}</div>
        ) : null}
      </div>
    </div>
  );
}
