# Replit 수정 지시사항 — 전체 목록

아래 항목을 **번호 순서대로 모두 수정**하라.  
완료 후 항목별로 **완료 / 실패 / 스킵** 여부를 번호에 맞춰 보고하라.

---

## [메인화면 / LandingPage]

### 1. 대관자 로그인 시 수정 요청 알림 배너

`me?.role === "user"` 인 경우, 해당 사용자의 행사 목록을 fetch해서 `status === "revision_requested"` 인 항목이 있으면, 메인화면 상단(맹꽁이 badge와 별도)에 아래 스타일의 배너를 표시하라.

```
⚠ "[행사명]"에 보완 요청이 있습니다. 확인해 주세요. →
```

- 배너 스타일: 붉은색 계열 (`bg-red-50 border-red-300 text-red-800`)
- 배너 클릭 시: `setLocation(`/events/${eventId}?tab=pr`)` 으로 이동
- **배너 클릭 후 또는 해당 행사 페이지를 방문한 경우, 배너가 사라져야 함.**  
  구현 방법: `sessionStorage` 에 `visited_event_${eventId}` 를 저장하고, LandingPage 마운트 시 이미 방문한 행사는 배너에서 제외.
- `revision_requested` 행사가 여러 건인 경우 건수별로 각각 배너를 표시.

### 2. admin/super_admin 로그인 시 자동 리다이렉트

LandingPage 또는 App.tsx에서 `me` 데이터 로드 완료 시점에 아래 로직 추가:

```ts
if (me?.role === "admin" || me?.role === "super_admin") {
  setLocation("/admin/dashboard"); // 또는 /admin
}
```

현재 이 로직이 있으나 동작하지 않는 경우, `useEffect`의 의존성 배열에 `me?.role` 을 포함하고 있는지 확인 후 수정.

### 3. 관리자 로그인 시 신규 신청 알림 배너

`me?.role === "admin"` 또는 `"super_admin"` 인 경우, `/api/admin/events?status=submitted` 를 fetch해서 건수가 1건 이상이면 파란색 배너 표시.

```
📬 새 홍보 신청이 N건 있습니다. → [홍보신청 관리]로 이동
```

- 배너 스타일: `bg-blue-50 border-blue-300 text-blue-800`
- 배너 클릭 시: `setLocation("/admin/events")` 으로 이동
- **배너 클릭 후 배너가 사라져야 함.** `sessionStorage` 에 `admin_banner_dismissed_${날짜}` 저장 후 당일 다시 로그인해도 보이지 않도록.

---

## [행사 등록 / EventCreatePage]

### 4. '라이브하우스 로비·입구' 문구 삭제

`EventCreatePage.tsx` 전체에서 아래 텍스트를 포함하는 `<p>` 또는 `<span>` 태그를 찾아 해당 태그 전체를 삭제하라:

```
라이브하우스 로비·입구는 당일 별도 신청 없이 사용 가능
```

### 5. 희망 홍보 구역 설명 텍스트 앞 '참고:' 삭제

`EventCreatePage.tsx` 549번째 줄 근방의 아래 텍스트에서 `참고:` 가 붙어 있으면 삭제:

```
참고: 통상 진행일 2주 전 게시, 매주 월요일 교체 진행 / 별도 희망일자가 없는 경우 게시 희망일 빈칸 제출
```

수정 후:
```
통상 진행일 2주 전 게시, 매주 월요일 교체 진행 / 별도 희망일자가 없는 경우 게시 희망일 빈칸 제출
```

### 6. 홈페이지/SNS 게시 설명 텍스트 삭제

`EventCreatePage.tsx`에서 아래 텍스트를 포함하는 `<p>` 또는 `<span>` 태그를 찾아 해당 태그 전체를 삭제:

```
홈페이지: 수령일 1주 이내, SNS: 진행일 2주 이내 게시
```

### 7. 홈페이지 / SNS 를 별개 항목으로 분리

현재 `EventCreatePage.tsx`의 `🌐 홈페이지 / SNS 게시` 섹션(531~541번째 줄)을 두 개의 별개 항목으로 분리:

