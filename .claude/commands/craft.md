# /craft — Building Pipeline Orchestrator

You are an orchestrator. Run 3 agents in sequence to create, verify, and review a building.

The user's request: **$ARGUMENTS**

---

## Step 1: Plan

Launch the **planner** agent with:
> Create this building in MCP: $ARGUMENTS

Wait for it to finish. Note the project path and summary it returns.

## Step 2: Verify

Launch the **verifier** agent with:
> Verify MCP project "[project path from Step 1]". The original request was: $ARGUMENTS
> Check all collisions, door/window placement, furniture bounds, clearance zones, and completeness.

Wait for it to finish. Note the verdict (PASS/FAIL) and any fixes made.

## Step 3: Retrospective

Launch the **retro** agent with:
> Review MCP project "[project path from Step 1]". The original request was: $ARGUMENTS
> Verification result: [PASS/FAIL summary from Step 2]
> Give a retrospective on design quality and suggest improvements.

## Step 4: Report

After all agents finish, present a summary to the user:

```
## Craft Report

### Plan
[Room count, floors, total area from planner]

### Verification
[PASS/FAIL, number of issues found/fixed]

### Retrospective highlights
[Top 2-3 insights from retro agent]

### Final ASCII
[Show the final floor plans]
```

**IMPORTANT**: Each agent runs in its own isolated context via the Agent tool. Do NOT do the work yourself — delegate to the agents. Pass results between them via the prompts.
