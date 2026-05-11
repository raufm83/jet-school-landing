"use client";

import React from "react";
import SchemaWebPage from "./schema-webpage";

class SchemaErrorBoundary extends React.Component<
  { locale: string; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { locale: string; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    // Schema render failed; render nothing so page still works
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function SchemaWebPageSafe({ locale }: { locale: string }) {
  return (
    <SchemaErrorBoundary locale={locale}>
      <SchemaWebPage locale={locale} />
    </SchemaErrorBoundary>
  );
}