**A. 홈페이지 게시 섹션:**
```tsx
<div className="bg-blue-50/70 border border-blue-200 rounded-md px-4 py-3 space-y-3">
  <p className="text-xs font-bold text-blue-800" style={KR}>
    🌐 홈페이지 게시
    <span className="ml-1.5 text-[10px] font-semibold text-white bg-blue-500 px-1.5 py-0.5 rounded">필수</span>
  </p>
  {/* 게시 희망일 */}
  <div>
    <label>게시 희망일 *</label>
    <input type="date" value={meta.websiteDate} onChange={e => setM("websiteDate", e.target.value)} />
  </div>
  {/* 홈페이지 포스터 파일 업로드 */}
  <div>
    <label>홈페이지 포스터 파일 *</label>
    <input type="file" ... />
  </div>
  {/* 상세페이지 이미지 파일 업로드 */}
  <div>
    <label>상세페이지 이미지 파일</label>
    <input type="file" ... />
  </div>
  {/* 홈페이지 대체텍스트 — textarea */}
  <div>
    <label>홈페이지 대체텍스트 (alt text)</label>
    <textarea value={meta.websiteAltText} onChange={e => setM("websiteAltText", e.target.value)}
      placeholder="이미지를 설명하는 대체텍스트를 입력하세요" rows={2} />
  </div>
  {/* 상세페이지 본문텍스트 — textarea */}
  <div>
    <label>상세페이지 본문텍스트</label>
    <textarea value={meta.websiteBodyText} onChange={e => setM("websiteBodyText", e.target.value)}
      placeholder="상세페이지에 들어갈 본문 내용을 입력하세요" rows={4} />
  </div>
</div>
```

**B. SNS 게시 섹션:**
```tsx
<div className="bg-purple-50/70 border border-purple-200 rounded-md px-4 py-3 space-y-2">
  <p className="text-xs font-bold text-purple-800" style={KR}>
    📱 SNS 게시
    <span className="ml-1.5 text-[10px] font-semibold text-white bg-purple-500 px-1.5 py-0.5 rounded">필수</span>
  </p>
  <div>
    <label>게시 희망일 *</label>
    <input type="date" value={meta.snsDate} onChange={e => setM("snsDate", e.target.value)} />
  </div>
</div>
```

기존 `meta.snsSiteDate` 상태값은 `meta.websiteDate` / `meta.snsDate` 로 분리. 기존 사용 코드(`EventDetailPage.tsx` 등)에서 `snsSiteDate`를 참조하는 부분을 모두 `websiteDate` / `snsDate` 로 대응되게 수정.

### 8. 제출 버튼 색상 확인

`EventCreatePage.tsx` 670~674번째 줄의 submit 버튼이 `bg-red-600` 으로 선언되어 있음.  
실제 화면에서 초록색으로 나온다면 CSS override 원인을 찾아 제거. 이미 붉은색이면 패스.

---

## [대관자 — 홍보물 탭 / EventDetailPage assets tab]

### 9. ver2 이상 버전이 리스트에서 보이지 않는 문제 수정

`AssetVersionTable` 컴포넌트(1092번째 줄~)에서 `useEffect` 내 `/api/assets/${assetId}` 를 fetch해서 `data.versions` 를 `setVersions` 로 세팅함.  
**문제:** 버전 목록이 첫 번째 버전(v1)만 내려오거나, 서버에서 versions 배열이 잘려서 내려오는 것으로 추정.

- 서버의 `/api/assets/:assetId` 엔드포인트를 확인해서, 해당 asset의 **모든 버전**(`asset_versions` 테이블 전체)을 `versions` 배열로 반환하는지 확인.
- `ORDER BY version_number ASC` 또는 `DESC` 로 정렬해서 모든 버전이 포함되어 내려오도록 수정.
- 프론트의 `AssetVersionTable`은 이미 `data.versions || []` 로 받으므로 서버 수정이 핵심.

### 10. final selected 후에도 추가 파일 업로드 가능

`EventDetailPage.tsx` 975~983번째 줄 근방, 각 asset 카드 헤더의 `📎 파일 추가` 버튼:

```tsx
<button
  onClick={() => { setUploadAssetId(asset.id); ... setShowUploadModal(true); }}
  ...>
  📎 파일 추가
</button>
```

이 버튼이 `asset.selectedVersionId` 가 있을 때 숨겨지거나 disabled 되는 조건이 있으면 해당 조건을 제거. `selectedVersionId` 유무와 관계없이 항상 표시.

### 11. 홍보물 업로드 시 '홍보 구역 선택' 드롭다운 삭제

