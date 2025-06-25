```markdown
# Scalable Aircraft Defect Management System

## Project Overview

Develop a comprehensive aircraft defect viewing dashboard that demonstrates technical proficiency, scalability considerations, and strategic system design thinking. This project simulates building a core component for a digital aviation platform facilitating data exchange between airlines and maintenance repair organizations (MROs).

## Core Objectives

Create a controlled aircraft defect viewer showcasing both technical implementation skills and architectural planning for system growth and performance optimization.

## Technical Requirements

### 1. Frontend Implementation

**Dashboard Features:**
- Aircraft defect report display interface
- Tabular data presentation with:
  - Filter functionality by aircraft registration and defect severity levels
  - Expandable rows or modal dialogs for complete defect descriptions

**Scalability Considerations:**
- Design solutions capable of efficiently handling thousands of defect reports
- Address UI logic and rendering strategies for large datasets
- Implement or discuss pagination, virtualization, or similar optimization techniques

### 2. Backend Architecture

**Data Management:**
- Local JSON file loading or lightweight API implementation
- Backend options: Node.js, FastAPI, Firebase, or similar lightweight frameworks

**Performance Planning:**
- Simulate or describe high-volume request handling capabilities
- Address multi-user concurrent access scenarios
- Implement or discuss rate-limiting, caching, or lazy-loading strategies

### 3. Development Tooling Requirements

**Mandatory Tool Integration:**
- **AI-Assisted Development**: Utilize at least one tool (GitHub Copilot, GPT-4, Cursor, Cody)
- **Low-Code/No-Code Component**: Incorporate at least one element (Retool, Airtable, Firebase, Streamlit)
- **Custom Code Development**: Hand-write at least one component (UI, business logic, interactions, or backend functionality)

### 4. Documentation Standards

**README.md Requirements:**
- Project description and architectural rationale
- Technology stack selection and justification
- AI/LLM integration methodology and implementation details
- Low-code component utilization explanation
- Production scalability strategy covering:
  - Frontend rendering optimization approaches
  - Backend architecture scaling plans
  - Data flow and performance optimization techniques
- Setup and execution instructions
- Future improvement opportunities and current limitations

## Data Structure

**Source:** `aircraft_defects.json`

**Schema Format:**
```json
[
  {
    "id": "def456",
    "aircraft_registration": "OH-XYZ",
    "reported_at": "2024-05-22T14:30:00Z",
    "defect_type": "Avionics malfunction",
    "description": "Primary flight display intermittently lost power during descent.",
    "severity": "High"
  }
]
```

## Project Timeline

**Estimated Duration:** 8 hours 

If project remains incomplete within timeframe, document trade-offs and remaining tasks in README documentation.

## Assessment Criteria

| **Evaluation Area** | **Assessment Focus** |
|---------------------|---------------------|
| **AI-Native Development** | Intelligent utilization of LLMs, Copilot, and similar tools |
| **Scalability Awareness** | Thoughtful performance handling and data growth planning |
| **Technical Judgment** | Strategic decisions on custom coding vs. automation vs. low-code solutions |
| **Communication** | Clear, structured documentation and explanation quality |
| **Code Quality** | Clean, organized, and efficient implementation |
| **User Experience** | Functional, user-friendly interface (visual polish considered bonus) |

## Submission Requirements

**Deliverables:**
- Live application link (if deployment possible)
- GitHub repository or downloadable project package
- Comprehensive README or shared documentation file

```