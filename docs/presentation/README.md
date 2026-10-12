# Project presentation

- [Opening presentation](presentation-opening.pdf): 16 slides for a 10–12 minute introduction.
- [Full presentation](presentation.pdf): 53 slides, including detailed pipeline pseudocode, tests, evaluations, Langfuse, CI/CD, tradeoffs and interview questions.
- [Speaker notes](speaker-notes.md): explanations, rehearsal guidance and evidence for every slide.
- Editable sources: `presentation.html`, `presentation-opening.html`, `slides.json` and `build_presentation.py`.

The deck follows the repository's botanical palette and uses 16:9 pages. It is based on repository commit `9b6eec0` and checked-in evidence on 11 October 2026. Historical test/demo results are attributed to their repository records. Live evaluations, human calibration, baseline acceptance and hosted deployment are clearly distinguished from implemented tooling. Creating this presentation did not rerun application tests or use model credentials.

To rebuild the HTML, slide data and notes:

```bash
python3 docs/presentation/build_presentation.py
```

To export either HTML to PDF with local Chrome:

```bash
google-chrome --headless --no-sandbox --disable-gpu \
  --no-pdf-header-footer \
  --print-to-pdf="$PWD/docs/presentation/presentation.pdf" \
  "file://$PWD/docs/presentation/presentation.html"
```

Use `presentation-opening.html` and `presentation-opening.pdf` for the shorter deck. The HTML loads only local fonts and has no network assets. When opened in a browser, it also records layout-check results in the root element's `data-layout-issues` attribute. An empty array means no detected panel overflow or content/takeaway overlap; visual inspection is still necessary.
