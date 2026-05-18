import React from "react";
import { SignUp } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignUpPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="font-pixel text-xl text-primary">노들섬 홍보 시스템</h1>
        <p className="font-pixel-body text-xl text-muted-foreground">회원가입하고 홍보 신청을 시작하세요 🐸</p>

        <div className="bg-white border-4 border-black shadow-[4px_4px_0_#000]">
          <SignUp
            routing="path"
            path={`${basePath}/sign-up`}
            signInUrl={`${basePath}/sign-in`}
            appearance={{
              elements: {
                rootBox: "w-full",
                cardBox: "w-full shadow-none border-0 rounded-none bg-white",
                card: "shadow-none",
                headerTitle: "font-pixel-body text-2xl font-bold",
                headerSubtitle: "font-pixel-body text-lg",
                formButtonPrimary:
                  "bg-primary hover:bg-primary/90 text-white rounded-none border-2 border-black font-pixel text-xs py-3 uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all",
                formFieldInput:
                  "rounded-none border-2 border-black font-pixel-body text-lg focus:ring-0 focus:border-primary",
                formFieldLabel: "font-pixel-body text-base uppercase font-bold",
                footerActionLink: "text-secondary font-pixel-body hover:text-primary underline",
                footerActionText: "font-pixel-body text-base",
                socialButtonsRoot: "hidden",
                dividerRow: "hidden",
                dividerLine: "hidden",
                dividerText: "hidden",
                alternativeMethods: "hidden",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
