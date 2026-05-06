package stirling.software.proprietary.collab.controller;

import java.security.Principal;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import stirling.software.proprietary.collab.dto.AnnotationPayload;
import stirling.software.proprietary.collab.dto.PresencePayload;
import stirling.software.proprietary.collab.dto.WsMessage;
import stirling.software.proprietary.collab.model.CollabAnnotation.AnnotationType;
import stirling.software.proprietary.collab.service.CollabSessionService;

@Controller
@Slf4j
@RequiredArgsConstructor
public class CollabSessionWsController {

    private final SimpMessagingTemplate messaging;
    private final CollabSessionService sessionService;

    public record AddAnnotationRequest(
            AnnotationType type, int pageNumber, String coords, String content) {}

    public record UpdateAnnotationRequest(String annotationId, String content, boolean resolved) {}

    public record DeleteAnnotationRequest(String annotationId) {}

    @MessageMapping("/session/{sessionId}/annotation/add")
    public void addAnnotation(
            @DestinationVariable String sessionId,
            @Payload AddAnnotationRequest req,
            Principal principal) {
        String username = principal.getName();
        AnnotationPayload saved =
                sessionService.addAnnotation(
                        sessionId, username, req.type(), req.pageNumber(), req.coords(), req.content());
        messaging.convertAndSend(
                "/topic/session/" + sessionId, WsMessage.of("ANNOTATION_ADD", saved));
    }

    @MessageMapping("/session/{sessionId}/annotation/update")
    public void updateAnnotation(
            @DestinationVariable String sessionId,
            @Payload UpdateAnnotationRequest req,
            Principal principal) {
        String username = principal.getName();
        AnnotationPayload updated =
                sessionService.updateAnnotation(
                        req.annotationId(), username, req.content(), req.resolved());
        messaging.convertAndSend(
                "/topic/session/" + sessionId, WsMessage.of("ANNOTATION_UPDATE", updated));
    }

    @MessageMapping("/session/{sessionId}/annotation/delete")
    public void deleteAnnotation(
            @DestinationVariable String sessionId,
            @Payload DeleteAnnotationRequest req,
            Principal principal) {
        String username = principal.getName();
        sessionService.deleteAnnotation(req.annotationId(), username);
        messaging.convertAndSend(
                "/topic/session/" + sessionId,
                WsMessage.of("ANNOTATION_DELETE", req.annotationId()));
    }

    @MessageMapping("/session/{sessionId}/presence")
    public void broadcastPresence(
            @DestinationVariable String sessionId,
            @Payload String action,
            Principal principal) {
        String username = principal.getName();
        PresencePayload payload =
                "LEAVE".equalsIgnoreCase(action)
                        ? PresencePayload.leave(username)
                        : PresencePayload.join(username);
        messaging.convertAndSend(
                "/topic/session/" + sessionId, WsMessage.of("PRESENCE", payload));
    }
}
