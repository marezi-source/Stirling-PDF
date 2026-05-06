import { useState } from "react";
import {
  ActionIcon,
  Button,
  Drawer,
  Group,
  Modal,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import PeopleIcon from "@mui/icons-material/People";
import RateReviewIcon from "@mui/icons-material/RateReview";
import CommentIcon from "@mui/icons-material/Comment";
import ShareIcon from "@mui/icons-material/Share";
import { useCollabSession } from "@app/hooks/collab/useCollabSession";
import { CollabPresence } from "./CollabPresence";
import { CollabCommentThread } from "./CollabCommentThread";
import { CollabReviewPanel } from "./CollabReviewPanel";
import type { SessionDto } from "@app/hooks/collab/collabTypes";

function decodeJwtUsername(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? payload.username ?? null;
  } catch {
    return null;
  }
}

interface CollabBarProps {
  documentId: string;
  documentName: string;
}

type CommentFilter = "all" | "unresolved" | "mine";

export function CollabBar({ documentId, documentName }: CollabBarProps) {
  const jwtToken = localStorage.getItem("stirling_jwt");
  const currentUsername = decodeJwtUsername(jwtToken);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"comments" | "review">("comments");
  const [commentFilter, setCommentFilter] = useState<CommentFilter>("all");
  const [shareOpen, setShareOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [creating, setCreating] = useState(false);

  const collab = useCollabSession(sessionId, jwtToken);

  async function startSession() {
    if (!jwtToken) return;
    setCreating(true);
    try {
      const res = await fetch("/api/v1/collab/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ documentId, documentName }),
      });
      if (res.ok) {
        const dto: SessionDto = await res.json();
        setSessionId(dto.id);
        setShareOpen(true);
      }
    } finally {
      setCreating(false);
    }
  }

  async function inviteUser() {
    if (!jwtToken || !sessionId || !inviteUsername.trim()) return;
    await fetch(`/api/v1/collab/sessions/${sessionId}/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ username: inviteUsername.trim() }),
    });
    setInviteUsername("");
  }

  if (!jwtToken) return null;

  return (
    <>
      <Group gap="xs" align="center">
        {sessionId && collab.session ? (
          <>
            <CollabPresence
              participants={collab.participants}
              currentUsername={currentUsername ?? undefined}
              connected={collab.connected}
            />
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => { setSidebarTab("comments"); setSidebarOpen(true); }}
              title="Comments"
            >
              <CommentIcon fontSize="small" />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => { setSidebarTab("review"); setSidebarOpen(true); }}
              title="Review"
            >
              <RateReviewIcon fontSize="small" />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => setShareOpen(true)}
              title="Invite"
            >
              <PeopleIcon fontSize="small" />
            </ActionIcon>
          </>
        ) : (
          <Button
            size="xs"
            variant="light"
            leftSection={<ShareIcon fontSize="small" />}
            loading={creating}
            onClick={startSession}
          >
            Collaborate
          </Button>
        )}
      </Group>

      {/* Collaboration sidebar */}
      <Drawer
        opened={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        position="right"
        size="sm"
        title={
          <SegmentedControl
            size="xs"
            value={sidebarTab}
            onChange={(v) => setSidebarTab(v as "comments" | "review")}
            data={[
              { label: "Comments", value: "comments" },
              { label: "Review", value: "review" },
            ]}
          />
        }
      >
        {sidebarTab === "comments" ? (
          <Stack h="100%" gap={0}>
            <SegmentedControl
              size="xs"
              value={commentFilter}
              onChange={(v) => setCommentFilter(v as CommentFilter)}
              data={[
                { label: "All", value: "all" },
                { label: "Open", value: "unresolved" },
                { label: "Mine", value: "mine" },
              ]}
              mb="xs"
            />
            <CollabCommentThread
              annotations={collab.annotations}
              currentUsername={currentUsername ?? undefined}
              onUpdate={collab.updateAnnotation}
              onDelete={collab.deleteAnnotation}
              filter={commentFilter}
            />
          </Stack>
        ) : collab.session ? (
          <CollabReviewPanel
            session={collab.session}
            currentUsername={currentUsername ?? ""}
            jwtToken={jwtToken}
            onStatusChange={() => {}}
          />
        ) : null}
      </Drawer>

      {/* Invite modal */}
      <Modal
        opened={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Collaborate on this document"
        size="sm"
      >
        <Stack gap="md">
          {sessionId && (
            <Stack gap={4}>
              <Text size="xs" c="dimmed">
                Session ID (share with collaborators):
              </Text>
              <Text
                size="sm"
                ff="monospace"
                style={{ wordBreak: "break-all", cursor: "pointer" }}
                onClick={() => navigator.clipboard?.writeText(sessionId)}
                title="Click to copy"
              >
                {sessionId}
              </Text>
            </Stack>
          )}
          <TextInput
            label="Invite by username"
            placeholder="Enter username"
            value={inviteUsername}
            onChange={(e) => setInviteUsername(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && inviteUser()}
          />
          <Button onClick={inviteUser} disabled={!inviteUsername.trim()} fullWidth>
            Send Invite
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
