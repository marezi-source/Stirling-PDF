package stirling.software.proprietary.collab.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import stirling.software.proprietary.collab.model.CollabSession;

public interface CollabSessionRepository extends JpaRepository<CollabSession, String> {

    @Query("SELECT s FROM CollabSession s WHERE s.owner.username = :username OR :username MEMBER OF (SELECT u.username FROM s.participants u)")
    List<CollabSession> findByParticipantUsername(@Param("username") String username);
}
