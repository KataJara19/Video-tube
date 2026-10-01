import Button from '../atoms/Button'
import Modal from '../molecules/Modal'

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Eliminar', busy, error, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      width="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Eliminando…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-6 text-muted">{message}</p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Modal>
  )
}
