import { useCallback } from "react";
import React from "react";
import { useFileState, useFileSelection, useFileActions } from "@app/contexts/FileContext";
import { isStirlingFile } from "@app/types/fileContext";
import { useNavigationState } from "@app/contexts/NavigationContext";
import { useToolWorkflow } from "@app/contexts/ToolWorkflowContext";
import { ViewerContext } from "@app/contexts/ViewerContext";
import { downloadFile } from "@app/services/downloadService";

export function useExportAll() {
  const { workbench: currentView } = useNavigationState();
  const { selectors } = useFileState();
  const { selectedFiles, selectedFileIds } = useFileSelection();
  const { actions: fileActions } = useFileActions();
  const { pageEditorFunctions } = useToolWorkflow();
  const viewerContext = React.useContext(ViewerContext);
  const activeFiles = selectors.getFiles();

  const handleExportAll = useCallback(
    async (forceNewFile = false) => {
      if (currentView === "viewer") {
        const buffer = await viewerContext?.exportActions?.saveAsCopy?.();
        if (!buffer) return;
        const fileToExport =
          selectedFiles.length > 0 ? selectedFiles[0] : activeFiles[0];
        if (!fileToExport) return;
        const stub = isStirlingFile(fileToExport)
          ? selectors.getStirlingFileStub(fileToExport.fileId)
          : undefined;
        try {
          const result = await downloadFile({
            data: new Blob([buffer], { type: "application/pdf" }),
            filename: fileToExport.name,
            localPath: forceNewFile ? undefined : stub?.localFilePath,
          });
          if (!forceNewFile && !result.cancelled && stub && result.savedPath) {
            fileActions.updateStirlingFileStub(stub.id, {
              localFilePath: stub.localFilePath ?? result.savedPath,
              isDirty: false,
            });
          }
        } catch (error) {
          console.error("[useExportAll] Failed to export viewer file:", error);
        }
        return;
      }

      if (currentView === "pageEditor") {
        pageEditorFunctions?.onExportAll?.();
        return;
      }

      const filesToExport =
        selectedFiles.length > 0 ? selectedFiles : activeFiles;

      for (const file of filesToExport) {
        const stub = isStirlingFile(file)
          ? selectors.getStirlingFileStub(file.fileId)
          : undefined;
        try {
          const result = await downloadFile({
            data: file,
            filename: file.name,
            localPath: forceNewFile ? undefined : stub?.localFilePath,
          });
          if (result.cancelled) continue;
          if (!forceNewFile && stub && result.savedPath) {
            fileActions.updateStirlingFileStub(stub.id, {
              localFilePath: stub.localFilePath ?? result.savedPath,
              isDirty: false,
            });
          }
        } catch (error) {
          console.error("[useExportAll] Failed to export file:", file.name, error);
        }
      }
    },
    [
      currentView,
      selectedFiles,
      activeFiles,
      pageEditorFunctions,
      viewerContext,
      selectors,
      fileActions,
    ],
  );

  const totalItems =
    currentView === "pageEditor"
      ? (pageEditorFunctions?.totalPages ?? 0)
      : activeFiles.length;

  const isDisabled =
    currentView !== "viewer" &&
    currentView !== "pageEditor" &&
    totalItems === 0;

  return { handleExportAll, isDisabled, selectedFileIds };
}
