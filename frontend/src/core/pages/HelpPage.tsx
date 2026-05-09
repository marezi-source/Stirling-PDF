import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  TextInput,
  Textarea,
  Button,
  Title,
  Text,
  Stack,
  Paper,
  Group,
  Box,
} from "@mantine/core";

function CheckCircleIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export default function HelpPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email address";
    if (message.trim().length < 10) errs.message = "Please provide more detail (at least 10 characters)";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Box
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <Container size="xs" style={{ textAlign: "center" }}>
          <Box
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "var(--mantine-color-green-light)",
              color: "var(--mantine-color-green-6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}
          >
            <CheckCircleIcon />
          </Box>
          <Title order={2} mb="xs">Message sent!</Title>
          <Text c="dimmed" mb="xl">
            Thanks for reaching out. We'll get back to you at <strong>{email}</strong> within 1–2 business days.
          </Text>
          <Button variant="default" onClick={() => navigate(-1)}>
            ← Go back
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box style={{ minHeight: "100vh", padding: "2rem 0 4rem" }}>
      <Container size="sm">
        <Group mb="xl">
          <Button variant="subtle" size="sm" onClick={() => navigate(-1)}>
            ← Back
          </Button>
        </Group>

        <Title order={2} mb={4}>Help & Support</Title>
        <Text c="dimmed" mb="xl">
          Have a question or ran into an issue? Fill in the form below and we'll get back to you.
        </Text>

        <Paper p="xl" radius="md" withBorder>
          <form onSubmit={(e) => void handleSubmit(e)}>
            <Stack gap="md">
              <TextInput
                label="Your name"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                error={errors.name}
                required
              />
              <TextInput
                label="Email address"
                placeholder="jane@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                error={errors.email}
                required
              />
              <Textarea
                label="Message"
                placeholder="Describe your issue or question in detail…"
                minRows={5}
                value={message}
                onChange={(e) => setMessage(e.currentTarget.value)}
                error={errors.message}
                required
              />
              <Button type="submit" loading={isSubmitting} fullWidth size="md" mt="xs">
                Send Message
              </Button>
            </Stack>
          </form>
        </Paper>

        <Text ta="center" c="dimmed" size="sm" mt="lg">
          You can also email us directly at{" "}
          <a href="mailto:feedback@onepdf.app" style={{ color: "inherit" }}>
            feedback@onepdf.app
          </a>
        </Text>
      </Container>
    </Box>
  );
}
