export default function DebugDbPage() {
  const url = process.env.DATABASE_URL || "";
  const hostMatch = url.match(/@([^:/]+)/);

  return (
    <pre style={{ padding: 20 }}>
      {JSON.stringify(
        {
          hasDatabaseUrl: Boolean(url),
          dbHost: hostMatch?.[1] ?? "unknown",
          rawStartsWith: url.slice(0, 30),
        },
        null,
        2
      )}
    </pre>
  );
}
