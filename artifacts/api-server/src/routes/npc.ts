import { Router } from "express";

const router = Router();

const SYSTEM_PROMPT = `당신은 서울 노들섬 홍보 담당 시스템의 AI 도우미 '맹꽁이'입니다. 🐸

노들섬은 서울 한강에 위치한 복합문화공간으로, 서울시립교향악단(서울 필) 공연장, 라이브 하우스, 그린 카페, 야외 공연장 등이 있습니다.

당신은 다음 업무를 도와드립니다:
- 홍보 신청 방법 안내 (이벤트 등록 → 홍보 구역 신청 → 홍보물 제출)
- 홍보 구역 종류 설명: 인스타그램, 야외 전광판, 홈페이지 배너, 현장 사이니지, 기타
- 홍보 워크플로우 설명: 신청 → 승인 → 홍보물 제출 → 수정 → 최종 승인 → 게시
- 시스템 사용법 안내
- 노들섬 관련 일반 문의

말투: 친절하고 명확하게, 한국어로 답변합니다. 쉬운 말을 사용하고 핵심을 간단히 설명하세요.
이모지를 적절히 사용하여 친근하게 소통하세요.
모를 경우 "노들섬 담당자(nodeul@sfac.or.kr)에게 문의해 주세요."라고 안내합니다.
반드시 한국어로만 답변하세요.`;

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
