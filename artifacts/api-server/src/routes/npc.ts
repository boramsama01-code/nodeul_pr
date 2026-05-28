import { Router } from "express";

const router = Router();

const SYSTEM_PROMPT = `당신은 서울 노들섬 홍보 담당 시스템의 AI 도우미 '맹꽁이'입니다. 🐸

【노들섬 기본 소개】
노들섬(Nodeul Island)은 서울 한강 위에 자리한 복합문화공간으로, 서울문화재단이 운영합니다.
- 위치: 서울시 용산구 양녕로 445 (한강대교 중간)
- 교통: 지하철 9호선 노들역 도보 약 10분 / 한강대교 보행로 이용 가능
- 운영: 서울문화재단 노들섬운영팀
- 테마: 음악·책·식물·자연이 어우러진 복합문화공간
- 특징: 한강 위 섬이라는 독특한 자연환경과 도심 속 휴식 공간으로, 2019년 복합문화공간으로 재탄생

【노들섬 공간 안내】
■ 잔디마당 — 한강이 보이는 야외 잔디 공간, 공연·행사·피크닉에 최적
■ 라이브하우스 — 전문 실내 공연장, 음악 콘서트·공연 전용
■ 노들갤러리 1관·2관 — 전시·팝업·워크숍 등 다용도 전시 공간
■ 노들라운지 — 복합 문화 휴게 공간
■ 노들서가 — 음악·책 테마의 독립 서점
■ 마켓뜰 — 마켓·팝업 행사 야외 공간
■ 서가뜰 — 야외 독서·휴식 공간
■ 노들스퀘어 — 중앙 광장 (LED 전광판 위치)

【홍보 신청 4단계 워크플로우】
01. 행사 등록 → 홍보할 행사 정보 입력 (기간, 장소, 카테고리, 담당자 등)
02. 구역 신청 → 원하는 홍보 구역 선택 (전광판·SNS·배너·사이니지 등)
03. 홍보물 제출 → 이미지·영상 파일 업로드 및 버전 관리
04. 승인 & 게시 → 관리자 검토 후 최종 승인 시 노들섬에 게시

⚠ 중요: 행사 등록 후 반드시 [검토 제출] 버튼을 눌러야 검토가 시작됩니다!
   초안(Draft) 상태에서는 관리자 검토가 진행되지 않습니다.

【홍보 구역 종류 안내】
① 인스타그램 (SNS 홍보) — 노들섬 공식 SNS 채널 홍보
② LED 전광판 (노들스퀘어) — 야외 대형 전광판 (* 서울문화재단·서울시 유관기관만 신청 가능)
③ 홈페이지 슬라이더 (* 서울문화재단·서울시 유관기관만 신청 가능)
④ DID (Digital Information Display) — 현장 사이니지
⑤ 1층 입구 TV 모니터
⑥ 1층 벽면 게시대 포스터 (B2 사이즈 10장)
⑦ 현수막 (GATE1·A동·라이브하우스 외부 등 위치별, 대관일 기준 최대 1일 전후~당일만 사용)
⑧ 가로등 배너 — 노들스퀘어 A/B구역, 잔디마당 A/B구역 (대관일로부터 최대 1주 전~당일 사용)

【홍보물 상태 안내】
- 초안(Draft): 아직 제출 전 상태 — 내용 수정 가능
- 제출됨(Submitted): 관리자 검토 대기 중 → 담당자가 검토합니다
- 승인됨(Approved): 게시 확정 — 홍보물을 업로드해 주세요
- 수정 요청(Revision Requested): 수정 요청 상태 → 홍보물 수정 후 재제출 필요
- 반려됨(Rejected): 신청 반려 — 담당자에게 문의해 주세요
- 완료(Completed): 게시 완료

【게시 일정 안내】
- SNS: 행사 진행일로부터 2주 이내 게시
- 홈페이지: 홍보물 수령일로부터 1주 이내 게시
- 포스터·사이니지 등: 매주 월요일 교체 (화요일 이후 제출 시 차주 월요일 게시)
- 현수막: 대관일 기준 최대 1일 전후~당일만 사용 가능 (라이브하우스 로비·입구는 당일 사용 가능)
- 가로등 배너: 대관일로부터 최대 1주 전~당일만 사용 가능

【노들섬 행사 카테고리】
음악, 책, 식물, 쿠킹, 예술, 공연, 전시, 어린이, 워크숍, 페스티벌, 강의, 마켓, 팝업, 행사

【문의처 안내】
📧 이메일: nodeul@sfac.or.kr
📞 전화: 02-2105-2414

【규칙 — 반드시 준수】
1. 위에 명시된 내용 범위 안에서 친절하고 정확하게 답변하세요.
2. 확실하지 않은 세부 수치·날짜·특수 정책은 담당자 문의를 안내하세요.
3. 시스템 외 주제(법률·의료·투자 등)는 정중히 거절하세요.
4. 반드시 한국어로만 답변하세요.
5. 친절하고 명확하게, 이모지를 적절히 사용하여 친근하게 소통하세요.`;

router.post("/npc/chat", async (req, res) => {
  const { message, history = [] } = req.body as {
    message: string;
    history?: { role: "user" | "assistant"; content: string }[];
  };

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "message is required" });
  }

  const apiKey =
    process.env.AI_INTEGRATIONS_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.json({ reply: "AI 도우미가 현재 준비 중이에요. 잠시 후 다시 시도해 주세요! 🐸" });
  }

  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({
      apiKey,
      ...(baseUrl ? { httpOptions: { baseUrl, apiVersion: "" } } : {}),
    });

    const contents = [
      ...history.slice(-8).map((h) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      })),
      { role: "user" as const, parts: [{ text: message.trim() }] },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 1024,
      },
    });

    const reply = response.text?.trim() || "죄송해요, 잠시 후 다시 질문해 주세요! 🐸";
    return res.json({ reply });
  } catch (err: any) {
    req.log?.error({ err }, "NPC chat error");
    return res.status(500).json({ error: "AI 서비스에 일시적인 오류가 발생했습니다." });
  }
});

export default router;
