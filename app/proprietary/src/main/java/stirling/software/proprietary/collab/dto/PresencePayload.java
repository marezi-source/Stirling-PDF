package stirling.software.proprietary.collab.dto;

public record PresencePayload(String username, String action) {

    public static PresencePayload join(String username) {
        return new PresencePayload(username, "JOIN");
    }

    public static PresencePayload leave(String username) {
        return new PresencePayload(username, "LEAVE");
    }
}
