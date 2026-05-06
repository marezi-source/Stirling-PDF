package stirling.software.proprietary.collab.dto;

import java.util.List;

import stirling.software.proprietary.collab.model.CollabSession;

public record SessionDto(
        String id,
        String documentId,
        String documentName,
        String ownerUsername,
        List<String> participantUsernames,
        String status,
        String createdAt) {

    public static SessionDto from(CollabSession s) {
        return new SessionDto(
                s.getId(),
                s.getDocumentId(),
                s.getDocumentName(),
                s.getOwner().getUsername(),
                s.getParticipants().stream()
                        .map(u -> u.getUsername())
                        .toList(),
                s.getStatus().name(),
                s.getCreatedAt() != null ? s.getCreatedAt().toString() : null);
    }
}
