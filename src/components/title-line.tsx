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
}: {
  title: string;
  aside: string;
  className?: string;
  /** What the italic tail is coloured with, which differs over a picture. */
  asideClassName?: string;
}) {
  const name = title.trim();
  const tail = aside.trim();

  if (!name && !tail) return null;

  return (
    <div className={className}>
      {name}
      {tail && (
        <span className={`italic ${asideClassName}`}>
          {name ? ", " : ""}
          {tail}
        </span>
      )}
    </div>
  );
}
