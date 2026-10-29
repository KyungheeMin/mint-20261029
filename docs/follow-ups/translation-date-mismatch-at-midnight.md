# 자정을 넘기며 화면을 열면 사진과 번역의 날짜가 어긋날 수 있다

**Symptom**: 사진은 전날 것인데, 그 아래 한국어 번역은 다음 날 사진의 설명을 번역한 글이 붙을 수 있다.

**Observed evidence**: 코드 리뷰(`code-review low`)가 `components/meditation/home.tsx`에서 지적했다. `loadPhoto`와 `loadTranslation`이 각각 호출 시점에 `localDate()`를 다시 계산한다. 실제로 재현하지는 않았다.

**Suspected cause**: 두 요청이 순차로 나가서, 그 사이에 자정이 지나면 서로 다른 날짜가 서버로 간다.

**What was tried**: 아무것도 하지 않았다. 자정 직전에 화면을 여는 드문 경우에만 생긴다.

**Proposed next step**: 날짜를 한 번만 계산해 `MeditationSession`에 넘기거나, 사진 응답의 날짜 키를 번역 요청에 그대로 쓰도록 바꾸고 테스트를 추가한다.
