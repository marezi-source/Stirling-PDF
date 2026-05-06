import { Badge, Button, Divider, Group, Stack, Text, Timeline } from "@mantine/core";
import type { SessionDto } from "@app/hooks/collab/collabTypes";

interface CollabReviewPanelProps {
  session: SessionDto;
  currentUsername: string;
  jwtToken: string;
  onStatusChange: (newStatus: SessionDto["status"]) => void;
}

const STATUS_COLORS: Record<SessionDto["status"], string> = {
  OPEN: "blue",
  IN_REVIEW: "yellow",
  APPROVED: "green",
  CHANGES_REQUESTED: "orange",
  CLOSED: "gray",
};

const STATUS_LABELS: Record<SessionDto["status"], string> = {
  OPEN: "Open",
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  CHANGES_REQUESTED: "Changes Requested",
  CLOSED: "Closed",
};

export function CollabReviewPanel({
  session,
  currentUsername,
  jwtToken,
  onStatusChange,
}: CollabReviewPanelProps) {
  const isOwner = session.ownerUsername === currentUsername;

  async function postAction(action: "submit" | "approve" | "request-changes") {
    const res = await fetch(`/api/v1/collab/sessions/${session.id}/review/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
    if (res.ok) {
      const updated: SessionDto = await res.json();
      onStatusChange(updated.status);
    }
  }

  return (
    <Stack gap="md" p="md">
      <Group justify="space-between">
        <Text fw={600} size="sm">
          Review Status
        </Text>
        <Badge color={STATUS_COLORS[session.status]} variant="light">
          {STATUS_LABELS[session.status]}
        </Badge>
      </Group>

      <Divider />

      <Timeline active={["OPEN", "IN_REVIEW", "APPROVED"].indexOf(session.status)} bulletSize={16} lineWidth={2}>
        <Timeline.Item title="Draft" />
        <Timeline.Item title="In Review" />
        <Timeline.Item
          title={
            session.status === "CHANGES_REQUESTED" ? "Changes Requested" : "Approved"
          }
          color={session.status === "CHANGES_REQUESTED" ? "orange" : "green"}
        />
      </Timeline>

      <Divider />

      <Stack gap="xs">
        {session.status === "OPEN" && (
          <Button
            variant="light"
            color="yellow"
            size="xs"
            fullWidth
            onClick={() => postAction("submit")}
          >
            Submit for Review
          </Button>
        )}

        {session.status === "IN_REVIEW" && isOwner && (
          <>
            <Button
              variant="light"
              color="green"
              size="xs"
              fullWidth
              onClick={() => postAction("approve")}
            >
              Approve
            </Button>
            <Button
              variant="light"
              color="orange"
              size="xs"
              fullWidth
              onClick={() => postAction("request-changes")}
            >
              Request Changes
            </Button>
          </>
        )}

        {session.status === "CHANGES_REQUESTED" && (
          <Button
            variant="light"
            color="yellow"
            size="xs"
            fullWidth
            onClick={() => postAction("submit")}
          >
            Resubmit for Review
          </Button>
        )}
      </Stack>

      <Divider />

      <Stack gap={4}>
        <Text size="xs" c="dimmed">
          Owner: <strong>{session.ownerUsername}</strong>
        </Text>
        <Text size="xs" c="dimmed">
          Document: <strong>{session.documentName}</strong>
        </Text>
        <Text size="xs" c="dimmed">
          Created: {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : "—"}
        </Text>
      </Stack>
    </Stack>
  );
}
