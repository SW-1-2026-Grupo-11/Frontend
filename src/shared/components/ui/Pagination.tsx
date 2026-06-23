import Button from "./Button";

const PAGE_SIZE = 20;

type PaginationProps = {
  page: number;
  count: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  page,
  count,
  hasNext,
  hasPrevious,
  onPageChange,
}: PaginationProps) {
  if (count <= PAGE_SIZE) return null;

  const totalPages = Math.ceil(count / PAGE_SIZE);
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, count);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-md)",
        padding: "var(--space-md) var(--space-md) 0",
      }}
    >
      <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
        {from}–{to} de {count}
      </span>
      <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}>
        <Button
          variant="secondary"
          size="sm"
          disabled={!hasPrevious}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
          {page} / {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
