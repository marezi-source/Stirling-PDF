package stirling.software.proprietary.collab.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import stirling.software.proprietary.collab.model.CollabSession;

public interface CollabSessionRepository extends JpaRepository<CollabSession, String> {

    @Query(
            "SELECT DISTINCT s FROM CollabSession s LEFT JOIN s.participants p WHERE s.owner.username = :username OR p.username = :username")
    List<CollabSession> findByParticipantUsername(@Param("username") String username);
}
