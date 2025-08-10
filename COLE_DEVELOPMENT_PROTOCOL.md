# Cole's Development Protocol - Dream Suite Project Management

## Your Role & Authority

You are the **final decision maker** and **system architect** for Dream Suite. Claude Code and Cursor are your development assistants, but you control all external systems (Stripe Dashboard, Supabase Console, GoDaddy, GitHub, etc.) and make all technical decisions. Your 8 years of computer science experience gives you the foundation - the AIs provide specialized implementation knowledge you may not be proficient in.

## Pre-Session Preparation Protocol

### 1. Environment Status Check (Every Session)
```bash
# Always run these commands first
git status                    # Check working directory state
git log --oneline -5          # See last 5 commits
node --version               # Verify Node.js version (must be v20+)
npm list --depth=0           # Check installed packages
```

### 2. Context Loading for AIs
**For Claude Code:**
- Always start by reading `CLAUDE.md` to understand current project state
- Update `CLAUDE.md` with what you're planning to work on this session
- If switching focus areas, read the relevant agent file (e.g., `agents-stripe-specialist.md`)

**For Cursor (when needed):**
- Use Cursor to read recent code changes: "Analyze the last commits and summarize what's been implemented"
- Have Cursor explain complex code sections you're unfamiliar with
- Use Cursor for debugging specific error messages

## Development Session Rules

### Rule 1: Git Workflow (NEVER BREAK)
```bash
# BEFORE any coding session:
git checkout -b feature/[description]    # Always work on feature branches
git push -u origin feature/[description] # Set upstream immediately

# DURING development:
git add .
git commit -m "Descriptive commit message"
git push

# AFTER session completion:
git checkout main
git pull origin main
git merge feature/[description]
git push origin main
git branch -d feature/[description]     # Clean up local branch
```

### Rule 2: Error Handling Protocol
When you encounter errors:

1. **Copy the EXACT error message** - don't paraphrase
2. **Capture the full context**:
   ```bash
   # Include these details with every error report:
   pwd                          # Current directory
   cat package.json | grep version  # Project versions
   ls -la                       # File permissions if relevant
   echo $NODE_ENV               # Environment
   ```
3. **Tell Claude Code**: "I got this error: [paste exact error]. Here's the context: [paste context]. The error occurred when I was doing: [describe exact steps]."
4. **Use Cursor for code analysis**: "This error occurred in [file]. Can you explain what this code is trying to do and why it might fail?"

### Rule 3: External Service Management
You control these directly - AIs cannot access them:

**Stripe Dashboard** (stripe.com):
- Check webhook endpoints are correctly configured
- Monitor test/live mode switches
- Verify API keys match your `.env.local` file
- Review payment logs when debugging transactions

**Supabase Console** (supabase.com):
- Monitor database logs during development
- Check Row Level Security policies when auth fails
- Review real-time subscriptions in the dashboard
- Verify environment variables match project settings

**GitHub Repository**:
- Create releases for major milestones
- Review pull requests (even if working solo)
- Manage repository secrets for CI/CD
- Monitor Actions if using automated deployment

**Domain/DNS (GoDaddy)**:
- Configure subdomains for staging environments
- Update DNS records for production deployment
- Manage SSL certificates

### Rule 4: AI Coordination Strategy

**Claude Code Strengths**:
- Full-stack architecture decisions
- Complex React Native implementation
- Database schema design
- Integration patterns
- Following established project patterns

**Cursor Strengths**:
- Reading and explaining existing code
- Debugging specific errors with file context
- Quick code analysis and suggestions
- Understanding IDE-specific issues

**Your Coordination Approach**:
1. Use Claude Code for new feature planning and implementation
2. Use Cursor when you need to understand existing code or debug errors
3. Always verify AI suggestions against your experience
4. Make final decisions on architecture and approach

### Rule 5: Documentation Updates (CRITICAL)
After every meaningful session:

```bash
# Update project documentation
echo "## Session [DATE] - [DESCRIPTION]
- **Goal**: [What you wanted to accomplish]
- **Completed**: [What actually got done]
- **Issues**: [Problems encountered and solutions]
- **Next Session**: [What to focus on next]
" >> CLAUDE.md
```

**Also Update**:
- `package.json` version numbers for releases
- `README.md` if setup process changes
- Relevant agent files if you discover better patterns

### Rule 6: Testing Protocol (Before Committing)
```bash
# Always run these before committing:
npm run build                 # Ensure no build errors
npm run test                  # Run existing tests
npm run lint                  # Check code quality

# For React Native specifically:
npx expo start --web          # Test web version
# Test on iOS simulator via Expo Go
# Test on Android emulator via Expo Go
```

### Rule 7: Environment Management
```bash
# Keep environments synchronized
cp .env.local .env.example    # Update example (remove actual keys)
git add .env.example
git commit -m "Update environment example"

# For production deployment:
# 1. Update Vercel environment variables via dashboard
# 2. Update Supabase environment variables if changed
# 3. Verify Stripe webhook endpoints point to correct URLs
```

## Troubleshooting Decision Tree

### When Code Doesn't Work:
1. **Check the basics**: Node version, package versions, environment variables
2. **Read the error carefully** - often tells you exactly what's wrong
3. **Ask Claude Code**: "This isn't working as expected. Here's what I'm seeing: [paste error/behavior]"
4. **Ask Cursor**: "Can you analyze this file and explain why this function might be failing?"
5. **Check external services**: Stripe logs, Supabase logs, browser network tab
6. **Make the decision**: Based on AI input and your experience, choose the solution

### When AI Suggestions Conflict:
1. **You are the final authority** - trust your experience
2. **Ask for reasoning**: "Why are you recommending this approach?"
3. **Consider maintainability**: Choose the solution you can understand and modify later
4. **Favor simplicity**: When in doubt, pick the simpler implementation

### When Stuck on Architecture Decisions:
1. **Reference the agent files**: They contain proven patterns for each domain
2. **Ask Claude Code**: "What are the pros and cons of approach A vs approach B?"
3. **Consider the roadmap**: Choose solutions that support future features
4. **Document your reasoning**: Future you will thank you

## Session End Checklist

- [ ] All code committed and pushed
- [ ] `CLAUDE.md` updated with session summary
- [ ] Feature branch merged and cleaned up
- [ ] External services (Stripe, Supabase) configured correctly
- [ ] Test deployment successful (if applicable)
- [ ] Next session priorities documented

## Remember: You Are In Control

The AIs are powerful tools, but you have the domain knowledge, business requirements understanding, and final decision-making authority. Use them to augment your capabilities, not replace your judgment. When you're unsure about their suggestions, ask questions, request explanations, and always verify against your own experience.

**Trust yourself. Direct the AIs. Build something amazing.**