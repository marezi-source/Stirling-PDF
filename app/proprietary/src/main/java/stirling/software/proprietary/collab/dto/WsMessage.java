package stirling.software.proprietary.collab.dto;

public record WsMessage<T>(String type, T payload) {

    public static <T> WsMessage<T> of(String type, T payload) {
        return new WsMessage<>(type, payload);
    }
}
