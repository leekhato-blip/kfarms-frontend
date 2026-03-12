# Support Backend Requirements

Frontend support center now expects API-first behavior with placeholder fallback from:
- `src/services/supportService.js`
- `src/pages/SupportPage.jsx`

## 1. Endpoints Required

All endpoints should be tenant-scoped and honor `X-Tenant-Id`.

### `GET /api/support/resources`
Return support knowledge resources used in-app.

Response:
```json
{
  "guides": [
    {
      "id": "pond-health-daily",
      "category": "Fish Ponds",
      "title": "Daily Pond Health Checklist",
      "summary": "Keep ponds stable...",
      "steps": ["step 1", "step 2"],
      "tip": "..."
    }
  ],
  "faqs": [
    {
      "id": "faq-1",
      "question": "How often should I update pond records?",
      "answer": "At least once daily..."
    }
  ],
  "channels": [
    {
      "id": "email",
      "label": "Email Support",
      "value": "support@kfarms.app",
      "note": "Replies within one business day.",
      "href": "mailto:support@kfarms.app"
    }
  ]
}
```

### `GET /api/support/tickets`
List tickets for active tenant.

Response:
```json
{
  "items": [
    {
      "id": "TKT-10023",
      "subject": "Sudden fish mortality in Pond B",
      "category": "Fish Ponds",
      "priority": "HIGH",
      "status": "PENDING",
      "description": "Observed abnormal mortality after heavy rain.",
      "createdAt": "2026-03-04T08:00:00.000Z",
      "updatedAt": "2026-03-04T10:00:00.000Z",
      "messages": [
        {
          "id": "MSG-1",
          "body": "Observed abnormal mortality...",
          "authorType": "USER",
          "authorName": "Kato",
          "createdAt": "2026-03-04T08:00:00.000Z"
        }
      ]
    }
  ]
}
```

### `POST /api/support/tickets`
Create ticket.

Request:
```json
{
  "subject": "Sudden fish mortality in Pond B",
  "category": "Fish Ponds",
  "priority": "HIGH",
  "description": "Observed abnormal mortality after heavy rain."
}
```

Response:
```json
{
  "ticket": {
    "id": "TKT-10023",
    "subject": "Sudden fish mortality in Pond B",
    "category": "Fish Ponds",
    "priority": "HIGH",
    "status": "OPEN",
    "description": "Observed abnormal mortality after heavy rain.",
    "createdAt": "2026-03-04T08:00:00.000Z",
    "updatedAt": "2026-03-04T08:00:00.000Z",
    "messages": []
  }
}
```

### `POST /api/support/tickets/:ticketId/messages`
Append a message/reply to ticket.

Request:
```json
{
  "body": "Additional context and screenshot details."
}
```

Response:
```json
{
  "ticket": {
    "id": "TKT-10023",
    "status": "PENDING",
    "updatedAt": "2026-03-04T10:00:00.000Z",
    "messages": [
      {
        "id": "MSG-1",
        "body": "Initial issue",
        "authorType": "USER",
        "authorName": "Kato",
        "createdAt": "2026-03-04T08:00:00.000Z"
      },
      {
        "id": "MSG-2",
        "body": "Additional context and screenshot details.",
        "authorType": "USER",
        "authorName": "Kato",
        "createdAt": "2026-03-04T10:00:00.000Z"
      }
    ]
  }
}
```

### `PATCH /api/support/tickets/:ticketId`
Update ticket status.

Request:
```json
{
  "status": "RESOLVED"
}
```

Accepted statuses:
- `OPEN`
- `PENDING`
- `RESOLVED`

Response:
```json
{
  "ticket": {
    "id": "TKT-10023",
    "status": "RESOLVED",
    "updatedAt": "2026-03-04T11:00:00.000Z"
  }
}
```

### `POST /api/support/chat`
Chatbot endpoint for in-app assistant.

Request:
```json
{
  "message": "How do I handle sudden fish mortality?",
  "context": {
    "tenantId": 12,
    "tenantName": "BlueLake Farms",
    "userName": "Kato"
  },
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

Response:
```json
{
  "reply": "Start with oxygen and water checks...",
  "suggestions": [
    "Show me a daily pond checklist",
    "How do I open a high-priority ticket?"
  ]
}
```

## 2. Minimum Data Model

- `support_tickets`
  - `id`, `tenant_id`, `subject`, `category`, `priority`, `status`, `description`, `created_by`, `created_at`, `updated_at`
- `support_ticket_messages`
  - `id`, `ticket_id`, `author_type` (`USER`/`SUPPORT`), `author_name`, `body`, `created_at`
- `support_knowledge_articles` (optional, if you want CMS-managed guides)
  - `id`, `category`, `title`, `summary`, `steps_json`, `tip`, `is_published`, `updated_at`
- `support_faqs` (optional)
  - `id`, `question`, `answer`, `is_published`, `updated_at`
- `support_chat_logs` (optional but recommended)
  - `id`, `tenant_id`, `user_id`, `role`, `message`, `created_at`

## 3. Security + Reliability

- Enforce tenant membership and role checks for all support operations.
- Validate allowed enum values for `priority` and `status`.
- Sanitize message body and length-limit subject/body server-side.
- Return stable `id` fields so frontend can merge updates.
- Include pagination for ticket list when volume grows.
- Add guardrails for chatbot responses (safety disclaimers, escalation guidance, and prompt filtering).

## 4. Placeholder-to-Live Transition

Frontend automatically switches to live mode once these endpoints return successful responses.
No page-level changes are required for the rollout.
