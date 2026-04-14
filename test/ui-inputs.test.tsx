import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UIInput } from "@/components/ui-inputs";

afterEach(() => {
  cleanup();
});

describe("UIInput", () => {
  it("uses the configured start-button label", () => {
    render(
      <UIInput
        type="start-button"
        config={{ label: "Let's Go" }}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Let's Go" }),
    ).toBeInTheDocument();
  });

  it("submits relationship answers with the anonymous switch state", () => {
    const onSubmit = vi.fn();

    render(
      <UIInput
        type="relationship-picker"
        config={{
          options: ["Friend", "Family"],
          showAnonymousToggle: true,
        }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Friend" }));
    fireEvent.click(screen.getByRole("button", { name: "ANONYMITY: OFF" }));
    fireEvent.click(screen.getByRole("button", { name: "TUNE IN" }));

    expect(onSubmit).toHaveBeenCalledWith({
      relationship: "Friend",
      anonymous: true,
    });
  });
});
