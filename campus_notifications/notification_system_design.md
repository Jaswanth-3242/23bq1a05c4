# Stage 1

## REST API Design

GET /api/notifications/:studentId
PATCH /api/notifications/:notificationId/read
PATCH /api/notifications/:studentId/read-all
GET /api/notifications/:studentId/unread-count

Real-time: WebSockets via Socket.io

# Stage 2

## Database: PostgreSQL

Schema:
CREATE TABLE notifications (id UUID PRIMARY KEY, studentId UUID, type VARCHAR(20), message TEXT, isRead BOOLEAN DEFAULT false, createdAt TIMESTAMP DEFAULT NOW());

# Stage 3

## Slow Query Fix

Add index: CREATE INDEX idx ON notifications(studentId, isRead, createdAt DESC);

Placement query: SELECT DISTINCT s.id FROM students s JOIN notifications n ON s.id = n.studentId WHERE n.type = 'Placement' AND n.createdAt >= NOW() - INTERVAL '7 days';

# Stage 4

## Performance: Redis Cache + Pagination

# Stage 5

## notify_all Fix: Use Message Queue

Push each notification to queue. Workers process independently with retry.
DB save and email must be decoupled.

# Stage 6

## Priority Inbox

Weights: Placement=3, Result=2, Event=1
Score = weight / hours_since_notification
Use Min-Heap of size N for efficient top-N maintenance.
