import React from "react";
import Card from "./Card";

export default function EmptyState({ title = "Nothing here yet", message = "No data found for this view." }) {
  return (
    <Card className="py-10 text-center">
      <h3 className="text-lg font-semibold text-[var(--atlas-text-strong)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--atlas-muted)]">{message}</p>
    </Card>
  );
}
