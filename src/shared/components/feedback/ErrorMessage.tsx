export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

/** Mensaje de error visual consistente, con boton de reintentar opcional. */
export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="font-medium underline underline-offset-2 hover:text-red-800"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
