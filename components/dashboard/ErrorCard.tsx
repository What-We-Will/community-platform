type ErrorCardProps = {
  message: string | null; // can be string or null
};

export default function ErrorCard({ message }: ErrorCardProps) {
  if (!message) return null;

  return (
    <div
      style={{
        backgroundColor: "#fee2e2",
        border: "1px solid #f87171",
        color: "#b91c1c",
        padding: "12px",
        borderRadius: "6px",
        marginBottom: "10px",
      }}
    >
      {message}
    </div>
  );
}
