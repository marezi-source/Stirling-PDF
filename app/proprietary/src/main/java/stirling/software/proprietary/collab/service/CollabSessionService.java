package stirling.software.proprietary.collab.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;

import stirling.software.proprietary.collab.dto.AnnotationPayload;
import stirling.software.proprietary.collab.model.CollabAnnotation;
import stirling.software.proprietary.collab.model.CollabSession;
import stirling.software.proprietary.collab.model.CollabSession.Status;
import stirling.software.proprietary.collab.repository.CollabAnnotationRepository;
import stirling.software.proprietary.collab.repository.CollabSessionRepository;
import stirling.software.proprietary.security.model.User;
import stirling.software.proprietary.security.service.UserService;

@Service
@RequiredArgsConstructor
public class CollabSessionService {

    private final CollabSessionRepository sessionRepo;
    private final CollabAnnotationRepository annotationRepo;
    private final UserService userService;

    @Transactional
    public CollabSession createSession(
            String documentId, String documentName, String ownerUsername) {
        User owner = requireUser(ownerUsername);
        return sessionRepo.save(new CollabSession(documentId, documentName, owner));
    }

    public CollabSession getSession(String sessionId) {
        return sessionRepo
                .findById(sessionId)
                .orElseThrow(
                        () ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND, "Session not found"));
    }

    @Transactional
    public CollabSession inviteUser(
            String sessionId, String inviterUsername, String inviteeUsername) {
        CollabSession session = getSession(sessionId);
        requireOwnerOrParticipant(session, inviterUsername);
        User invitee = requireUser(inviteeUsername);
        session.getParticipants().add(invitee);
        return sessionRepo.save(session);
    }

    public List<AnnotationPayload> getAnnotations(String sessionId, String requestingUsername) {
        CollabSession session = getSession(sessionId);
        requireOwnerOrParticipant(session, requestingUsername);
        return annotationRepo.findBySessionIdOrderByCreatedAtAsc(sessionId).stream()
                .map(this::toPayload)
                .toList();
    }

    @Transactional
    public AnnotationPayload addAnnotation(
            String sessionId,
            String authorUsername,
            CollabAnnotation.AnnotationType type,
            int pageNumber,
            String coords,
            String content) {
        CollabSession session = getSession(sessionId);
        requireOwnerOrParticipant(session, authorUsername);
        User author = requireUser(authorUsername);

        CollabAnnotation ann = new CollabAnnotation();
        ann.setSession(session);
        ann.setAuthor(author);
        ann.setType(type);
        ann.setPageNumber(pageNumber);
        ann.setCoords(coords);
        ann.setContent(content);
        return toPayload(annotationRepo.save(ann));
    }

    @Transactional
    public AnnotationPayload updateAnnotation(
            String annotationId, String editorUsername, String content, boolean resolved) {
        CollabAnnotation ann =
                annotationRepo
                        .findById(annotationId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Annotation not found"));
        requireOwnerOrParticipant(ann.getSession(), editorUsername);
        ann.setContent(content);
        ann.setResolved(resolved);
        return toPayload(annotationRepo.save(ann));
    }

    @Transactional
    public void deleteAnnotation(String annotationId, String requestingUsername) {
        CollabAnnotation ann =
                annotationRepo
                        .findById(annotationId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Annotation not found"));
        boolean isAuthor = ann.getAuthor().getUsername().equals(requestingUsername);
        boolean isOwner = ann.getSession().getOwner().getUsername().equals(requestingUsername);
        if (!isAuthor && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        annotationRepo.delete(ann);
    }

    @Transactional
    public CollabSession changeStatus(
            String sessionId, String requestingUsername, Status newStatus) {
        CollabSession session = getSession(sessionId);
        boolean isOwner = session.getOwner().getUsername().equals(requestingUsername);
        boolean isParticipant =
                session.getParticipants().stream()
                        .anyMatch(u -> u.getUsername().equals(requestingUsername));

        if (!isOwner && !isParticipant) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant");
        }
        if ((newStatus == Status.APPROVED || newStatus == Status.CHANGES_REQUESTED) && !isOwner) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Only the owner can approve or request changes");
        }

        session.setStatus(newStatus);
        return sessionRepo.save(session);
    }

    private User requireUser(String username) {
        return userService
                .findByUsernameIgnoreCase(username)
                .orElseThrow(
                        () ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND, "User not found: " + username));
    }

    private void requireOwnerOrParticipant(CollabSession session, String username) {
        boolean allowed =
                session.getOwner().getUsername().equals(username)
                        || session.getParticipants().stream()
                                .anyMatch(u -> u.getUsername().equals(username));
        if (!allowed) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Not a participant in this session");
        }
    }

    private AnnotationPayload toPayload(CollabAnnotation a) {
        return new AnnotationPayload(
                a.getId(),
                a.getSession().getId(),
                a.getAuthor().getUsername(),
                a.getType(),
                a.getPageNumber(),
                a.getCoords(),
                a.getContent(),
                a.isResolved(),
                a.getCreatedAt() != null ? a.getCreatedAt().toString() : null,
                a.getUpdatedAt() != null ? a.getUpdatedAt().toString() : null);
    }
}
