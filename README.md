# wsn

Wireless Sensor Networks course assignment – **paper summary** of
M. Trigka & E. Dritsas, *"Wireless Sensor Networks: From Fundamentals and Applications to Innovations and Future Trends"*, IEEE Access 13 (2025).

| Path | Content |
|---|---|
| `report/WSN_Summary_Report.docx` | Summary report (English, HUST cover) – source: `report/build_report.js` |
| `slides/WSN_Presentation.pptx` | Presentation (HUST template) – source: `slides/build_slides.py` |
| `slides/speaker_notes.md` | Speaker notes (Vietnamese) |
| `OVERVIEW.md` | Overview of the assignment and paper (Vietnamese) |
| `docs/` | Papers, HUST slide template, sample report |

Build:

```bash
cd report && npm install && node build_report.js && cd ..
python3 -m venv .venv && .venv/bin/pip install python-pptx
.venv/bin/python slides/build_slides.py
```