`EventDetailPage.tsx`의 업로드 모달(391~429번째 줄)에서 `uploadZoneId` 관련 `<select>` UI를 삭제. 해당 state 선언(`const [uploadZoneId, setUploadZoneId] = useState("")`)과 모달 내 구역 선택 드롭다운 JSX, `setUploadZoneId` 호출부를 모두 제거.  
단, `handleFileUpload` 내에서 `zoneId: uploadZoneId ? Number(uploadZoneId) : null` 부분은 `zoneId: null` 로 고정.

### 12. `setShowUploadForm is not defined` 오류 수정

`EventDetailPage.tsx` 전체에서 `setShowUploadForm` 을 호출하는 코드를 검색해서 `setShowUploadModal` 로 일괄 교체.  
(`showUploadForm` → `showUploadModal`, `setShowUploadForm` → `setShowUploadModal`)

### 13. '미업로드' 클릭 시 오류 수정

`EventDetailPage.tsx` 888번째 줄:
```tsx
<button onClick={() => handleZoneUpload("홈페이지 / SNS 게시")} ...>미업로드</button>
```
917번째 줄:
```tsx
<button onClick={() => handleZoneUpload(z.label)} ...>미업로드</button>
```

`handleZoneUpload` 함수(163~170번째 줄)를 확인해서 내부에서 오류가 나는 원인 파악 후 수정.  
현재 `setShowUploadForm` 미정의 오류가 원인일 가능성이 높으므로 12번 수정 후 재확인.  
추가로 `handleZoneUpload` 내부를 try-catch로 감싸서 방어 처리.

### 14. [+홍보물 업로드] 버튼 삭제

`EventDetailPage.tsx` 전체에서 텍스트가 `+홍보물 업로드` 또는 `홍보물 업로드` 인 `<button>` 태그를 찾아서 삭제. 관리자 뷰(`isAdmin === true`), 대관자 뷰(`isAdmin === false`) 모두 동일하게 삭제.

### 15. 1층 벽면 게시대 포스터 → checkbox로 변경

`EventCreatePage.tsx`에서 `PROMO_STANDARD` 배열에 포함된 `"1층 벽면 게시대 포스터 (B2 사이즈 10장)"` 항목을 체크박스로 선택 시 파일 업로드가 아닌 **제출 여부만 체크**하도록 변경.

- 해당 항목 선택 시 날짜 input이 나타나지 않아야 함.
- 상태값은 `meta.posterSubmitted: boolean` 으로 저장.
- `EventDetailPage.tsx`의 assets 탭에서도 해당 항목은 파일 업로드 대신 `✅ 제출됨` / `미제출` 텍스트로만 표시.

---

## [관리자 — 홍보신청 탭 / EventDetailPage 관리자 뷰]

### 16. 각 홍보신청 row에서 인라인 승인/미승인/날짜수정 처리

`EventDetailPage.tsx` 739~768번째 줄의 `promotionRequests` 테이블에서, **관리자(`isAdmin === true`) 뷰**에만 아래 열 추가:

**기존 컬럼:** 홍보 구역 / 구분 / 희망 기간 / 승인 상태 / 관리자 코멘트  
**추가 컬럼:** 액션 / 게시 완료

**액션 열 구현:**
```tsx
<td className="px-4 py-2.5">
  {pr.status !== "approved" && (
    <button onClick={() => handleApprove(pr.id)} className="h-6 px-2 text-xs bg-emerald-600 text-white rounded mr-1">승인</button>
  )}
  <button onClick={() => setInlineDateEdit(pr.id)} className="h-6 px-2 text-xs border border-zinc-300 rounded mr-1">날짜수정 후 승인</button>
  {pr.status !== "rejected" && (
    <button onClick={() => handleReject(pr.id)} className="h-6 px-2 text-xs bg-red-500 text-white rounded">미승인</button>
  )}
  {/* 날짜 수정 인라인 폼 */}
  {inlineDateEdit === pr.id && (
    <div className="mt-2 flex gap-2 items-center">
      <input type="date" value={inlineStart} onChange={e => setInlineStart(e.target.value)} className="border rounded px-2 py-1 text-xs" />
      <span className="text-xs">~</span>
      <input type="date" value={inlineEnd} onChange={e => setInlineEnd(e.target.value)} className="border rounded px-2 py-1 text-xs" />
      <button onClick={() => handleApproveWithDate(pr.id)} className="h-6 px-2 text-xs bg-emerald-600 text-white rounded">저장 후 승인</button>
      <button onClick={() => setInlineDateEdit(null)} className="h-6 px-2 text-xs border rounded">취소</button>
    </div>
  )}
</td>
```

