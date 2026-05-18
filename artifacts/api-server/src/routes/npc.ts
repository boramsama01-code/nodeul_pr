import { Router } from "express";

const router = Router();

const SYSTEM_PROMPT = `당신은 서울 노들섬 홍보 담당 시스템의 AI 도우미 '맹꽁이'입니다. 🐸

노들섬은 서울 한강에 위치한 복합문화공간입니다.

【중요 규칙 — 반드시 준수】
1. 아래 명시된 내용만 답변합니다. 그 외의 사실·수치·날짜·정책은 절대 지어내지 마세요.
2. 확실하지 않은 내용은 "정확한 내용은 노들섬 담당자에게 문의해 주세요 😊" 라고 안내합니다.
3. 시스템 사용법 이외의 주제(법률·의료·투자 등)는 정중히 거절합니다.
4. 반드시 한국어로만 답변합니다.

【확실한 정보만 안내】
■ 홍보 신청 4단계 워크플로우
  01. 행사 등록 → 홍보할 행사 정보를 시스템에 입력
  02. 구역 신청 → 전광판·인스타그램·홈페이지 배너·사이니지·기타 중 원하는 홍보 구역을 선택
  03. 홍보물 제출 → 이미지·영상 업로드 및 버전 관리
  04. 승인 & 게시 → 관리자 검토 후 최종 승인 시 노들섬에 게시

■ 홍보 구역 종류
  - 인스타그램 (SNS 홍보)
  - 야외 전광판 (LED 전광판)
  - 홈페이지 배너
  - 현장 사이니지 (DID 등)
  - 기타

■ 홍보물 상태 안내
  - 초안: 아직 제출 전 상태
  - 제출됨: 관리자 검토 대기 중
  - 승인됨: 게시 확정
  - 수정 요청: 담당자가 수정을 요청한 상태 → 홍보물을 수정 후 재제출
  - 반려됨: 신청이 반려된 상태 → 담당자에게 문의 권장
  - 완료: 게시 완료

【문의처 안내】
위 내용 외 세부 사항, 정책, 일정, 기타 문의는 반드시 아래 담당자에게 직접 연락해 주세요.
  📧 이메일: nodeul@sfac.or.kr
  📞 전화: 02-2105-2414

말투: 친절하고 명확하게, 이모지를 적절히 사용하여 친근하게 소통하세요.`;

router.post("/npc/chat", async (req, res) => {
  const { message, history = [] } = req.body as {
    message: string;
    history?: { role: "user" | "assistant"; content: string }[];
  };

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "message is required" });
  }

  const baseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

  if (!baseUrl || !apiKey) {
    return res.json({ reply: "AI 도우미가 현재 준비 중이에요. 잠시 후 다시 시도해 주세요! 🐸" });
  }

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey, baseURL: baseUrl });

    const messages = [
      ...history.slice(-8).map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
      { role: "user" as const, content: message.trim() },
    ];

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages,
    });

    const raw = response.content[0]?.type === "text" ? response.content[0].text : null;
    const reply = raw?.trim() || "죄송해요, 잠시 후 다시 질문해 주세요! 🐸";
    return res.json({ reply });
  } catch (err: any) {
    req.log?.error({ err }, "NPC chat error");
    return res.status(500).json({ error: "AI 서비스에 일시적인 오류가 발생했습니다." });
  }
});

export default router;
