export type AnnotationType = "HIGHLIGHT" | "NOTE" | "DRAWING" | "SHAPE" | "COMMENT";

export interface AnnotationPayload {
  id: string;
  sessionId: string;
  authorUsername: string;
  type: AnnotationType;
  pageNumber: number;
  coords: string;
  content: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PresencePayload {
  username: string;
  action: "JOIN" | "LEAVE";
}

export interface SessionDto {
  id: string;
  documentId: string;
  documentName: string;
  ownerUsername: string;
  participantUsernames: string[];
  status: "OPEN" | "IN_REVIEW" | "APPROVED" | "CHANGES_REQUESTED" | "CLOSED";
  createdAt: string;
}

export type WsMessageType =
  | "ANNOTATION_ADD"
  | "ANNOTATION_UPDATE"
  | "ANNOTATION_DELETE"
  | "PRESENCE"
  | "PARTICIPANT_JOIN"
  | "REVIEW_STATUS";

export interface WsMessage<T = unknown> {
  type: WsMessageType;
  payload: T;
}
