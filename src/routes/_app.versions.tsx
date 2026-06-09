import { createFileRoute } from "@tanstack/react-router";
import { useKitStore } from "@/lib/kit-store";

export const Route = createFileRoute("/_app/versions")({
  head: () => ({ meta: [{ title: "Version Library | Kit Factory" }] }),
  component: VersionsPage,
});

function VersionsPage() {
  const { state } = useKitStore();
  const versions = state.versions;

  return (
    <div className="p-10 max-w-7xl">
      <div
        className="text-[10px] uppercase tracking-[0.28em]"
        style={{ color: "#4F2D68" }}
      >
        Archive
      </div>
      <h1
        className="mt-1 text-4xl"
        style={{ fontFamily: "var(--font-display)", color: "#222026" }}
      >
        Version Library
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#6b6470" }}>
        Snapshots created from the Kit Builder.
      </p>

      <div
        className="mt-8 rounded-lg border overflow-hidden"
        style={{ borderColor: "#D8CEC2", background: "#FAF6F0" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-left"
              style={{ color: "#6b6470", background: "#F4EFE6" }}
            >
              {[
                "Kit Name",
                "Branch",
                "Version",
                "Exported",
                "QC",
                "Sale Ready",
                "DocHub",
                "Notes",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-[10px] uppercase tracking-[0.18em] font-semibold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {versions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: "#6b6470" }}>
                  No versions saved yet. Use Save Version in the Kit Builder.
                </td>
              </tr>
            ) : (
              versions.map((v) => (
                <tr key={v.id} style={{ borderTop: "1px solid #E7DFD2" }}>
                  <td className="px-4 py-3" style={{ fontWeight: 600 }}>{v.kitName}</td>
                  <td className="px-4 py-3">{v.branch}</td>
                  <td className="px-4 py-3">{v.version}</td>
                  <td className="px-4 py-3">{new Date(v.exportDate).toLocaleString()}</td>
                  <td className="px-4 py-3">{v.qcStatus}</td>
                  <td className="px-4 py-3">{v.saleReady ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">{v.dochubReady ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#6b6470" }}>{v.notes}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}