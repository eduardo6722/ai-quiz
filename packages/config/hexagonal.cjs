/** Shared hexagonal import restrictions (CJS so Jest can assert them). */
module.exports = {
  restrictedPaths: [
    {
      name: "@nestjs/core",
      message: "Hexagonal boundary: domain/application cannot import NestJS",
    },
    {
      name: "@nestjs/common",
      message: "Hexagonal boundary: domain/application cannot import NestJS",
    },
    {
      name: "next",
      message: "Hexagonal boundary: domain/application cannot import Next.js",
    },
    {
      name: "react",
      message: "Hexagonal boundary: domain/application cannot import React",
    },
    {
      name: "react-dom",
      message: "Hexagonal boundary: domain/application cannot import React",
    },
    {
      name: "prisma",
      message: "Hexagonal boundary: domain/application cannot import Prisma",
    },
    {
      name: "openai",
      message: "Hexagonal boundary: domain/application cannot import OpenAI",
    },
  ],
  restrictedPatterns: [
    {
      group: [
        "@nestjs/*",
        "@prisma/*",
        "next/*",
        "openai",
        "ai",
        "@langfuse/*",
        "@opentelemetry/*",
        "@ai-quiz/ui",
      ],
      message: "Hexagonal boundary: core packages stay framework-free",
    },
  ],
};
