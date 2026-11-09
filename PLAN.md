# WSN Assignment – Plan

## Quyết định
- **Option 1:** Summary 1 paper → Report + Presentation slide (không làm simulation).
- **Paper B:** Trigka & Dritsas, *"Wireless Sensor Networks: From Fundamentals and Applications to Innovations and Future Trends"*, IEEE Access 13 (2025) – `docs/wsn fundamental.pdf`.
- **Team:** 1 người.
- **Report:** tiếng Anh, `.docx`, chữ/tiêu đề màu đen, trang bìa + lề theo mẫu HUST (`docs/[Final project]AC6301_TUNGDT252403M.docx`).
- **Slides:** template `docs/HUST_PPT_template_2022_RED_4x3.pptx`, ngắn gọn (~13 phút), speaker notes tiếng Việt (`slides/notes_vi.py`) xuất ra `.md` và gắn vào pptx.

## Cấu trúc repo
```
wsn/
├── docs/                         # papers + template + report mẫu
├── report/
│   ├── build_report.js           # nguồn report (docx-js): cd report && node build_report.js
│   ├── assets/hust_logo.jpg
│   └── WSN_Summary_Report.docx   # output
├── slides/
│   ├── build_slides.py           # nguồn slide (python-pptx): .venv/bin/python slides/build_slides.py
│   ├── WSN_Presentation.pptx     # output (có speaker notes trong Presenter View)
│   └── speaker_notes.md          # output (cùng nội dung notes + Q&A dự kiến)
└── PLAN.md
```
Setup lần đầu: `cd report && npm install` · `python3 -m venv .venv && .venv/bin/pip install python-pptx`

## Slide outline (14 slides, ~13 phút)
| # | Slide | Layout template |
|---|---|---|
| 1 | Title | slide tiêu đề gốc của template |
| 2 | Outline | panel đỏ HUST bên trái |
| 3 | The Paper at a Glance – số liệu + cấu trúc 5 phần | header đỏ, vạch vàng mảnh |
| 4 | Why This Survey? – 3 động lực + positioning | header đỏ |
| 5 | WSN Architectures – bảng so sánh | header đỏ |
| 6 | Unified Energy-Modelling Thread – 3 công thức | header đỏ |
| 7 | MAC & Routing – 4 lớp MAC, 6 họ routing | header đỏ, vạch vàng dày |
| 8 | Applications – 6 domain + case study | header đỏ |
| 9 | Innovations – 3 trụ cột + SDWSN/hardware | header đỏ |
| 10 | Challenges & Future Directions | vạch vàng dày |
| 11 | Critical Assessment – strengths vs limitations | vạch vàng dày |
| 12 | Does Clustering Always Save Energy? – chart + callouts | header đỏ |
| 13 | Conclusion – 3 takeaways | panel đỏ HUST |
| 14 | Thank you / Q&A | slide cuối gốc của template |

## Việc còn lại
- [ ] Điền tên giảng viên / mã học phần / mã số học viên trên bìa report (đang là placeholder `[...]`)
- [ ] Mở report bằng Word → Yes khi được hỏi update fields (mục lục)
- [ ] Mở slide bằng PowerPoint kiểm tra lần cuối (chart slide 12), tập nói theo `speaker_notes.md`
