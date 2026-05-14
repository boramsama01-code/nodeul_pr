import React from "react";
import { SignIn } from "@clerk/react";
import { PixelCard } from "@/components/pixel/PixelCard";

export default function SignInPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="font-pixel text-2xl text-primary">SELECT SAVE FILE</h1>
        <p className="font-pixel-body text-xl text-muted-foreground">Welcome back, player.</p>
        
        <PixelCard padding="none" className="overflow-hidden p-1 bg-white">
          <SignIn 
            routing="path" 
            path={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/sign-in`}
            signUpUrl={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/sign-up`}
            appearance={{
              elements: {
                rootBox: "w-full",
                cardBox: "w-full shadow-none border-0 rounded-none bg-white",
                headerTitle: "font-pixel text-lg uppercase",
                headerSubtitle: "font-pixel-body text-lg",
                formButtonPrimary: "bg-primary hover:bg-primary/90 text-white rounded-none border-2 border-black font-pixel text-xs py-3 uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all",
                formFieldInput: "rounded-none border-2 border-black font-pixel-body text-lg focus:ring-0 focus:border-primary",
                formFieldLabel: "font-pixel-body text-lg uppercase",
                footerActionLink: "text-secondary font-pixel-body hover:text-primary",
                socialButtonsBlockButton: "rounded-none border-2 border-black font-pixel-body text-lg",
                socialButtonsBlockButtonText: "font-pixel-body text-lg uppercase",
                dividerText: "font-pixel-body text-sm uppercase",
                footerActionText: "font-pixel-body text-lg",
              }
            }}
          />
        </PixelCard>
      </div>
    </div>
  );
}