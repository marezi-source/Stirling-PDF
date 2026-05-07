interface LoginHeaderProps {
  title?: string;
  subtitle?: string;
  centerOnly?: boolean;
}

export default function LoginHeader({
  subtitle,
}: LoginHeaderProps) {
  if (!subtitle) return null;
  return <p className="login-subtitle">{subtitle}</p>;
}
