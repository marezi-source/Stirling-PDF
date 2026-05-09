import { Avatar, Group, Indicator, Stack, Text, Tooltip } from "@mantine/core";

interface CollabPresenceProps {
  participants: string[];
  currentUsername?: string;
  connected: boolean;
}

function userInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function userColor(username: string): string {
  const colors = ["blue", "green", "grape", "orange", "teal", "cyan", "red", "yellow"];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function CollabPresence({ participants = [], currentUsername, connected }: CollabPresenceProps) {
  const visible = participants.slice(0, 5);
  const overflow = participants.length - visible.length;

  return (
    <Group gap="xs" align="center">
      <Indicator
        color={connected ? "green" : "gray"}
        size={8}
        offset={2}
        withBorder
        processing={connected}
      >
        <Text size="xs" c="dimmed">
          {connected ? "Live" : "Offline"}
        </Text>
      </Indicator>

      <Stack gap={0} style={{ flexDirection: "row", gap: 4 }}>
        {visible.map((username) => (
          <Tooltip key={username} label={username} position="bottom">
            <Avatar
              size="sm"
              radius="xl"
              color={userColor(username)}
              style={{ border: username === currentUsername ? "2px solid var(--mantine-color-blue-5)" : undefined }}
            >
              {userInitials(username)}
            </Avatar>
          </Tooltip>
        ))}
        {overflow > 0 && (
          <Avatar size="sm" radius="xl" color="gray">
            +{overflow}
          </Avatar>
        )}
      </Stack>
    </Group>
  );
}
