캐릭터 이미지 assets 폴더

## 구조

```
ml-checker-ui/app/assets/
└── characters/
    ├── character-onboarding-v3.jpg
    ├── character-pass-v3.jpg
    ├── character-attention-v3.jpg
    └── character-fail-v3.jpg
```

## 사용법

코드에서 import 로 사용:
```js
import characterOnboardingV3 from "../assets/characters/character-onboarding-v3.jpg";
```

## 배경

기존 `public/` 폴더에 있던 캐릭터 이미지들을 source 폴더로 이동하여
explicit한 import 방식으로 관리. public/ 정적 파일 서빙 대신
번들링된 import 방식으로 변경.