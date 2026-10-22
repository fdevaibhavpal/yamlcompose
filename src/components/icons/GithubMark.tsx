import { siGithub } from "simple-icons";

export function GithubMark({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d={siGithub.path} />
    </svg>
  );
}
