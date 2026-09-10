#!/usr/bin/env python3
"""
MABC 2026 결선 제출 전 체크리스트 (실행형 도구)

OT 발표자료(2026.09.09) + OT 웨비나 요약본 + 노션 세부 가이드
(제출 가이드/평가 가이드/크레딧 안내/OT 다시보기) 기준으로
제출물/규정/평가지표 체크를 한 항목씩 확인하며 진행할 수 있게 만든 스크립트.

예선 당선 스킬: ml-data-leakage-checker
제출 마감: 2026년 9월 16일(수) 18:00 KST (이후 제출·수정 절대 불가)

사용법:
    python3 mabc-checklist.py          # 인터랙티브 모드
    python3 mabc-checklist.py --list   # 전체 항목 리스트 출력
    python3 mabc-checklist.py --verify # 전체 확인 후 요약 리포트

옵션:
    --list    : 체크리스트 항목만 출력하고 종료
    --verify  : 모든 항목을 한 번에 확인(y/n)하고 요약 리포트 출력
"""

import sys
from typing import List, Tuple

# ---- 체크리스트 데이터 ----
# (구분, 항목, 확인포인트/힌트)
CHECKS: List[Tuple[str, str, str]] = [
    # 1. 공통 / 마감 / 규정
    ("공통/마감", "제출 마감 9/16(수) 18:00 KST — 이후 제출·수정 절대 불가", "구글폼 마감 시각 재확인"),
    ("공통/마감", "제출 구글폼(다음 주 초 공유 예정) 항목/필드 미리 확인", "폼 나오면 항목 기준으로 한 번 더 점검"),
    ("공통/마감", "데모데이(9/19) 팀원 1인 이상 현장 참석 가능", "한국과학기술회관 B1 대회의실1"),
    ("공통/마감", "LLM은 Solar Pro 4 전용 — 외부 LLM(Claude·GPT 등) 사용하지 않음", "외부 LLM 사용 시 부적격"),
    ("공통/마감", "개발 도구는 Timely·Hermes(SP4 연동)만 사용 — Claude Code·Cursor·Codex 등 사용 안 함", "허용 도구 외 사용은 부정행위"),
    ("공통/마감", "도용·표절, 법규 위반, 혐오 표현, 개인정보 노출, 타인 저작물 무단 사용 없음", "수상 후 소급 취소 가능"),
    # 2-1. 프로젝트 코드 / 저장소 / 보안
    ("프로젝트 코드", "최종 프로젝트 코드를 전부 GitHub에 푸시", "레포 전체 커밋 확인"),
    ("프로젝트 코드", "레포지토리를 Public으로 설정", "공개 여부 확인"),
    ("프로젝트 코드", "API 키·토큰·비밀번호·개인 계정 정보가 코드에 남아있지 않음", "환경변수/배포 환경 변수로 관리, 하드코딩 금지"),
    ("프로젝트 코드", ".gitignore에 .env·키 파일·빌드 산출물·캐시 등 제외 반영됨", "민감 파일 커밋 방지"),
    ("프로젝트 코드", "과거 커밋 이력까지 키/토큰/민감 정보 노출 여부 확인 완료", "삭제만으론 부족할 수 있어 이력 점검"),
    ("프로젝트 코드", "배포본 식별 정보(커밋 해시 등)를 제출 시 함께 기재할 수 있게 확보", "제출물 명세 요구 사항"),
    # 2-2. 발표자료
    ("발표자료", "제공된 템플릿으로 만들고 PDF로 변환 (편집 파일 제출 금지)", "PPT/Keynote 편집본 아닌 PDF 제출"),
    ("발표자료", "PDF 5장 이내로 분량 맞춤", "규정 규격 확인"),
    ("발표자료", "Noto Sans 폰트 사용/반영 여부 확인", "규정 폰트 요구사항"),
    ("발표자료", "발표 분량이 8분(Q&A 3분 별도) 안에 끝남", "발표 시간 테스트"),
    ("발표자료", "예선 스킬(ml-data-leakage-checker) 활용이 한눈에 보임", "서비스 안에서 스킬 활용이 보이는지"),
    ("발표자료", "SP4·타임리(또는 Hermes) 사용 후기가 가볍게 담겨 있음 (권장)", "사용 경험 한 줄 정도"),
    # 2-3. 포스터
    ("포스터", "제공된 템플릿 기준 A1 세로 1장 (PDF)", "템플릿 규격 확인"),
    ("포스터", "오탈자·이미지 깨짐 확인 (인쇄 후 수정 불가)", "최종 인쇄본 기준으로 재검토"),
    # 2-4. 데모 영상
    ("데모 영상", "영상이 3분 이내 MP4", "길이/형식 확인"),
    ("데모 영상", "실제 동작 화면 (더미/조작 화면 아님)", "실제 서비스 동작 녹화"),
    ("데모 영상", "녹화 화면에 API 키/토큰/개인 정보가 보이지 않음", "민감 정보 노출 점검"),
    # 2-5. 배포 링크
    ("배포 링크", "독립 배포 공개 URL 존재 (로컬 X, 타임리 내 동작 X, 타임리 워크스페이스 공유 링크 X)", "외부 공개 URL"),
    ("배포 링크", "시크릿 창에서 접속 테스트 완료", "시크릿/시크릿 모드 테스트"),
    ("배포 링크", "심사 종료까지 URL 유지 계획 확인", "도메인/호스팅 유지 계획"),
    ("배포 링크", "배포 환경 변수로 민감 설정값 관리, 배포 보호 해제 여부 등 공개 접근 확인", "공개 URL 요건 관련"),
    # 3. 평가 지표 관점
    ("평가지표", "Project Impact(25): 문제 정의가 타당·실용적이고 적절한 기획", "기획 의도 명확성"),
    ("평가지표", "예선 스킬 활용도(30): ml-data-leakage-checker가 서비스 중심 역할 + 안정적 동작 (최우선)", "가장 큰 배점 — 최우선 점검"),
    ("평가지표", "Technical Implementation(15): 첫 방문자도 직관적 활용, 핵심 기능 목적 적합·직관적", "사용성/직관성"),
    ("평가지표", "Innovation & Creativity(20): 사용 전후 효과 뚜렷, 문제 해결 방식 새로운가", "신규성/효과"),
    ("평가지표", "발표 전달력·논리(10): 발표 전달력, 내용 전달의 논리성 (현장 발표)", "발표 흐름"),
    # 4. 제출 직전 최종 확인
    ("제출 직전", "모든 제출물 URL/파일/레포 링크가 실제 접근 가능한 상태인지 최종 테스트", "링크·파일 최종 접속 확인"),
    ("제출 직전", "발표자료 PDF(5장 이내·Noto Sans·편집파일 금지)·포스터 PDF(A1)·데모 영상(MP4·3분 이내) 형식/파일명 규정 확인", "형식/파일명 규정 확인"),
    ("제출 직전", "구글폼에 입력하는 링크/파일이 실제 제출물과 일치하는지 확인", "불일치 방지"),
    ("제출 직전", "폼 제출 완료 후 제출 완료 화면/확인 메시지 캡처 또는 기록", "제출 증빙"),
    # 5. 제출 후 / 현장 심사 전
    ("제출 후", "배포 URL이 심사 종료까지 유지되는지 모니터링", "접근 유지 확인"),
    ("제출 후", "9/19(토) 현장 심사 일정·장소 확인 (한국과학기술회관 B1 대회의실1)", "1부 포스터 심사, 2부 TOP10 최종 피칭"),
    ("제출 후", "팀원 중 1인 이상 현장 참석 최종 확인", "참석자 확정"),
]


