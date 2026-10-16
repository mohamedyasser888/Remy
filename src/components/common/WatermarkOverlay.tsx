/**
 * Displays the R-with-star watermark for older images that were uploaded
 * before watermarking was enabled. New uploads already contain the mark.
 */
interface WatermarkOverlayProps {
  visible: boolean;
}

export function WatermarkOverlay({ visible }: WatermarkOverlayProps) {
  if (!visible) return null;

  return (
    <span
      aria-hidden="true"
      className="absolute bottom-1.5 right-1.5 z-[1] block h-6 w-7"
    >
      <img
        src="/rrrr-transparent.png"
        alt=""
        className="h-full w-full object-contain opacity-90"
      />
    </span>
  );
}
