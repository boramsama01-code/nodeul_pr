import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.post("/auth/register", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "이메일과 비밀번호를 입력해 주세요." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "비밀번호는 6자 이상이어야 합니다." });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    const msg = error.message?.includes("already registered")
      ? "이미 사용 중인 이메일입니다."
      : error.message || "회원가입 중 오류가 발생했습니다.";
    return res.status(400).json({ error: msg });
  }

  const supabaseId = data.user.id;
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const role = Number(count) === 0 ? "super_admin" : "user";
  await db.insert(usersTable).values({ supabaseId, email, role }).onConflictDoNothing();

  return res.json({ success: true, role });
});

export default router;
