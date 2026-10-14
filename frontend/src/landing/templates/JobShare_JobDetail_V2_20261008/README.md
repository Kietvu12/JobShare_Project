# JobShare Job Detail · V2 · 2026-10-08

## Scope / source

This is the **V2 working frontend review build**, not a deployment into the production React app.

- Exact source of truth for job `708` (Coretech / IT Communicator): the three supplied original production HTML snapshots, in Vietnamese, English and Japanese, from `Job Details - Example(1).rar`.
- Tokens, role selector, brand header/footer and responsive visual language: supplied `JobShare_Jobs_V3_20261007(2).zip` and the related Collaborator V3 / Candidate V1.1.
- Job category hierarchy and related-card source: the supplied **Jobs V3** datasets. No made-up salary, company logo, JLPT, badge, file or benefits.
- Existing frontend handlers/routes determined by inspecting the included production JS bundle within the archived site snapshot.

## V2 improvements over V1 (UI and copy-label refinements only)

1. **Header registration**: white text in all link states on JobShare red; deep red hover.
2. **Actual workplace vs candidate recruitment area**: two separately labelled overview cards. `Nơi làm việc` / `Work location` / `勤務地` uses a blue map pin; `Địa điểm tuyển dụng` / `Recruitment area` / `採用対象地域` uses teal people. They are not treated as two workplace addresses.
3. **Dimensional circular SVG icons**: subtle gradients and shadows (salary `¥` / geography), deliberately *not* cartoon/glossy 3D artwork. No raster assets needed.
4. **Salary**: blush-toned highlighted area; clear primary annual and secondary monthly values. JA displays omit duplicated leading `年収`/`月給` only when those labels are already displayed separately. All amounts and periods remain unchanged.
5. **Section navigation/readability**: color-tinted heading panels with semantic accent icon colors for overview, requirements, conditions, benefits, process, and company; consistent icon strokes.
6. **Related jobs**: added subtle pictogram alongside heading, reused colored category cards from Jobs V3.
7. **Action emphasis**: strong primary red candidate recommendation remains; Copy URL and Download JD are two clear 48px outlined buttons rather than faint text links.
8. **Responsive and JA QA**: 8 widths × 3 languages tested; narrow JA role descriptions use balanced wrapping. No horizontal overflow found in the preview renderer.

Production integration should take **current working fields and actions from the host app**, not hardcode `708` as universal job data.

## Review

Open `index.html` in a browser, then choose VI / EN / JA. The actual locale pages are:

- `vi/jobs/708/index.html`
- `en/jobs/708/index.html`
- `ja/jobs/708/index.html`

These correspond to **`/vi/jobs/708`, `/en/jobs/708`, `/ja/jobs/708`**, without changing the original route scheme. The HTML uses relative asset links so the `708` review pages can open locally.

### UI changes

- One title in the overview, no image-heavy hero or duplicate H1.
- V3 industry color, icon, badge, metadata and compact related-job cards.
- Prominent annual/monthly salary values from the source; **no conversions**.
- Six visible, semantically headed sections; no accordions.
- Desktop: sticky sidebar with **red primary Suggest candidate**, then **Copy URL** and **Download JD** in two clearly outlined buttons.
- Mobile: secondary actions immediately below overview, primary button in bottom safe-area sticky strip.
- VI / EN / JA typography with strict JA line-breaking, 1200px max-width and breakpoints from 360px up.

## Action behavior — important

The archive contains **public captured HTML and a minified compiled app**, not the original application source, logged-in auth state or the actual JD attachments. The UI therefore **does not pretend** to perform protected actions offline.

| Action | Original behavior confirmed from archived production JS | This preview build |
|---|---|---|
| Suggest candidate | Job detail uses the app's nomination callback or navigates to the job's `/nominate` route | Navigates to the real production nomination URL (`https://ws-jobshare.com/{locale}/jobs/{id}/nominate`); actual login/auth/recommendation stays in the production application. Host hook is provided below. |
| Copy URL | `Vz({jobId,slug,locale,persona:"candidate"})`, yielding `/{locale}/candidate/jobs/{slug-or-id}/view` | Copies the **candidate-view URL**, not the collaborator detail-page URL; shows feedback. |
| Download JD | `downloadJobFile(jobId,fileType,"ctv")` → `GET /api_jobshare/api/ctv/jobs/{id}/view-url?fileType=…&purpose=download`, then `/download?...` | Checks real JD field flags (`jdFile`, `jdFileEn`, `jdFileJp`, `jdOriginalFile`, `requiredCvForm`) from the live job API before displaying options; requests the production download endpoint. There is no fake PDF fallback. Local/offline/network errors are reported. |

To use the actual application actions and session logic, **bind the existing production callbacks** before loading `assets/app.js`:

```js
window.JobShareDetailHooks = {
  loadJob: (id, lang) => originalApi.getJobById(id).then(result => result.data.job),
  onNominate: ({ jobId, job, lang }) => originalRouterNavigate(`/${lang}/jobs/${jobId}/nominate`),
  candidateUrl: (job, lang) => existingCandidateUrlBuilder({ jobId: job.id, slug: job.slug, locale: lang, persona: 'candidate' }),
  downloadJobFile: (id, fileType, persona) => originalApi.downloadJobFile(id, fileType, persona),
};
```

The callback names above are adapter points, not guesses about the names of internal application functions. Connect them to the original app.

## Arbitrary route IDs and deployment integration

`assets/app.js` reads the `/{locale}/jobs/{id}` route. It renders the full archived source data for `708`. For another ID, it requests the original endpoint `https://ws-jobshare.com/api_jobshare/api/ctv/jobs/{id}` and uses field-based normalization. **The complete JD schema for every other job is not recoverable from the single saved Job Detail example.** The adapter `job.jobDetailSections` should be populated by the production application's actual detail-data renderer/mapping before this is deployed to all IDs. Otherwise the overview/requirements may work but not every custom detail field will be shown.

The host server must preserve existing `/{locale}/jobs/:id` routing or rewrite those paths to the Job Detail template, then pass the authenticated job object to this page. Do not deploy the sample `708` HTML as the final content for other IDs. All business data and action guards must remain in the existing backend/application.

## Fonts and assets

- Existing **JobShare logos** are reused from Jobs V3; no new illustration has been generated.
- Body fonts use `Segoe UI` (VI), `Barlow` (EN), `Noto Sans JP` (JA). The preview loads Barlow/Noto via Google Fonts with system fallbacks. In the production integration, point to the font resources already hosted by JobShare (no font binaries are distributed in this package).

## Tests and outstanding QA

Run `node tests.mjs` to validate rendering against the source snapshot. It checks VI/EN/JA, one H1, six sections, actions, category continuity, related cards and missing-value placeholders.

Chromium preview QA was performed with HTML loaded directly into the browser (direct navigation to local files is blocked by this environment). VI, EN, and JA were checked at **1440, 1366, 1280, 1024, 768, 430, 390, 360px**: there was no horizontal overflow, the registration link computed color was white, both geographic tiles were present, and all 6 detail sections rendered. Screenshots are stored in `docs/previews/`. Before production release, verify real authentication, actual JD files, responsive font loading, toast states, and sticky-header behavior inside the host app.
