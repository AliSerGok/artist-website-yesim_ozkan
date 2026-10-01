import { innerStyleAttrs, styleAttrs, type TextStyle } from "@/lib/type-style";

/**
 * A name with its italic tail — the year of a work, the span of a series, a
 * place. The comma belongs to the pair rather than to the tail, so a name
 * left without a year is written plainly, a year without a name stands on
 * its own, and neither of them means no line at all rather than a stray
 * comma hanging over the picture.
 */
export function TitleLine({
  title,
  aside,
  className,
  asideClassName = "text-mute-2",
  style,
  asideStyle,
  always = false,
}: {
  title: string;
  aside: string;
  className?: string;
  /** What the tail is coloured with, which differs over a picture. */
  asideClassName?: string;
  /** The face chosen for the name; the tail goes with it. */
  style?: TextStyle;
  /**
   * The face chosen for the tail itself -- a work's year, a series' span --
   * which is the one thing it does not take from the name: its weight and its
   * slant are the artist's to choose. Left unsaid the tail is slanted, which
   * is how every tail was written before any of them could be chosen.
   */
  asideStyle?: TextStyle;
  /** Kept on the page even with nothing in it, which the panel needs. */
  always?: boolean;
}) {
  const name = title.trim();
  const tail = aside.trim();

  // Slanted unless a face of its own has something to say about the slant.
  const tailClass = ["tl-aside", asideStyle ? "" : "italic", asideClassName]
    .filter(Boolean)
    .join(" ");

  if (!name && !tail && !always) return null;

  /*
   * Both halves are always written, empty or not, so the panel has somewhere
   * to put what is being typed. The comma between them belongs to the pair
   * rather than to either half, so the stylesheet draws it only when there
   * are two halves to separate -- see .tl-name in globals.css.
   */
  return (
    <div className={className} {...styleAttrs(style)}>
      <span className="tl-name">{name}</span>
      <span className={tailClass} {...innerStyleAttrs(asideStyle)}>
        {tail}
      </span>
    </div>
  );
}
