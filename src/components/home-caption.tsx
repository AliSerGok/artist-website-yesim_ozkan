import { TitleLine } from "@/components/title-line";
import { styleAttrs, type StyleMap } from "@/lib/type-style";

/**
 * The line written across a home slide: the name with its italic tail, and
 * the small line under it. The site lays it over the picture; the panel
 * shows the same thing over a dark strip, so what is typed is seen the way
 * it will be read.
 */
export function HomeCaption({
  title,
  aside,
  caption,
  styles,
  className = "home-cap",
  editing = false,
}: {
  title: string;
  aside: string;
  caption: string;
  styles: StyleMap<"title" | "caption" | "date">;
  className?: string;
  /** In the panel the small line stays put even while it is still empty. */
  editing?: boolean;
}) {
  return (
    <figcaption className={className}>
      <TitleLine
        title={title}
        aside={aside}
        className="home-cap-title font-serif text-[clamp(19px,2vw,26px)] leading-[1.2] text-bg"
        asideClassName="opacity-80"
        style={styles.title}
        asideStyle={styles.date}
        always={editing}
      />
      {(caption || editing) && (
        <div
          className="home-cap-line mt-[5px] text-[11px] tracking-[0.06em] text-[rgba(253,253,252,0.82)]"
          {...styleAttrs(styles.caption)}
        >
          {caption}
        </div>
      )}
    </figcaption>
  );
}
