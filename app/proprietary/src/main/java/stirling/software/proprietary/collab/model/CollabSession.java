package stirling.software.proprietary.collab.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import stirling.software.proprietary.security.model.User;

@Entity
@Table(name = "collab_sessions")
@Getter
@Setter
@NoArgsConstructor
public class CollabSession {

    public enum Status {
        OPEN,
        IN_REVIEW,
        APPROVED,
        CHANGES_REQUESTED,
        CLOSED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String documentId;

    @Column(nullable = false)
    private String documentName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "collab_session_participants",
            joinColumns = @JoinColumn(name = "session_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id"))
    private Set<User> participants = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.OPEN;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CollabAnnotation> annotations = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime closedAt;

    public CollabSession(String documentId, String documentName, User owner) {
        this.documentId = documentId;
        this.documentName = documentName;
        this.owner = owner;
        this.participants.add(owner);
    }
}
