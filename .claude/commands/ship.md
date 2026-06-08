---
description: Full pre-deploy workflow
---

Execute in order, stop on first failure:

1. /check (lint + test + build)
2. Show git status and diff stat against main
3. Show last 5 commits
4. Ask user: "Ready to deploy? (yes/no)"
5. If yes: 
   - Tag release: `git tag v$(date +%Y.%m.%d-%H%M)`
   - Push to remote
   - Deploy: `bun run deploy` (or `vercel --prod`)
6. Report deployment URL
