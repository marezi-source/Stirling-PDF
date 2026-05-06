import { ActionIcon, Badge, Box, Button, Group, ScrollArea, Stack, Text, Textarea } from "@mantine/core";
import { useState } from "react";
import type { AnnotationPayload } from "@app/hooks/collab/collabTypes";

interface CollabCommentThreadProps {
  annotations: AnnotationPayload[];
  currentUsername?: string;
  onUpdate: (id: string, content: string, resolved: boolean) => void;
  onDelete: (id: string) => void;
  filter?: "all" | "unresolved" | "mine";
}

export function CollabCommentThread({
  annotations,
  currentUsername,
  onUpdate,
  onDelete,
  filter = "all",
}: CollabCommentThreadProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const displayed = annotations
    .filter((a) => a.type === "COMMENT" || a.type === "NOTE")
    .filter((a) => {
      if (filter === "unresolved") return !a.resolved;
      if (filter === "mine") return a.authorUsername === currentUsername;
      return true;
    });

  function startEdit(ann: AnnotationPayload) {
    setEditingId(ann.id);
    setEditContent(ann.content ?? "");
  }

  function commitEdit(ann: AnnotationPayload) {
    onUpdate(ann.id, editContent, ann.resolved);
    setEditingId(null);
  }

  return (
    <ScrollArea h="100%" offsetScrollbars>
      <Stack gap="xs" p="sm">
        {displayed.length === 0 && (
          <Text c="dimmed" size="sm" ta="center" py="xl">
            No comments yet.
          </Text>
        )}
        {displayed.map((ann) => (
          <Box
            key={ann.id}
            p="sm"
            style={{
              borderRadius: 8,
              background: ann.resolved
                ? "var(--mantine-color-gray-1)"
                : "var(--mantine-color-body)",
              border: "1px solid var(--mantine-color-default-border)",
              opacity: ann.resolved ? 0.7 : 1,
            }}
          >
            <Group justify="space-between" mb={4}>
              <Group gap="xs">
                <Text size="xs" fw={600}>
                  {ann.authorUsername}
                </Text>
                <Text size="xs" c="dimmed">
                  p.{ann.pageNumber}
                </Text>
                {ann.resolved && (
                  <Badge size="xs" color="green" variant="light">
                    resolved
                  </Badge>
                )}
              </Group>
              <Group gap={4}>
                {ann.authorUsername === currentUsername && (
                  <>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      onClick={() => startEdit(ann)}
                      title="Edit"
                    >
                      ✏️
                    </ActionIcon>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="red"
                      onClick={() => onDelete(ann.id)}
                      title="Delete"
                    >
                      🗑
                    </ActionIcon>
                  </>
                )}
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color={ann.resolved ? "gray" : "green"}
                  onClick={() => onUpdate(ann.id, ann.content ?? "", !ann.resolved)}
                  title={ann.resolved ? "Re-open" : "Resolve"}
                >
                  {ann.resolved ? "↩" : "✓"}
                </ActionIcon>
              </Group>
            </Group>

            {editingId === ann.id ? (
              <Stack gap="xs">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.currentTarget.value)}
                  autosize
                  minRows={2}
                />
                <Group gap="xs">
                  <Button size="xs" onClick={() => commitEdit(ann)}>
                    Save
                  </Button>
                  <Button size="xs" variant="subtle" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </Group>
              </Stack>
            ) : (
              <Text size="sm">{ann.content}</Text>
            )}

            <Text size="xs" c="dimmed" mt={4}>
              {ann.createdAt ? new Date(ann.createdAt).toLocaleString() : ""}
            </Text>
          </Box>
        ))}
      </Stack>
    </ScrollArea>
  );
}
