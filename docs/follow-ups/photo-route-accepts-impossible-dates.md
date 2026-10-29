# 존재하지 않는 날짜로 사진을 요청하면 검색어가 undefined가 된다

**Symptom**: `/api/photo?date=2026-13-45`처럼 형식만 맞는 가짜 날짜가 400이 아니라 200으로 응답하고, 엉뚱한 사진이 반환된다.

**Observed evidence**: 코드 리뷰(`code-review low`)가 `app/api/photo/route.ts`의 `^\d{4}-\d{2}-\d{2}$` 검사만 보고 지적했다. 실제 호출로는 재현하지 않았다.

**Suspected cause**: `lib/space-photo/pick.ts`의 `daysSinceEpoch`가 NaN을 돌려주고, `SEARCH_TERMS[NaN]`이 undefined라 NASA에 문자열 "undefined"가 검색어로 나간다.

**What was tried**: 아무것도 하지 않았다. 앱 화면은 기기의 실제 날짜만 보내므로 정상 사용에서는 닿지 않는다.

**Proposed next step**: 라우트 두 곳에서 날짜를 `Date`로 해석해 유효하지 않으면 400을 돌려주고, 그 경우를 다루는 테스트를 추가한다.
