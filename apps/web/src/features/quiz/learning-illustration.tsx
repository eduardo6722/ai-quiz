export function LearningIllustration() {
  return (
    <div className="relative mt-8 hidden max-w-sm items-center gap-4 lg:flex">
      <svg
        viewBox="0 0 300 190"
        className="h-44 w-64 shrink-0 text-leaf"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M38 119C19 83 46 37 94 29c51-9 57 9 93 9s79 7 76 56-56 65-113 61-91 6-112-36Z"
          className="fill-sage"
        />
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M171 138c28-23 52-64 45-107M196 111c30 1 50-11 59-26M207 83c-20-9-32-23-35-41" />
          <path
            d="M214 61c-4-17 2-31 18-41 7 18 1 35-18 41ZM216 82c0-18 10-31 31-35 0 19-12 33-31 35ZM203 105c7-17 22-23 43-18-7 17-21 22-43 18ZM195 76c-17-2-29-13-33-32 18 2 30 13 33 32Z"
            className="fill-mint"
          />
          <path
            d="M62 107c28-8 51-2 68 11 18-13 40-19 66-11v48c-28-6-49-1-66 12-17-13-39-18-68-12v-48Z"
            className="fill-sage"
          />
          <path d="M130 118v49M70 149c22-4 43 2 60 14 17-12 35-18 58-14M77 119c15-1 28 2 39 8M77 129c15-1 27 2 39 8M146 127c11-6 23-9 37-8M146 137c11-6 23-9 37-8" />
          <rect
            x="35"
            y="57"
            width="32"
            height="40"
            rx="6"
            transform="rotate(-12 35 57)"
            className="fill-mint"
          />
          <path d="m43 70 5 4 8-11M44 84l12-3" />
          <rect
            x="92"
            y="32"
            width="28"
            height="34"
            rx="5"
            transform="rotate(9 92 32)"
            className="fill-sage"
          />
          <path d="M101 43c0-5 8-4 8 0 0 3-4 3-4 6M105 54h.01M40 157h12M230 132h11M236 127v10" />
        </g>
      </svg>
      <p className="max-w-28 font-display text-xl leading-snug italic text-primary">
        Good things grow with practice.
      </p>
    </div>
  );
}
