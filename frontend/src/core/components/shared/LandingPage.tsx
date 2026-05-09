import React, { useState } from "react";
import { ActionIcon, Container } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { useTranslation } from "react-i18next";
import { useFileHandler } from "@app/hooks/useFileHandler";
import { useFileActionTerminology } from "@app/hooks/useFileActionTerminology";
import MobileUploadModal from "@app/components/shared/MobileUploadModal";
import { openFilesFromDisk } from "@app/services/openFilesFromDisk";
import { LandingDocumentStack } from "@app/components/shared/LandingDocumentStack";
import { LandingActions } from "@app/components/shared/LandingActions";
import { LogoIcon } from "@app/components/shared/LogoIcon";
import { useRainbowThemeContext } from "@app/components/shared/RainbowThemeProvider";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import "@app/components/shared/LandingPage.css";

const LandingPage = () => {
  const { t } = useTranslation();
  const { addFiles } = useFileHandler();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const terminology = useFileActionTerminology();
  const [mobileUploadModalOpen, setMobileUploadModalOpen] = useState(false);
  const { toggleTheme, themeMode } = useRainbowThemeContext();

  const handleFileDrop = async (files: File[]) => {
    await addFiles(files);
  };

  const handleNativeUploadClick = async () => {
    const files = await openFilesFromDisk({
      multiple: true,
      onFallbackOpen: () => fileInputRef.current?.click(),
    });
    if (files.length > 0) {
      await addFiles(files);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      await addFiles(files);
    }
    event.target.value = "";
  };

  const handleFilesReceivedFromMobile = async (files: File[]) => {
    if (files.length > 0) {
      await addFiles(files);
    }
  };

  return (
    <Container
      size="70rem"
      p={0}
      h="100%"
      className="flex min-h-0 flex-col"
      style={{ position: "relative" }}
    >
      <Dropzone
        onDrop={handleFileDrop}
        multiple
        activateOnClick={false}
        enablePointerEvents
        aria-label={terminology.dropFilesHere}
        className="landing-dropzone flex min-h-0 flex-1 cursor-default flex-col items-center justify-center border-none bg-transparent px-4 py-8 shadow-none outline-none"
        styles={{
          root: {
            border: "none !important",
            backgroundColor: "transparent",
            overflow: "visible",
          },
          inner: {
            overflow: "visible",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          },
        }}
      >
        <LogoIcon className="landing-logo" aria-label="OnePDF" />

        <LandingDocumentStack />

        <h1 className="landing-title">
          {t("landing.heroTitle", "OnePDF")}
        </h1>
        <p className="landing-subtitle">
          {t(
            "landing.heroSubtitle",
            "Drop in or add an existing PDF to get started.",
          )}
        </p>

        <LandingActions
          fileInputRef={fileInputRef}
          onUploadClick={() => void handleNativeUploadClick()}
          onMobileUploadClick={() => setMobileUploadModalOpen(true)}
          onFileSelect={handleFileSelect}
        />
      </Dropzone>

      <MobileUploadModal
        opened={mobileUploadModalOpen}
        onClose={() => setMobileUploadModalOpen(false)}
        onFilesReceived={handleFilesReceivedFromMobile}
      />

      <ActionIcon
        variant="subtle"
        radius="xl"
        size="lg"
        onClick={toggleTheme}
        aria-label={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          zIndex: 10,
          color: themeMode === "dark" ? "rgba(255,255,255,0.65)" : "rgba(30,30,60,0.55)",
          backgroundColor: themeMode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(30,30,80,0.07)",
          backdropFilter: "blur(8px)",
          border: themeMode === "dark"
            ? "1px solid rgba(255,255,255,0.10)"
            : "1px solid rgba(30,30,80,0.12)",
          transition: "color 0.2s, background-color 0.2s",
        }}
      >
        {themeMode === "dark" ? (
          <LightModeIcon sx={{ fontSize: "1.2rem" }} />
        ) : (
          <DarkModeIcon sx={{ fontSize: "1.2rem" }} />
        )}
      </ActionIcon>
    </Container>
  );
};

export default LandingPage;
