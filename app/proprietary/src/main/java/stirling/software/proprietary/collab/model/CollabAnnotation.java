package stirling.software.proprietary.collab.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import stirling.software.proprietary.security.model.User;

@Entity
@Table(name = "collab_annotations")
@Getter
@Setter
@NoArgsConstructor
public class CollabAnnotation {

    public enum AnnotationType {
        HIGHLIGHT,
        NOTE,
        DRAWING,
        SHAPE,
        COMMENT
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private CollabSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AnnotationType type;

    @Column(nullable = false)
    private int pageNumber;

    @Column(columnDefinition = "TEXT")
    private String coords;

    @Column(columnDefinition = "TEXT")
    private String content;

    private boolean resolved = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
