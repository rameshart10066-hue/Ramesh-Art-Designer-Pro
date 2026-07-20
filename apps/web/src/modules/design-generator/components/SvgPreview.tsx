interface SvgPreviewProps {
  svg: string | null;
}

/**
 * Renders generated SVG markup. Safe to use dangerouslySetInnerHTML here
 * specifically because `svg` always comes from our own server-side
 * generateDesign() output (design-engine escapes any user text before
 * embedding it) — never from arbitrary/untrusted user-supplied markup.
 */
export function SvgPreview({ svg }: SvgPreviewProps) {
  if (!svg) {
    return <p>Fill in the form and generate a design to preview it here.</p>;
  }

  return <div data-testid="svg-preview" dangerouslySetInnerHTML={{ __html: svg }} />;
}
