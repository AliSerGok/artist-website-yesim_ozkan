import { styleAttrs, type TextStyle } from "@/lib/type-style";

/**
 * How every edit page in the panel is laid out: a card per thing, showing
 * what it will look like, with its fields folded away behind one button.
 * Only one card on a page is open at a time, so the page reads as the page
 * rather than as a wall of boxes.
 */

/** The single name that makes the cards of one page one accordion. */
export const FOLD_GROUP = "panel-card";

/** What live editing writes to, inside a card's preview. */
export const LIVE_TEXT = ".adm-live-text";

export function FieldCard({
  label,
  hint,
  tools,
  preview,
  open = false,
  children,
}: {
  label: string;
  /** What is behind the button, said before it is pressed. */
  hint: string;
  /** Buttons that belong to the card itself, not to its fields. */
  tools?: React.ReactNode;
  preview: React.ReactNode;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="adm-card flex flex-col gap-3.5" data-card>
      <div className="adm-card-head">
        <span className="label">{label}</span>
        <span className="adm-lang">TR</span>
        {tools && (
          <div className="ml-auto flex items-center gap-1.5">{tools}</div>
        )}
      </div>

      <div className="adm-preview" data-preview>
        {preview}
      </div>

      <details
        className="adm-fold border-t border-rule pt-3"
        name={FOLD_GROUP}
        open={open}
      >
        <summary>
          <span className="adm-btn shrink-0">
            <span data-fold="shut">Düzenle</span>
            <span data-fold="open">Kapat</span>
          </span>
          <span className="adm-note min-w-0 flex-1 truncate">{hint}</span>
        </summary>

        <div className="mt-5">{children}</div>
      </details>
    </div>
  );
}

/**
 * A field's text as the site will set it. The class is what the panel's live
 * editing writes into, so what is typed shows up here as it is typed.
 */
export function FieldPreview({
  value,
  style,
  kind = "line",
  empty = "Henüz bir şey yazılmadı.",
}: {
  value: string;
  style: TextStyle;
  kind?: "title" | "line" | "prose";
  /** Said in the panel's own voice when there is nothing to show yet. */
  empty?: string;
}) {
  const shape =
    kind === "title"
      ? "font-serif text-[20px] leading-[1.25]"
      : kind === "prose"
        ? "adm-prose text-[14px] leading-[1.7] text-ink-soft"
        : "text-[13px] leading-[1.6] text-ink-soft";

  if (kind === "prose") {
    const paragraphs = value.split(/\n\s*\n/).filter((line) => line.trim());

    return (
      <div className={`adm-live-text ${shape}`} {...styleAttrs(style)}>
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        {paragraphs.length === 0 && <p className="text-mute-3">{empty}</p>}
      </div>
    );
  }

  return (
    <div className={`adm-live-text ${shape}`} {...styleAttrs(style)}>
      {value || <span className="text-mute-3">{empty}</span>}
    </div>
  );
}
