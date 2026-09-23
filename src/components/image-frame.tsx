import { mediaUrl } from "@/lib/media";

/**
 * A picture cropped to the proportions of the work it shows. Falls back to the
 * hatched placeholder until an image has been uploaded.
 *
 * `zoom` makes the picture grow inside the frame on hover.
 */
export function ImageFrame({
  imageKey,
  slot,
  ratio,
  alt,
  variant = "grid",
  zoom = false,
  loading = "lazy",
}: {
  imageKey: string | null;
  slot?: string;
  ratio: number;
  alt: string;
  variant?: "full" | "grid";
  zoom?: boolean;
  loading?: "lazy" | "eager";
}) {
  return (
    <div className="frame" style={{ aspectRatio: ratio }}>
      {imageKey ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(imageKey, variant)}
          alt={alt}
          loading={loading}
          className={zoom ? "zoomable" : undefined}
        />
      ) : (
        <div className={`slot${zoom ? " zoomable" : ""}`}>
          {slot && <span lang="en">{slot}</span>}
        </div>
      )}
    </div>
  );
}
