"use client";

import type { UseDesignReturn } from "@/lib/hooks/useDesign";

type Props = { api: UseDesignReturn };

export function InfoPanel({ api }: Props) {
  const { design, dimensions, bom, issues } = api;

  return (
    <aside className="flex h-full w-full flex-col gap-4 overflow-auto border-l border-slate-200 bg-slate-50 p-4 text-sm">
      <Section title="Design">
        <Row label="Name" value={design.meta.name} />
        <Row label="Cubes" value={design.cubes.length.toString()} />
        <Row
          label="Dimensions"
          value={
            dimensions
              ? `${dimensions.widthMm} × ${dimensions.heightMm} mm  (${dimensions.widthM.toFixed(2)} × ${dimensions.heightM.toFixed(2)} m)`
              : "—"
          }
        />
      </Section>

      {issues.length > 0 && (
        <Section title="Validation" tone="warning">
          <ul className="space-y-1 text-amber-800">
            {issues.map((issue) =>
              issue.code === "empty" ? (
                <li key="empty">Design is empty — start placing cubes.</li>
              ) : (
                <li key="disconnected">
                  ⚠ Design has {issue.componentCount} disconnected sections.
                  Bridge them or remove the stray cubes.
                </li>
              ),
            )}
          </ul>
        </Section>
      )}

      <Section title="Bill of materials (placeholder rules)">
        <div className="mb-2 grid grid-cols-3 gap-2 text-xs text-slate-500">
          <div>Cubes</div>
          <div>Internal joins</div>
          <div>Exposed edges</div>
          <div className="text-slate-900 font-semibold">{bom.cubeCount}</div>
          <div className="text-slate-900 font-semibold">
            {bom.internalConnections}
          </div>
          <div className="text-slate-900 font-semibold">
            {bom.exposedEdges}
          </div>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-1 pr-2">Code</th>
              <th className="py-1 pr-2">Item</th>
              <th className="py-1 text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {bom.lines.map((line) => (
              <tr key={line.code} className="border-t border-slate-200">
                <td className="py-1 pr-2 font-mono text-xs">{line.code}</td>
                <td className="py-1 pr-2 text-slate-700">{line.label}</td>
                <td className="py-1 text-right font-semibold">
                  {line.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-slate-500">
          BOM rules are placeholders — real connection specs will be swapped in
          once the client supplies them.
        </p>
      </Section>

      <Section title="Tips">
        <ul className="list-disc space-y-1 pl-4 text-slate-600 text-xs">
          <li>Click or drag to place cubes.</li>
          <li>Right-click a cube to remove it (or switch to Remove tool).</li>
          <li>Hold Space and drag to pan; scroll wheel to zoom.</li>
          <li>Ctrl / ⌘ + Z to undo, Ctrl / ⌘ + Shift + Z to redo.</li>
        </ul>
      </Section>
    </aside>
  );
}

function Section({
  title,
  children,
  tone,
}: {
  title: string;
  children: React.ReactNode;
  tone?: "warning";
}) {
  return (
    <section
      className={`rounded-lg border p-3 ${
        tone === "warning"
          ? "border-amber-300 bg-amber-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 py-0.5">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}