관련 state 추가:
```ts
const [inlineDateEdit, setInlineDateEdit] = useState<number | null>(null);
const [inlineStart, setInlineStart] = useState("");
const [inlineEnd, setInlineEnd] = useState("");
```

핸들러:
- `handleApprove(prId)`: `PATCH /api/promotion-requests/:prId` → `{ status: "approved" }`
- `handleReject(prId)`: `PATCH /api/promotion-requests/:prId` → `{ status: "rejected" }`
- `handleApproveWithDate(prId)`: `PATCH /api/promotion-requests/:prId` → `{ status: "approved", approvedStartDate: inlineStart, approvedEndDate: inlineEnd }`

**게시 완료 열 구현:**
```tsx
<td className="px-4 py-2.5 text-center">
  <input type="checkbox"
    checked={pr.status === "completed"}
    onChange={e => handleSetCompleted(pr.id, e.target.checked)}
    className="accent-emerald-600 w-4 h-4 cursor-pointer" />
</td>
```

`handleSetCompleted(prId, checked)`: `PATCH /api/promotion-requests/:prId` → `{ status: checked ? "completed" : "approved" }`

### 17. 최종 파일 목록 — 최종 선택 파일만 + ZIP 다운로드

`EventDetailPage.tsx` 943~961번째 줄의 `📥 최종 선택 파일 목록 (관리자)` 섹션 수정:

현재 `event.assets.filter(a => a.selectedVersionId)` 로 asset을 필터하지만, `asset.latestVersionUrl` 이 아니라 **선택된 버전의 URL**을 가져와야 함.

수정 후:
```tsx
{event.assets.filter(a => a.selectedVersionId).map(asset => {
  // selectedVersionId에 해당하는 버전의 fileUrl을 사용
  // 서버에서 asset 응답에 selectedVersion: { fileUrl, fileName } 을 포함시키거나,
  // 프론트에서 AssetVersionTable에서 이미 fetch한 버전 목록을 재사용해야 함
})}
```

서버의 `/api/events/:id` 응답에서 각 asset에 `selectedVersionUrl` 및 `selectedVersionFileName` 필드를 포함하도록 수정.

**ZIP 다운로드 버튼 추가:**
```tsx
<button onClick={handleDownloadZip} className="h-7 px-3 text-xs font-medium bg-emerald-700 text-white rounded hover:bg-emerald-800">
  📦 전체 ZIP 다운로드
</button>
```

`handleDownloadZip`:
```ts
const handleDownloadZip = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${BASE_URL}/api/admin/events/${id}/download-final-zip`, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (!res.ok) return alert("ZIP 다운로드에 실패했습니다.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `event_${id}_final_assets.zip`; a.click();
  URL.revokeObjectURL(url);
};
```

서버에 `/api/admin/events/:id/download-final-zip` 엔드포인트를 추가:
- 해당 행사의 assets 중 `selectedVersionId`가 있는 것만 조회
- 각 선택된 버전의 파일 URL에서 파일을 다운로드해서 zip으로 묶어 반환
- `archiver` 또는 `jszip` 패키지 사용

---

## [캘린더 / AdminCalendarPage]

### 18. 전체 일정 table 배경 어두운 문제 수정

`AdminCalendarPage.tsx` 139번째 줄 근방의 전체 일정 목록 div:

```tsx
<div className="border border-black/10 rounded-lg bg-white overflow-hidden">
```

이 div에 명시적 인라인 스타일을 추가:
```tsx
<div className="border border-black/10 rounded-lg bg-white overflow-hidden"
  style={{ backgroundColor: '#ffffff', color: '#18181b' }}>
```

`AdminCalendarPage.css`에서 `.fc-dark-wrapper` 또는 `.fc-dark-wrapper *` 선택자가 하위 요소의 `background-color` 또는 `color`를 강제 적용하는 규칙이 있으면, 전체 일정 div에 `.schedule-list` 클래스를 추가하고 CSS에서 `.fc-dark-wrapper .schedule-list` 에 대해 `background-color: #fff !important; color: #18181b !important;` 를 적용.

### 19. 행사명 클릭 시 행사 개요 탭으로 이동

`AdminCalendarPage.tsx` 전체 일정 목록의 `onClick` 핸들러:

**수정 전:**
```tsx
onClick={() => setLocation(`/events/${s.eventId}`)}
```

**수정 후:**
```tsx
onClick={() => setLocation(`/events/${s.eventId}?tab=overview`)}
```

