type ThProps = {
  children?: React.ReactNode;
  align?: "left" | "right";
  sortDirection?: "asc" | "desc" | null;
  onClick?: () => void;
};

type TdProps = {
  children?: React.ReactNode;
  align?: "left" | "right";
  muted?: boolean;
  style?: React.CSSProperties;
};

const baseCellStyle: React.CSSProperties = {
  padding: "var(--space-sm) var(--space-md)",
  fontSize: "var(--font-size-sm)",
  borderBottom: "1px solid var(--color-border)",
};

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead style={{ backgroundColor: "var(--color-surface-hover)" }}>
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, align = "left", sortDirection, onClick }: ThProps) {
  return (
    <th
      onClick={onClick}
      style={{
        ...baseCellStyle,
        textAlign: align,
        fontWeight: "var(--font-weight-medium)",
        color: "var(--color-text-muted)",
        whiteSpace: "nowrap",
        cursor: onClick ? "pointer" : undefined,
        userSelect: onClick ? "none" : undefined,
      }}
    >
      {children}
      {sortDirection === "asc" && " ↑"}
      {sortDirection === "desc" && " ↓"}
    </th>
  );
}

export function Td({ children, align = "left", muted = false, style }: TdProps) {
  return (
    <td
      style={{
        ...baseCellStyle,
        textAlign: align,
        verticalAlign: "middle",
        color: muted ? "var(--color-text-muted)" : "var(--color-text)",
        ...style,
      }}
    >
      {children}
    </td>
  );
}