def list_checks() -> None:
    print("=" * 70)
    print("MABC 2026 결선 제출 전 체크리스트")
    print("예선 당선 스킬: ml-data-leakage-checker")
    print("제출 마감: 2026년 9월 16일(수) 18:00 KST (이후 제출·수정 절대 불가)")
    print("=" * 70)
    current = None
    for i, (section, item, hint) in enumerate(CHECKS, 1):
        if section != current:
            current = section
            print(f"\n## {section}")
        print(f"  [{i:02d}] [☐] {item}")
        if hint:
            print(f"        → {hint}")
    print(f"\n총 {len(CHECKS)}개 항목")
    print("=" * 70)


def interactive() -> None:
    print("=" * 70)
    print("각 항목을 확인하고 [y]/n 으로 응답하세요. (엔터=y)")
    print("=" * 70)
    results: List[Tuple[int, bool]] = []
    current = None
    for i, (section, item, hint) in enumerate(CHECKS, 1):
        if section != current:
            current = section
            print(f"\n## {section}")
            print("-" * 50)
        try:
            ans = input(f"[{i:02d}] {item}\n     힌트: {hint}\n     (y/n): ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print("\n중단되었습니다.")
            sys.exit(0)
        done = ans in ("y", "yes", "ㅛ", "")
        results.append((i, done))
        mark = "✓" if done else "✗"
        print(f"     → {mark}\n")

    _print_summary(results)


def verify_mode() -> None:
    print("=" * 70)
    print("각 항목에 대해 y(정오) / n(미확인) 로 한 번에 답하세요.")
    print("=" * 70)
    results: List[Tuple[int, bool]] = []
    current = None
    for i, (section, item, hint) in enumerate(CHECKS, 1):
        if section != current:
            current = section
            print(f"\n## {section}")
        try:
            ans = input(f"[{i:02d}] {item}  (y/n): ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print("\n중단되었습니다.")
            sys.exit(0)
        done = ans in ("y", "yes", "ㅛ", "")
        results.append((i, done))

    _print_summary(results)


def _print_summary(results: List[Tuple[int, bool]]) -> None:
    total = len(results)
    ok = sum(1 for _, d in results if d)
    missing = [i for i, d in results if not d]
    print("\n" + "=" * 70)
    print(f"결과: {ok}/{total} 항목 확인 완료")
    if missing:
        print(f"미확인 항목: {missing}")
        print("\n⚠ 아직 확인 안 된 항목이 있습니다. 제출 전에 반드시 점검하세요.")
    else:
        print("✓ 모든 항목 확인 완료.")
    print("=" * 70)

    # 섹션별 요약
    section_status: dict[str, list] = {}
    for i, (section, item, hint) in enumerate(CHECKS, 1):
        section_status.setdefault(section, []).append((i, item))
    print("\n[섹션별 요약]")
    for sec, items in section_status.items():
        sec_ok = sum(1 for idx, _ in items if results[idx - 1][1])
        print(f"  {sec}: {sec_ok}/{len(items)}")
    print()


def main() -> None:
    if "--list" in sys.argv:
        list_checks()
        return
    if "--verify" in sys.argv:
        verify_mode()
        return
    interactive()


if __name__ == "__main__":
    main()
