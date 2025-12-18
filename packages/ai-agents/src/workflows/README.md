# LangGraph Workflows

This directory contains LangGraph workflow definitions for agentic RAG.

## Main Workflow

The primary workflow orchestrates multiple specialized agents:

```
User Query
    ↓
Query Router Agent
    ├─→ Constitutional Law Agent
    ├─→ Legislative Bill Agent
    ├─→ Parliamentary Proceedings Agent
    ├─→ Representative Tracker Agent
    └─→ Legal Reasoning Agent
    ↓
Synthesis Agent
    ↓
Response
```

## Features
- Conditional routing based on query type
- Parallel agent execution where possible
- State management across agent calls
- Memory and context preservation
- Error handling and fallbacks
