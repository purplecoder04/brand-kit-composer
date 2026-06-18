import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Library, Upload, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ProductionUI";

export const Route = createFileRoute("/_app/create")({
  head: () => ({ meta: [{ title: "Start Kit | Kit Factory" }] }),
  component: StartKitPage,
});

function StartKitPage() {
  return (
    <div className="p-8">
      <PageHeader
        eyebrow="Production start"
        title="Start a Kit"
        description="Create Kit has moved into the cleaner production flow. Start with an import, open the builder, or continue from the library."
      />

      <div className="grid max-w-5xl gap-4 md:grid-cols-3">
        <StartCard
          icon={<Upload className="h-5 w-5" />}
          title="Import Content"
          description="Upload or paste markdown, text, or Word content and turn it into builder blocks."
          to="/import"
          cta="Open Import"
        />
        <StartCard
          icon={<Wrench className="h-5 w-5" />}
          title="Open Builder"
          description="Build or edit pages directly using the current local draft."
          to="/builder"
          cta="Open Builder"
        />
        <StartCard
          icon={<Library className="h-5 w-5" />}
          title="Version Library"
          description="Reopen a saved kit, guide, package, or fillable field map."
          to="/version-library"
          cta="Open Library"
        />
      </div>
    </div>
  );
}

function StartCard({
  icon,
  title,
  description,
  to,
  cta,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  to: "/import" | "/builder" | "/version-library";
  cta: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#F4EFE6] text-[#4F2D68]">
          {icon}
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="min-h-[72px] text-sm leading-6" style={{ color: "#6b6470" }}>
          {description}
        </p>
        <Button asChild className="mt-4 w-full" style={{ background: "#4F2D68", color: "#fff" }}>
          <Link to={to}>{cta}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
