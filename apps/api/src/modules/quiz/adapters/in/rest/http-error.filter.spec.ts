import { HttpStatus, Logger, NotFoundException } from "@nestjs/common";
import { ApplicationError } from "@ai-quiz/application";
import { HttpErrorFilter } from "./http-error.filter";

function hostWith(json: jest.Mock, status: jest.Mock) {
  status.mockReturnValue({ json });
  return {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
    }),
  } as never;
}

describe("HttpErrorFilter", () => {
  const filter = new HttpErrorFilter();

  beforeEach(() => {
    jest.spyOn(Logger.prototype, "error").mockImplementation();
  });

  it("maps allowlisted contract codes", () => {
    const json = jest.fn();
    const status = jest.fn();
    filter.catch(new ApplicationError("QUIZ_NOT_FOUND", "Quiz not found"), hostWith(json, status));
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({ code: "QUIZ_NOT_FOUND", message: "Quiz not found" });
  });

  it("does not echo Prisma or other provider codes", () => {
    const json = jest.fn();
    const status = jest.fn();
    filter.catch({ code: "P2002", message: "Unique constraint failed" }, hostWith(json, status));
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    });
    expect(JSON.stringify(json.mock.calls[0]?.[0])).not.toContain("P2002");
    expect(JSON.stringify(json.mock.calls[0]?.[0])).not.toContain("Unique constraint");
  });

  it("preserves HttpException status without treating it as a contract code", () => {
    const json = jest.fn();
    const status = jest.fn();
    filter.catch(new NotFoundException(), hostWith(json, status));
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "INTERNAL_ERROR",
      }),
    );
  });
});
