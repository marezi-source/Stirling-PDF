package stirling.software.proprietary.collab.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import stirling.software.proprietary.collab.model.CollabAnnotation;

public interface CollabAnnotationRepository extends JpaRepository<CollabAnnotation, String> {

    List<CollabAnnotation> findBySessionIdOrderByCreatedAtAsc(String sessionId);
}
