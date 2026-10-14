# JobShare Job Detail — V2 UI decisions

## Design policy
- Fork JobShare Jobs V3 category colors/icons and Collaborator V3 typography/palette.
- Use colored icon circles with restrained inset shadows; avoid cartoonish 3D or stock images. This is for Japanese corporate/CEO audiences.
- Retain primary red CTA **Đề xuất ứng viên**; keep secondary **Sao chép URL** and **Tải JD** as prominent outlined controls.

## Semantic differentiation between locations
| Concept | VI | EN | JA | Icon | Accent |
|---|---|---|---|---|---|
| Actual worksite | Nơi làm việc | Work location | 勤務地 | Map pin | Blue #2874AB |
| Candidate recruitment area | Địa điểm tuyển dụng | Recruitment area | 採用対象地域 | Group of people | Teal #167F76 |

Never infer one from the other. Only render a tile when corresponding real data exists. For job 708 the recruitment area is `Tại Nhật Bản` and the actual worksite is Meguro, Tokyo. Source data remains unchanged.

## Section header accents
| Section | Accent |
|---|---|
| Overview | Blue #2F80BD |
| Requirements | Teal #188677 |
| Salary / conditions | Rose #CE4352 |
| Benefits | Warm gold #AE7C27 |
| Interview process | Soft indigo #6761B5 |
| Company information | Slate #546C7D |

Colors appear in subtle header tint and circular SVG illustration, not the full section body. Category icons keep their own V3 category color regardless of section color.

## Design QA
- Header registration link: white `rgb(255, 255, 255)` in VI/EN/JA screenshot runs.
- All six sections exist; one H1; primary/secondary controls preserved.
- Responsive horizontal overflow absent at 1440, 1366, 1280, 1024, 768, 430, 390, 360 in VI/EN/JA preview.
- Japanese text uses `line-break: strict`, normal word breaks, and no manual `<br>` in job titles.
- Real auth, download flags, signed download URL, nomination form, and backend dynamic job mapping must still be verified in production.
