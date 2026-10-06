import { fireEvent, render, screen, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SummaryPanel } from "@/components/summary-panel";

vi.mock("@/lib/summary.functions", () => ({
  summarizeDocument: vi.fn(async () => ({ summary: "Generated summary." })),
}));

afterEach(cleanup);

describe("Summary panel", () => {
  it("preserves separate summary edits across collapse and expands without resetting source", () => {
    const insert = vi.fn();
    render(<SummaryPanel documentId="test" getText={() => "Original document text, unchanged."} onInsert={insert} />);
    fireEvent.click(screen.getByRole("button", { name: "Expand summary" }));
    fireEvent.change(screen.getByLabelText("Summary"), { target: { value: "My separate summary" } });
    fireEvent.change(screen.getByLabelText("Text to summarize"), { target: { value: "Custom source" } });
    fireEvent.click(screen.getByRole("button", { name: "Collapse summary" }));
    expect(screen.getByText("My separate summary")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Expand summary" }));
    expect(screen.getByLabelText("Summary")).toHaveValue("My separate summary");
    expect(screen.getByLabelText("Text to summarize")).toHaveValue("Custom source");
    expect(insert).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Insert into document" }));
    expect(insert).toHaveBeenCalledWith("My separate summary");
  });

  it("generates an editable summary without changing document text", async () => {
    const insert = vi.fn();
    render(<SummaryPanel documentId="test" getText={() => "Original document text, unchanged."} onInsert={insert} />);
    fireEvent.click(screen.getByRole("button", { name: "Expand summary" }));
    fireEvent.click(screen.getByRole("button", { name: "Generate summary" }));
    await waitFor(() => expect(screen.getByLabelText("Summary")).toHaveValue("Generated summary."));
    expect(insert).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Summary"), { target: { value: "Edited summary" } });
    expect(screen.getByLabelText("Summary")).toHaveValue("Edited summary");
  });
});