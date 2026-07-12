# RepReady — Claude Code Instructions

## Always read first
Read REPREADY_CONTEXT.md before starting any task.

## Skills to use
- systematic-debugging — for any errors, 500s, or unexpected behavior
- subagent-driven-development — for building new features
- verification-before-completion — before every push
- finishing-a-development-branch — before every merge

## Hard rules
- Never touch Paddle-related code without flagging it first
- Never push directly to main — always use a branch + PR
- Never assume env vars are set — check REPREADY_CONTEXT.md for the current list
- After every task, update REPREADY_CONTEXT.md sprint status and known issues
- Strip PATs from git config immediately after every push

## Stack
Next.js 14, MongoDB Atlas, Clerk, ElevenLabs, Gemini 2.5 Flash, Vercel Hobby (10s timeout)
