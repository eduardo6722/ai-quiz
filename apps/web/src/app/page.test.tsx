import { render, screen } from "@testing-library/react";
import HomePage from "./page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

describe("home setup", () => {
  it("renders English product copy and the generate action", () => {
    render(<HomePage />);
    expect(screen.getByText("Learn through questions")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Turn what you read into what you know/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate quiz" })).toBeInTheDocument();
    expect(screen.getByLabelText("Topic")).toBeInTheDocument();
    expect(screen.getByLabelText("Markdown / README URL")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /View API health/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/strategy/i)).not.toBeInTheDocument();
  });
});
