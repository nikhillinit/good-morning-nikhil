import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UIInput } from "@/components/ui-inputs";

describe("UIInput hydration", () => {
  afterEach(() => {
    cleanup();
  });

  it("preloads a persisted short-text value", () => {
    render(
      <UIInput
        type="short-text"
        config={{ placeholder: "Type here" }}
        initialValue="saved draft"
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("saved draft")).toBeInTheDocument();
  });

  it("preloads a persisted invest-or-pass choice", () => {
    render(
      <UIInput
        type="invest-or-pass"
        initialValue={{ choice: "out" }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "I'M OUT" })).toHaveClass("border-red-400");
  });
});
