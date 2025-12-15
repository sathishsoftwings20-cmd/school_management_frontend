type Props = {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  maxButtons?: number; // how many numbered buttons to show around current
};

export default function PaginationWithText({
  totalPages,
  currentPage,
  onPageChange,
  maxButtons = 5,
}: Props) {
  if (totalPages <= 1) return null;

  const left = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  const right = Math.min(totalPages, left + maxButtons - 1);
  const pages: number[] = [];
  for (let i = left; i <= right; i++) pages.push(i);

  return (
    <div className="mt-4 w-full rounded-lg border border-gray-100 bg-white p-4 flex items-center justify-between">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
        disabled={currentPage === 1}
      >
        ← Previous
      </button>

      <div className="flex items-center gap-2">
        {/* first page */}
        {pages[0] > 1 && (
          <>
            <PageButton
              page={1}
              active={currentPage === 1}
              onClick={onPageChange}
            />
            {pages[0] > 2 && <div className="px-2">…</div>}
          </>
        )}

        {pages.map((p) => (
          <PageButton
            key={p}
            page={p}
            active={p === currentPage}
            onClick={onPageChange}
          />
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <div className="px-2">…</div>
            )}
            <PageButton
              page={totalPages}
              active={currentPage === totalPages}
              onClick={onPageChange}
            />
          </>
        )}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
        disabled={currentPage === totalPages}
      >
        Next →
      </button>
    </div>
  );
}

function PageButton({
  page,
  active,
  onClick,
}: {
  page: number;
  active: boolean;
  onClick: (p: number) => void;
}) {
  return (
    <button
      onClick={() => onClick(page)}
      className={`w-9 h-9 rounded-md flex items-center justify-center text-sm ${
        active ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50"
      }`}
    >
      {page}
    </button>
  );
}
