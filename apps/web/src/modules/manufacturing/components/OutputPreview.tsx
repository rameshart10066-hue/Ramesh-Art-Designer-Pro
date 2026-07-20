interface OutputPreviewProps {
  format: "svg" | "dxf" | null;
  output: string | null;
}

/**
 * SVG is safe to render inline via dangerouslySetInnerHTML because
 * `output` always comes from our own server-side generateManufacturingSvg
 * (which escapes any embedded text) — never arbitrary user HTML. DXF is
 * plain text, shown in a <pre> for copy/download rather than rendered.
 */
export function OutputPreview({ format, output }: OutputPreviewProps) {
  if (!format || !output) {
    return <p>Generate an output to preview it here.</p>;
  }

  if (format === "svg") {
    return <div data-testid="manufacturing-svg-preview" dangerouslySetInnerHTML={{ __html: output }} />;
  }

  return (
    <pre data-testid="manufacturing-dxf-preview" style={{ overflow: "auto", maxHeight: "300px" }}>
      {output}
    </pre>
  );
}
