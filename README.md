# 8주 4분할 파워빌딩 프로그램 (웹앱)

4분할(가슴 · 등+삼두 · 어깨 · 하체+이두) · 4대 운동 기반 · 90·80·70% 주기. React + Vite, 서버·외부 CDN 없음. 기록은 사용자 브라우저(localStorage)에만 저장됩니다.

```bash
npm install
npm run dev
npm run build
```
설치형(PWA): 홈 화면에 추가하면 앱처럼 열리고, 한 번 연 뒤에는 오프라인에서도 열립니다 (`public/sw.js`, `public/manifest.webmanifest`).
배포: GitHub Pages(Actions) 또는 Vercel(Vite). 구성은 `src/data.js`(DAYS, TYPES), 문구는 `src/guide.json`, 링크는 `src/config.js`.
