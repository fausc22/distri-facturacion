import { MdCloudUpload, MdRemoveRedEye } from 'react-icons/md';
import { FormModal } from '@/components/shared/FormModal';
import { Button } from '@/components/ui/button';

export default function ModalComprobanteCompra({
  open,
  tipo,
  id,
  comprobanteExistente,
  comprobante,
  uploadingComprobante,
  getArchivoInfo,
  onClose,
  onFileChange,
  onUpload,
  onView,
  onDelete,
}) {
  const archivoInfo = comprobante ? getArchivoInfo?.() : null;
  const tipoLabel = tipo === 'compra' ? 'Compra' : 'Gasto';

  return (
    <FormModal
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title="Gestión de Comprobante"
      size="md"
      submitLabel={comprobanteExistente ? 'Reemplazar Comprobante' : 'Subir Comprobante'}
      loading={uploadingComprobante}
      onSubmit={onUpload}
      disableSubmit={!comprobante}
    >
      <div className="space-y-4">
        <p className="text-center text-sm text-muted-foreground">
          {tipoLabel} #{id}
        </p>

        <div className="rounded-lg bg-muted/40 p-4 text-center">
          {comprobanteExistente ? (
            <>
              <MdRemoveRedEye size={36} className="mx-auto mb-3 text-primary" />
              <p className="mb-4 text-sm font-medium text-emerald-700">
                Este registro ya tiene un comprobante cargado.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" size="sm" onClick={onView}>
                  Ver Comprobante
                </Button>
                <Button type="button" size="sm" variant="danger" onClick={onDelete}>
                  Eliminar
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Si necesitas reemplazar el comprobante, selecciona un nuevo archivo.
              </p>
            </>
          ) : (
            <>
              <MdCloudUpload size={48} className="mx-auto mb-3 text-primary" />
              <p className="text-sm">No hay ningún comprobante cargado para este registro.</p>
            </>
          )}
        </div>

        <div className="cursor-pointer rounded-lg border-2 border-dashed p-6 text-center hover:bg-muted/20">
          <input
            type="file"
            id="comprobante-input"
            className="hidden"
            onChange={onFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          <label htmlFor="comprobante-input" className="cursor-pointer">
            <span className="font-medium text-primary">Haz clic para seleccionar un archivo</span>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF, JPG, PNG, DOC, DOCX (Máx. 10MB)
            </p>
          </label>

          {archivoInfo && (
            <div className="mt-4 rounded-lg bg-primary/5 p-3 text-left">
              <p className="text-sm font-medium">Archivo seleccionado: {archivoInfo.nombre}</p>
              <p className="text-xs text-muted-foreground">Tamaño: {archivoInfo.tamaño}</p>
              {archivoInfo.preview && (
                <img
                  src={archivoInfo.preview}
                  alt="Vista previa"
                  className="mx-auto mt-2 h-32 rounded border object-contain"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </FormModal>
  );
}
