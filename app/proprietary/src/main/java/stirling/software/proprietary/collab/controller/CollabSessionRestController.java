package stirling.software.proprietary.collab.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import lombok.RequiredArgsConstructor;

import stirling.software.proprietary.collab.dto.AnnotationPayload;
import stirling.software.proprietary.collab.dto.SessionDto;
import stirling.software.proprietary.collab.dto.WsMessage;
import stirling.software.proprietary.collab.model.CollabSession;
import stirling.software.proprietary.collab.model.CollabSession.Status;
import stirling.software.proprietary.collab.service.CollabSessionService;

@RestController
@RequestMapping("/api/v1/collab")
@Tag(name = "Collaboration", description = "Real-time collaborative PDF editing sessions")
@RequiredArgsConstructor
public class CollabSessionRestController {

    private final CollabSessionService sessionService;
    private final SimpMessagingTemplate messaging;

    public record CreateSessionRequest(String documentId, String documentName) {}

    public record InviteRequest(String username) {}

    @PostMapping("/sessions")
    @Operation(summary = "Create a new collaboration session")
    public ResponseEntity<SessionDto> createSession(
            @RequestBody CreateSessionRequest req, Principal principal) {
        CollabSession session =
                sessionService.createSession(
                        req.documentId(), req.documentName(), principal.getName());
        return ResponseEntity.ok(SessionDto.from(session));
    }

    @GetMapping("/sessions/{sessionId}")
    @Operation(summary = "Get session details and participants")
    public ResponseEntity<SessionDto> getSession(
            @PathVariable String sessionId, Principal principal) {
        CollabSession session = sessionService.getSession(sessionId);
        return ResponseEntity.ok(SessionDto.from(session));
    }

    @PostMapping("/sessions/{sessionId}/invite")
    @Operation(summary = "Invite a user to the session")
    public ResponseEntity<SessionDto> inviteUser(
            @PathVariable String sessionId, @RequestBody InviteRequest req, Principal principal) {
        CollabSession session =
                sessionService.inviteUser(sessionId, principal.getName(), req.username());
        SessionDto dto = SessionDto.from(session);
        messaging.convertAndSend(
                "/topic/session/" + sessionId, WsMessage.of("PARTICIPANT_JOIN", dto));
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/sessions/{sessionId}/annotations")
    @Operation(summary = "Get all annotations for a session")
    public ResponseEntity<List<AnnotationPayload>> getAnnotations(
            @PathVariable String sessionId, Principal principal) {
        return ResponseEntity.ok(sessionService.getAnnotations(sessionId, principal.getName()));
    }

    @PostMapping("/sessions/{sessionId}/review/submit")
    @Operation(summary = "Submit the document for review")
    public ResponseEntity<SessionDto> submitForReview(
            @PathVariable String sessionId, Principal principal) {
        return reviewAction(sessionId, principal.getName(), Status.IN_REVIEW);
    }

    @PostMapping("/sessions/{sessionId}/review/approve")
    @Operation(summary = "Approve the document (owner only)")
    public ResponseEntity<SessionDto> approve(@PathVariable String sessionId, Principal principal) {
        return reviewAction(sessionId, principal.getName(), Status.APPROVED);
    }

    @PostMapping("/sessions/{sessionId}/review/request-changes")
    @Operation(summary = "Request changes on the document (owner only)")
    public ResponseEntity<SessionDto> requestChanges(
            @PathVariable String sessionId, Principal principal) {
        return reviewAction(sessionId, principal.getName(), Status.CHANGES_REQUESTED);
    }

    private ResponseEntity<SessionDto> reviewAction(
            String sessionId, String username, Status status) {
        CollabSession session = sessionService.changeStatus(sessionId, username, status);
        SessionDto dto = SessionDto.from(session);
        messaging.convertAndSend("/topic/session/" + sessionId, WsMessage.of("REVIEW_STATUS", dto));
        return ResponseEntity.ok(dto);
    }
}
