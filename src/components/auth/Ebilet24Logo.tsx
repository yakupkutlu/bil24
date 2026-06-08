interface Props {
  className?: string;
}

export default function Ebilet24Logo({ className = '' }: Props) {
  return (
    <img
      src="/logo.png"
      alt="ebilet24.com — Online Biletin Tek Adresi"
      className={className}
    />
  );
}
