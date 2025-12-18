# AI Agents

This directory contains specialized AI agents for Numainda v2.

## Planned Agents:

### 1. Query Router Agent
Routes user queries to specialized agents based on intent.

### 2. Constitutional Law Agent
Expertise in Pakistan's Constitution, fundamental rights, and amendments.

### 3. Legislative Bill Agent
Handles queries about bills, acts, and legislative processes.

### 4. Parliamentary Proceedings Agent
Processes debates, voting records, and session summaries.

### 5. Representative Tracker Agent
Provides information about MNAs, their voting history, and activities.

### 6. Legal Reasoning Agent
Uses o1/o3-mini for complex multi-hop reasoning.

## Implementation

Each agent will:
- Extend base Agent class
- Have specific tools and prompts
- Be integrated into LangGraph workflow
- Maintain state and context
