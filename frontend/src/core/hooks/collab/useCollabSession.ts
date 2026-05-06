import { useCallback, useEffect, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type {
  AnnotationPayload,
  AnnotationType,
  PresencePayload,
  SessionDto,
  WsMessage,
} from "./collabTypes";

export interface CollabState {
  session: SessionDto | null;
  annotations: AnnotationPayload[];
  participants: string[];
  connected: boolean;
}

export interface CollabActions {
  addAnnotation: (
    type: AnnotationType,
    pageNumber: number,
    coords: string,
    content: string
  ) => void;
  updateAnnotation: (
    annotationId: string,
    content: string,
    resolved: boolean
  ) => void;
  deleteAnnotation: (annotationId: string) => void;
  sendPresence: (action: "JOIN" | "LEAVE") => void;
}

export function useCollabSession(
  sessionId: string | null,
  jwtToken: string | null
): CollabState & CollabActions {
  const [session, setSession] = useState<SessionDto | null>(null);
  const [annotations, setAnnotations] = useState<AnnotationPayload[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!sessionId || !jwtToken) return;

    // Fetch initial state
    fetch(`/api/v1/collab/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${jwtToken}` },
    })
      .then((r) => r.json())
      .then((dto: SessionDto) => {
        setSession(dto);
        setParticipants(dto.participantUsernames);
      })
      .catch(console.error);

    fetch(`/api/v1/collab/sessions/${sessionId}/annotations`, {
      headers: { Authorization: `Bearer ${jwtToken}` },
    })
      .then((r) => r.json())
      .then((anns: AnnotationPayload[]) => setAnnotations(anns))
      .catch(console.error);

    // Connect WebSocket
    const client = new Client({
      webSocketFactory: () => new SockJS("/ws"),
      connectHeaders: { Authorization: `Bearer ${jwtToken}` },
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/session/${sessionId}`, (msg: IMessage) => {
          const message: WsMessage = JSON.parse(msg.body);
          handleMessage(message);
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: (frame) => console.error("STOMP error", frame),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [sessionId, jwtToken]);

  const handleMessage = useCallback((message: WsMessage) => {
    switch (message.type) {
      case "ANNOTATION_ADD":
        setAnnotations((prev) => [...prev, message.payload as AnnotationPayload]);
        break;
      case "ANNOTATION_UPDATE":
        setAnnotations((prev) =>
          prev.map((a) =>
            a.id === (message.payload as AnnotationPayload).id
              ? (message.payload as AnnotationPayload)
              : a
          )
        );
        break;
      case "ANNOTATION_DELETE":
        setAnnotations((prev) =>
          prev.filter((a) => a.id !== (message.payload as string))
        );
        break;
      case "PRESENCE": {
        const p = message.payload as PresencePayload;
        setParticipants((prev) =>
          p.action === "JOIN"
            ? prev.includes(p.username) ? prev : [...prev, p.username]
            : prev.filter((u) => u !== p.username)
        );
        break;
      }
      case "PARTICIPANT_JOIN":
      case "REVIEW_STATUS":
        setSession(message.payload as SessionDto);
        break;
    }
  }, []);

  const send = useCallback(
    (destination: string, body: unknown) => {
      if (!sessionId || !clientRef.current?.connected) return;
      clientRef.current.publish({
        destination: `/app/session/${sessionId}/${destination}`,
        body: JSON.stringify(body),
      });
    },
    [sessionId]
  );

  const addAnnotation = useCallback(
    (type: AnnotationType, pageNumber: number, coords: string, content: string) =>
      send("annotation/add", { type, pageNumber, coords, content }),
    [send]
  );

  const updateAnnotation = useCallback(
    (annotationId: string, content: string, resolved: boolean) =>
      send("annotation/update", { annotationId, content, resolved }),
    [send]
  );

  const deleteAnnotation = useCallback(
    (annotationId: string) => send("annotation/delete", { annotationId }),
    [send]
  );

  const sendPresence = useCallback(
    (action: "JOIN" | "LEAVE") => send("presence", action),
    [send]
  );

  return {
    session,
    annotations,
    participants,
    connected,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    sendPresence,
  };
}
