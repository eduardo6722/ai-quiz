import { render, screen } from "@testing-library/react";
import HomePage from "./page";

describe("home shell", () => {
  it("renders English heading text and a health action", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: /AI Quiz Generator is ready to grow/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View API health/i })).toBeInTheDocument();
  });
});
