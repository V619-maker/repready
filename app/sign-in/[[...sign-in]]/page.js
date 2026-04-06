'use client'

import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center">
      <SignIn 
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-[#0D0D1A] border border-border/50 shadow-2xl',
            headerTitle: 'text-white',
            headerSubtitle: 'text-muted-foreground',
            socialButtonsBlockButton: 'border border-border/50 text-white hover:bg-muted/30',
            dividerLine: 'bg-border/50',
            dividerText: 'text-muted-foreground',
            formFieldLabel: 'text-white',
            formFieldInput: 'bg-[#0A0A12] border-border/50 text-white focus:border-[#F5A623]',
            formButtonPrimary: 'bg-[#E63946] hover:bg-[#E63946]/90 text-white',
            footerActionLink: 'text-[#F5A623] hover:text-[#F5A623]/80',
            identityPreviewText: 'text-white',
            identityPreviewEditButton: 'text-[#F5A623]',
          }
        }}
        redirectUrl="/simulate"
        afterSignInUrl="/simulate"
      />
    </div>
  )
}
