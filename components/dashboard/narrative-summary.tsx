/**
 * A plain-language written summary of the period — the "read this instead
 * of the charts" card. No chart shape fits free-form prose (per the
 * dataviz skill: sometimes the right answer isn't a chart), so this is just
 * well-set text; `ChartCard`'s title/description still carries the header.
 */
export function NarrativeSummary({ text }: { text: string }) {
  return <p className="text-xs leading-6 text-foreground">{text}</p>;
}