그리고 `EventDetailPage.tsx`에서 `useSearch()` 로 쿼리스트링을 읽어 `activeTab` 초기값을 설정:

```tsx
const searchStr = useSearch();
const initialTab = new URLSearchParams(searchStr).get("tab") as "overview" | "assets" | "pr" | "comments" | null;
const [activeTab, setActiveTab] = useState<"overview" | "assets" | "pr" | "comments">(initialTab ?? "overview");
```

(현재 79번째 줄의 `useState("overview")` 를 위와 같이 교체)

### 20. 관리자 캘린더에 홍보물 게시일자 표시

`AdminCalendarPage.tsx`의 `fcEvents` 생성 로직에서, 현재 `schedules` 데이터에 홍보물 항목(`itemType !== "event"`)이 포함되어 있으나 표시되지 않는 경우:

- `filtered` 배열에서 `itemType === "event"` 필터를 제거하거나, 홍보물 항목도 포함하도록 수정
- 홍보물 이벤트는 구역 색상(`getZoneColor(s.zoneType, s.zoneColor)`)으로 표시
- `fcEvents` 배열에 홍보물 항목이 포함되면 캘린더에 자동 표시됨

서버의 `/api/admin/calendar?month=:month` 엔드포인트가 홍보물 일정을 내려주지 않는 경우:
- `promotionRequests` 테이블에서 `status === "approved"` 인 항목의 `approvedStartDate`, `approvedEndDate`를 포함한 데이터를 추가로 내려주도록 수정

---

## [메인화면 일러스트 / LandingPage SVG]

### 21. 백로 날개 끝 흰색으로 수정

`LandingPage.tsx` 의 SVG 코드에서 백로(heron/egret) 캐릭터를 담당하는 path/polygon 중 `fill` 값이 `#000`, `#1a1a1a`, `#333` 등 어두운 색상인 path를 찾아 `fill="#ffffff"` 로 교체.  
백로는 전신 흰색이므로 검은색 fill이 있는 날개 관련 path는 모두 흰색으로 변경.  
단, 눈·부리 등 얼굴 디테일의 검은색은 유지.

### 22. 맹꽁이 몸통 추가

`LandingPage.tsx` SVG에서 맹꽁이 캐릭터 그룹(`<g>`)을 찾아서 얼굴 원 아래에 몸통 `<ellipse>` 추가:

```svg
<!-- 맹꽁이 몸통 -->
<ellipse cx="[얼굴중심X]" cy="[얼굴중심Y + 얼굴반지름 + 몸통반지름Y * 0.6]"
  rx="[얼굴반지름 * 1.2]" ry="[얼굴반지름 * 0.9]"
  fill="[얼굴과 동일한 색상]" />
```

몸통 추가 후 전체 캐릭터를 위쪽으로 약 10~15px 이동하여 몸통이 잘리지 않도록 조정.

### 23. 시즌별 일러스트 자동 전환

`LandingPage.tsx`에 아래 로직 추가:

```ts
const month = new Date().getMonth() + 1; // 1~12
const season = month >= 3 && month <= 5 ? "spring"
  : month >= 6 && month <= 8 ? "summer"
  : month >= 9 && month <= 11 ? "autumn"
  : "winter";

const seasonText: Record<string, string> = {
  spring: "노들섬에 봄이 왔어요! 🌸",
  summer: "노들섬의 여름이 시작됩니다! ☀️",
  autumn: "노들섬의 가을을 즐겨보세요! 🍂",
  winter: "노들섬의 겨울 풍경을 만나보세요! ❄️",
};
```

SVG 안에 또는 SVG 바로 아래에 시즌 텍스트를 표시:

```tsx
<p className="text-center text-sm font-medium text-zinc-600 mt-2" style={KR}>
  {seasonText[season]}
</p>
```

시즌별로 SVG 배경색, 하늘색 등을 `season` 값으로 분기하여 적용. 현재 5월이므로 봄(`spring`) 적용 중, 6월 1일부터 자동으로 `summer`로 전환됨.

### 24. 여름 컬러 교체

SVG에서 `season === "summer"` 조건에 해당하는 색상값을 아래로 교체:

| 대상 | 기존 | 변경 후 |
|---|---|---|
| 하늘 배경 | 탁한 하늘색 계열 | `#5BC8F5` |
| 전체 배경 | 어두운 배경 | `#E8F8FF` |
| 태양 | 기존 노란색 | `#FFE033` |
| 잔디/나무 | 탁한 초록 | `#5DBB63` |
| 강/물 | 기존 | `#3BBCF0` |

