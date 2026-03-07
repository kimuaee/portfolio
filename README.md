# 시각디자인 포트폴리오 웹사이트

커서/브라우저에서 바로 열어 사용할 수 있는 **정적 포트폴리오 사이트**입니다.

## 구성 파일

- `index.html`: 표지(풀스크린) → 작업물 그리드 → 상세 모달
- `styles.css`: 레이아웃/타이포/그리드(데스크탑 4열)
- `works.js`: 작업물 데이터(여기만 바꿔도 대부분 커스터마이징 가능)
- `app.js`: 그리드 렌더링 + 필터 + 상세 모달 + 해시 URL(`work=...`)

## 실행 방법

### 1) 가장 간단한 방법

- `index.html`을 더블 클릭해서 브라우저로 열기

### 2) 로컬 서버로 실행(권장)

브라우저에서 이미지/해시 동작이 더 안정적입니다.

```bash
python3 -m http.server 5173
```

그 다음 브라우저에서 `http://localhost:5173`로 접속하세요.

## 작업물 추가/수정 (가장 중요)

`works.js`의 `window.WORKS` 배열을 수정하면 됩니다.

예시(한 개 작업물):

```js
{
  id: "my-work-01",
  title: "작업 제목",
  category: "poster", // branding | poster | editorial | digital
  year: "2026",
  role: "Art Direction",
  tags: ["Tag1", "Tag2"],
  cover: "./assets/my-cover.jpg",
  images: ["./assets/my-1.jpg", "./assets/my-2.jpg"],
  description: "작업 설명을 여기에 작성",
}
```

### 이미지 넣는 방법

1. 프로젝트 폴더에 `assets` 폴더를 만들고 이미지(`.jpg/.png`)를 넣습니다.
2. `works.js`에서 `cover`, `images`를 `./assets/...` 경로로 바꿉니다.

현재는 **이미지 파일 없이도** 바로 보이도록 SVG 플레이스홀더를 기본으로 넣어뒀습니다.

## 상세 보기

- 카드 클릭 → 모달 오픈(상세 이미지/설명)
- `Esc` → 닫기
- 좌/우 방향키 → 이미지 넘기기
- 주소창 해시로 공유 가능: `#work=brand-system-01`

