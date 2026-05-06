package stirling.software.proprietary.collab.dto;

import stirling.software.proprietary.collab.model.CollabAnnotation.AnnotationType;

public record AnnotationPayload(
        String id,
        String sessionId,
        String authorUsername,
        AnnotationType type,
        int pageNumber,
        String coords,
        String content,
        boolean resolved,
        String createdAt,
        String updatedAt) {}