---

## [맹꽁이 AI — Badge & 메시지]

### 25. Badge가 원형 안에 갇혀 보이지 않는 문제 수정

맹꽁이 AI 버튼의 뱃지(읽지 않은 메시지 수 표시)가 원형 컨테이너 안에 클리핑되어 잘려 보임.

맹꽁이 버튼 컨테이너에 `overflow-hidden` 이 적용되어 있거나, 뱃지의 z-index가 낮거나, `position: absolute` 인데 부모가 `overflow: hidden` 인 경우 발생.

수정:
1. 맹꽁이 버튼 래퍼 div에서 `overflow-hidden` 제거
2. 뱃지 element에 `z-index: 50` 이상, `position: absolute`, `top: -6px`, `right: -6px` 적용
3. 뱃지가 부모 바깥으로 나올 수 있도록 래퍼에 `overflow: visible` 명시

```tsx
{/* 맹꽁이 버튼 래퍼 — overflow-hidden 제거, overflow-visible 추가 */}
<div className="relative" style={{ overflow: 'visible' }}>
  {/* 맹꽁이 버튼 본체 */}
  <button className="...">
    {/* 맹꽁이 이미지/SVG */}
  </button>
  {/* 뱃지 — 버튼 바깥으로 돌출 */}
  {unreadCount > 0 && (
    <span className="absolute -top-1.5 -right-1.5 z-50 min-w-[18px] h-[18px] flex items-center justify-center
      text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white shadow-sm">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  )}
</div>
```

### 26. 맹꽁이 클릭 시 메시지 + 관련 페이지 이동 기능

맹꽁이 AI 창을 클릭해서 열었을 때, 현재 배지에 연결된 메시지(수정 요청, 신규 코멘트 등)가 있으면 창 상단에 알림 카드 표시:

```tsx
{pendingMessages.map(msg => (
  <div key={msg.id} className="flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
    <p className="text-xs text-amber-800" style={KR}>{msg.text}</p>
    <button onClick={() => { setLocation(msg.link); closeMaengkongiChat(); }}
      className="text-xs text-amber-700 underline whitespace-nowrap">
      바로가기 →
    </button>
  </div>
))}
```

`pendingMessages`는 아래 조건으로 구성:
- `revision_requested` 상태 행사 → `"[행사명] 수정 요청"` + 링크: `/events/:id?tab=pr`
- 새 관리자 코멘트(읽지 않은 것) → `"[행사명]에 새 코멘트가 있습니다"` + 링크: `/events/:id?tab=comments`
- 관리자용: `submitted` 상태 행사 건수 → `"새 홍보 신청 N건"` + 링크: `/admin/events`

메시지를 클릭해서 해당 페이지로 이동하면 해당 메시지는 `pendingMessages`에서 제거(읽음 처리).  
읽음 상태는 `sessionStorage`에 저장 (`read_msg_${eventId}_${type}`).

---

## [알림 배너 클릭 후 처리 — 읽음 상태 관리]

### 27. 메인화면 알림 배너 클릭 후 사라지게 처리

**문제:** 메인화면에 `"수정 요청된 행사가 1건 있습니다. 확인해 주세요"` 배너가 있고, 클릭해서 해당 행사를 방문해도 돌아왔을 때 배너가 그대로 남아있음.

**수정:**

1. 배너 클릭 시 `sessionStorage.setItem(`dismissed_revision_${eventId}`, "true")` 저장 후 이동.
2. LandingPage 마운트 시, `revision_requested` 상태 행사 목록 중 `sessionStorage`에 이미 `dismissed_revision_${eventId}` 가 있는 항목은 배너에서 제외.
3. 단, `sessionStorage`는 브라우저 탭 세션 기준이므로 새 탭을 열거나 재로그인 시 다시 표시됨 — 이는 의도된 동작.
4. 추가로, 해당 행사의 status가 `revision_requested` 에서 다른 상태로 바뀐 경우(예: 대관자가 재제출해서 `submitted`가 된 경우) 배너가 자동으로 사라지므로, fetch 데이터를 기준으로 상태가 여전히 `revision_requested`인 경우에만 배너 표시.

---

## [기타]

### 28. Navigation width/배치 일관성

모든 nav 메뉴 클릭 시 header 및 body의 width, padding, 배치가 달라지는 문제.

App.tsx 또는 Layout 컴포넌트를 확인해서, 모든 페이지를 감싸는 wrapper div에 고정 너비와 padding을 일관되게 적용:

