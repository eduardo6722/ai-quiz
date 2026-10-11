import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuizApiError, createQuiz } from "../api/api-client";
import { SetupForm } from "./setup-form";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

jest.mock("../api/api-client", () => {
  const actual = jest.requireActual("../api/api-client") as typeof import("../api/api-client");
  return {
    ...actual,
    createQuiz: jest.fn(),
  };
});

const mockedCreate = createQuiz as jest.MockedFunction<typeof createQuiz>;

describe("SetupForm", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockedCreate.mockReset();
  });

  it("submits a valid form with default count 5 and no strategy field", async () => {
    const user = userEvent.setup();
    mockedCreate.mockResolvedValue({ id: "quiz-1", status: "ready" });
    render(<SetupForm />);
    expect(screen.queryByLabelText(/strategy/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Topic"), "Hexagonal architecture");
    await user.type(screen.getByLabelText("Markdown / README URL"), "https://example.com/README.md");
    await user.click(screen.getByRole("button", { name: "Generate quiz" }));
    await waitFor(() =>
      expect(mockedCreate).toHaveBeenCalledWith({
        topic: "Hexagonal architecture",
        sourceUrl: "https://example.com/README.md",
        questionCount: 5,
      }),
    );
    expect(mockPush).toHaveBeenCalledWith("/quiz/quiz-1");
  });

  it("blocks empty topic and http URLs without calling createQuiz", async () => {
    const user = userEvent.setup();
    render(<SetupForm />);
    await user.click(screen.getByRole("button", { name: "Generate quiz" }));
    expect(await screen.findByText("Enter a topic.")).toBeInTheDocument();
    expect(mockedCreate).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Topic"), "Ports");
    await user.type(screen.getByLabelText("Markdown / README URL"), "http://example.com/README.md");
    await user.click(screen.getByRole("button", { name: "Generate quiz" }));
    expect(await screen.findByText("URL must be https.")).toBeInTheDocument();
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("only offers question counts 5 through 8", () => {
    render(<SetupForm />);
    const options = screen.getAllByRole("option").map((option) => option.getAttribute("value"));
    expect(options).toEqual(["5", "6", "7", "8"]);
  });

  it("shows generating status then mapped source errors with Try again", async () => {
    const user = userEvent.setup();
    let resolveCreate: (value: { id: string; status: "ready" }) => void = () => undefined;
    mockedCreate.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    render(<SetupForm />);
    await user.type(screen.getByLabelText("Topic"), "Express");
    await user.type(screen.getByLabelText("Markdown / README URL"), "https://example.com/README.md");
    await user.click(screen.getByRole("button", { name: "Generate quiz" }));
    expect(screen.getByRole("status")).toHaveTextContent("Preparing your questions…");
    resolveCreate({ id: "quiz-1", status: "ready" });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/quiz/quiz-1"));
  });

  it.each([
    ["SOURCE_UNSAFE_DESTINATION", "That address cannot be used as a quiz source."],
    ["SOURCE_TIMEOUT", "Could not read the Markdown source. Try again."],
    ["GENERATION_RETRIES_EXHAUSTED", "Could not prepare questions from that source. Try again."],
    ["GENERATION_UPSTREAM_FAILED", "Could not prepare questions from that source. Try again."],
  ])("maps %s", async (code, copy) => {
    const user = userEvent.setup();
    mockedCreate.mockRejectedValue(new QuizApiError(code, "server"));
    render(<SetupForm />);
    await user.type(screen.getByLabelText("Topic"), "Express");
    await user.type(screen.getByLabelText("Markdown / README URL"), "https://example.com/README.md");
    await user.click(screen.getByRole("button", { name: "Generate quiz" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(copy);
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("alert").textContent).not.toMatch(/sk-/);
  });

  it("maps a rejected fetch to the network copy", async () => {
    const user = userEvent.setup();
    mockedCreate.mockRejectedValue(new QuizApiError("NETWORK", "offline"));
    render(<SetupForm />);
    await user.type(screen.getByLabelText("Topic"), "Express");
    await user.type(screen.getByLabelText("Markdown / README URL"), "https://example.com/README.md");
    await user.click(screen.getByRole("button", { name: "Generate quiz" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not reach the quiz service. Try again.");
    expect(screen.getByLabelText("Topic")).toHaveValue("Express");
    expect(screen.getByLabelText("Markdown / README URL")).toHaveValue("https://example.com/README.md");
  });
});
