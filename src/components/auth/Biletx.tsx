interface Props {
  count?: 1 | 2 | 3 | 4;
  className?: string;
}

export default function Biletx({ count = 1, className = '' }: Props) {
  return (
    <img
      src={`/bilet${count}.png`}
      alt={`ebilet24 bilet ${count}`}
      className={className}
    />
  );
}