```tsx
{/* Layout wrapper */}
<div className="max-w-6xl mx-auto px-4 w-full">
  {children}
</div>
```

개별 페이지 컴포넌트(`AdminCalendarPage`, `EventDetailPage` 등)에서 각각 선언된 `max-w-6xl mx-auto` / `max-w-5xl mx-auto` 를 Layout에서 통일하고, 개별 페이지의 중복 선언은 제거하거나 Layout의 값으로 통일.  
Header 컴포넌트도 동일한 `max-w-6xl mx-auto px-4` 로 통일.

### 29. 관리자 회원 관리 — 이름 표시

`AdminUsersPage.tsx` 317번째 줄: `{u.name || "—"}` 로 이름을 표시하고 있으나 `u.name`이 null로 내려옴.

서버의 `/api/admin/users` 엔드포인트를 수정:
- `profiles` 테이블에 `name` 컬럼이 있다면 JOIN해서 포함
- `profiles` 테이블이 없다면, `events` 테이블의 `contact_name` 컬럼을 해당 유저의 가장 최신 행사에서 가져와서 `name`으로 반환
- SQL 예시:
  ```sql
  SELECT u.*, 
    COALESCE(p.name, e.contact_name) as name
  FROM users u
  LEFT JOIN profiles p ON p.user_id = u.id
  LEFT JOIN LATERAL (
    SELECT contact_name FROM events WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
  ) e ON true
  ```

### 30. 관리자/최고관리자 본인 이름 수정 기능

`AdminSettingsPage.tsx` 에 아래 섹션 추가:

```tsx
{/* ── 내 이름 수정 ── */}
<div className="border border-black/10 rounded-lg bg-white overflow-hidden">
  <div className="px-4 py-3 border-b border-black/8 bg-zinc-50/60">
    <h2 className="text-sm font-semibold text-foreground" style={KR}>👤 내 이름 수정</h2>
  </div>
  <div className="p-4 space-y-3">
    <div>
      <label className={labelCls} style={KR}>표시 이름</label>
      <input className={inputCls} style={KR}
        value={myName} onChange={e => setMyName(e.target.value)}
        placeholder="표시될 이름을 입력하세요" />
    </div>
    <button onClick={handleSaveName} disabled={!myName.trim()}
      className="h-8 px-4 text-xs font-medium bg-primary text-white rounded hover:bg-primary/85 disabled:opacity-50" style={KR}>
      저장
    </button>
    {nameSaved && <span className="text-xs text-emerald-600" style={KR}>✓ 저장되었습니다</span>}
  </div>
</div>
```

관련 state 및 핸들러:
```ts
const [myName, setMyName] = useState(me?.name ?? "");
const [nameSaved, setNameSaved] = useState(false);

const handleSaveName = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  await fetch(`${BASE}/api/users/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ name: myName }),
  });
  setNameSaved(true);
  setTimeout(() => setNameSaved(false), 3000);
};
```

서버에 `PATCH /api/users/me` 엔드포인트가 없으면 추가.

### 31. 시스템 설정 — 홍보 구역 관리 섹션 완전 삭제

`AdminSettingsPage.tsx`에서 아래 항목을 모두 삭제:

**삭제할 state:**
```ts
const [showZoneForm, setShowZoneForm] = useState(false);
const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
const [zoneForm, setZoneForm] = useState(emptyZoneForm);
const [zoneError, setZoneError] = useState("");
```

**삭제할 import:**
```ts
useListPromotionZones, useCreatePromotionZone, useUpdatePromotionZone, useDeletePromotionZone,
getListPromotionZonesQueryKey,
```

**삭제할 핸들러:** `handleEditZone`, `handleZoneSubmit`, `handleDeleteZone`

**삭제할 JSX:** zones 관련 렌더링 섹션 전체

**삭제할 상수:** `emptyZoneForm`, `ROLE_LABELS` (사용하지 않는 경우)

`BaekroSpeech` 내용 수정:
```tsx
인사말·가이드 PDF를 이 페이지에서 관리할 수 있어요!
가이드 PDF는 <strong>행사 등록 폼 상단</strong>에 링크로 표시되어 사용자들이 다운받을 수 있어요 📄
```

### 32. 맹꽁이 AI 채팅 nav 링크 동작 안 하는 문제

App.tsx 또는 라우터 설정 파일을 열어서:

1. 맹꽁이 AI 관련 nav 링크의 `to` 또는 `href` 속성값 확인 (예: `/chat`, `/ai`, `/maengkongi`)
2. 해당 경로에 대한 `<Route path="/chat" component={ChatPage} />` 가 라우터에 등록되어 있는지 확인
3. 없으면 추가. 해당 페이지 컴포넌트가 없으면 임시 페이지라도 생성
4. nav 클릭 시 `setLocation("/chat")` 또는 `<Link to="/chat">` 으로 연결되어 있는지 확인

---

### 33. 역할 기반 라우트 보호 (Route Guard)

현재 각 Admin 페이지 컴포넌트 내부에서 개별적으로 `if (me.role !== "admin") return <Redirect>` 체크를 하고 있음. 누락된 페이지가 있으면 보안 구멍이 생기므로, **라우터 레벨에서 한 번에 처리**하도록 수정.

**ProtectedRoute 컴포넌트 생성** (`src/components/ProtectedRoute.tsx`):

```tsx
import { Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGetMe } from "@workspace/api-client-react";

