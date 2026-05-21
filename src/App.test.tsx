import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("Workshop guide", () => {
  it("renders the main guide sections", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /build a visit prep sidecar/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /live workshop/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /prompt library/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /postmessage reference/i })).toBeInTheDocument();
  });

  it("shows the live workshop path with prompts and fallback support", () => {
    render(<App />);

    expect(screen.queryByLabelText(/workshop summary/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/model c architecture/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /live workshop path/i })).toBeInTheDocument();
    expect(screen.getAllByText(/45-minute core/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/75-minute extension/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /copy prompt/i })).not.toHaveLength(0);
    expect(screen.getAllByText(/fallback snippet/i).length).toBeGreaterThan(0);
  });

  it("applies the assigned app slot to workshop prompts", async () => {
    render(<App />);

    const input = screen.getByLabelText(/assigned app number/i);
    await userEvent.clear(input);
    await userEvent.type(input, "101");
    await userEvent.click(screen.getByRole("button", { name: /apply to prompts/i }));

    expect(screen.getByText(/using src\/apps\/app-101/i)).toBeInTheDocument();
    expect(screen.getAllByText(/src\/apps\/app-101/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\/api\/apps\/app-101\/smart\/launch/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\/api\/apps\/app-101\/smart\/callback/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\/app-101\/logout-complete/i).length).toBeGreaterThan(0);
  });

  it("includes the app-host template workflow in the prompt library", () => {
    render(<App />);

    expect(screen.getAllByText(/src\/app-template/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/copy the template/i)).toBeInTheDocument();
  });

  it("documents the real updatedPatient context-change payload", () => {
    render(<App />);

    expect(screen.getAllByText(/updatedPatient/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/patientContextChanged/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/console\.log every received message/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/patient-context\?updatedPatient/i).length).toBeGreaterThan(0);
  });

  it("uses legible dark text in the sidecar preview", () => {
    render(<App />);

    expect(screen.getByText("Alex Rivers")).toHaveClass("sidecar-patient-name");
  });

  it("renders the hero preview as an EHR workspace next to the sidecar app", () => {
    render(<App />);

    expect(screen.getByLabelText(/ehr chart workspace/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/embedded sidecar app/i)).toBeInTheDocument();
    expect(screen.getByText(/athenaone/i)).toBeInTheDocument();
  });

  it("copies a prompt to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<App />);
    await userEvent.click(screen.getAllByRole("button", { name: /copy prompt/i })[0]);

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("src/apps/app-007"));
    expect(screen.getByRole("button", { name: /^copied$/i })).toBeInTheDocument();
  });
});