type Role = "user" | "admin" | "super_admin";

interface ProtectedRouteProps {
  component: React.ComponentType;
  allowedRoles?: Role[];
  redirectTo?: string;
}

export function ProtectedRoute({
  component: Component,
  allowedRoles,
  redirectTo = "/sign-in",
}: ProtectedRouteProps) {
  const { isSignedIn } = useAuth();
  const { data: me, isLoading } = useGetMe({ query: { enabled: !!isSignedIn } });

  // 로그인 안 된 경우
  if (!isSignedIn) return <Redirect to="/sign-in" />;

  // me 로딩 중이면 빈 화면 (또는 스피너)
  if (isLoading) return null;

  // 역할 제한이 있는데 해당 역할이 아닌 경우
  if (allowedRoles && me && !allowedRoles.includes(me.role as Role)) {
    return <Redirect to={redirectTo} />;
  }

  return <Component />;
}
```

**App.tsx 라우터에 적용:**

```tsx
import { ProtectedRoute } from "@/components/ProtectedRoute";

// 기존 라우팅
<Route path="/events/:id" component={EventDetailPage} />
<Route path="/events/new" component={EventCreatePage} />

// 관리자 전용 라우트 — allowedRoles 지정
<Route path="/admin">
  {() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin", "super_admin"]} redirectTo="/dashboard" />}
</Route>
<Route path="/admin/events">
  {() => <ProtectedRoute component={AdminEventsPage} allowedRoles={["admin", "super_admin"]} redirectTo="/dashboard" />}
</Route>
<Route path="/admin/calendar">
  {() => <ProtectedRoute component={AdminCalendarPage} allowedRoles={["admin", "super_admin"]} redirectTo="/dashboard" />}
</Route>
<Route path="/admin/users">
  {() => <ProtectedRoute component={AdminUsersPage} allowedRoles={["super_admin"]} redirectTo="/dashboard" />}
</Route>
<Route path="/admin/settings">
  {() => <ProtectedRoute component={AdminSettingsPage} allowedRoles={["admin", "super_admin"]} redirectTo="/dashboard" />}
</Route>

// 로그인 필요 라우트 (역할 무관)
<Route path="/dashboard">
  {() => <ProtectedRoute component={DashboardPage} />}
</Route>
```

**적용 후 각 Admin 페이지 컴포넌트 내부의 중복 체크 제거:**

`AdminCalendarPage.tsx`, `AdminSettingsPage.tsx`, `AdminUsersPage.tsx` 등 각 파일 상단의 아래 패턴을 삭제:
```tsx
// 삭제 대상
if (!isSignedIn) return <Redirect to="/sign-in" />;
if (me && me.role !== "admin" && me.role !== "super_admin") return <Redirect to="/dashboard" />;
```

라우터 레벨에서 이미 처리하므로 중복 불필요. 단, `EventDetailPage`처럼 로그인만 필요하고 역할 구분이 없는 페이지는 `ProtectedRoute`에서 `allowedRoles` 없이 사용하므로 내부 체크 유지해도 무방.

---

## 수정 완료 후 보고 형식

```
1. 대관자 알림 배너 — 완료
2. admin 자동 리다이렉트 — 완료
3. 관리자 신규 신청 배너 — 완료
...
32. 맹꽁이 nav 링크 — 완료 / 실패 (사유) / 스킵 (사유)
33. 역할 기반 라우트 보호 — 완료 / 실패 (사유) / 스킵 (사유)
```
