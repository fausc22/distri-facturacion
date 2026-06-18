import React, { useState, useEffect } from 'react';
import ModalBase from '../common/ModalBase';
import { useProductos } from '../../hooks/useProductos';
import { formatearMoneda } from '../../utils/formatearMoneda';
import { precioConIvaDesdeNeto, precioNetoDesdeConIva, roundPrecio } from '../../utils/rounding';

function ModalProducto({
  producto,
  isOpen,
  onClose,
  onProductoGuardado,
  modo = 'crear' // 'crear' o 'editar'
}) {
  const { crearProducto, actualizarProducto, obtenerCategorias, validarDatosProducto, loading } = useProductos();

  const [formData, setFormData] = useState({
    nombre: '',
    categoria_id: '',
    unidad_medida: 'Unidades',
    costo: '',
    precio: '',
    iva: '21.00',
    stock_actual: '0'
  });

  const [categorias, setCategorias] = useState([]);
  const [errores, setErrores] = useState([]);
  const [modoEntradaPrecio, setModoEntradaPrecio] = useState('sin_iva');
  const [precioConIvaInput, setPrecioConIvaInput] = useState('');

  // Cargar categorías al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarCategorias();
    }
  }, [isOpen]);

  const cargarCategorias = async () => {
    const resultado = await obtenerCategorias();
    if (resultado.success) {
      setCategorias(resultado.data);
    }
  };

  // Llenar formulario cuando se selecciona un producto para editar
  useEffect(() => {
    if (producto && modo === 'editar') {
      // Debug: ver qué valor viene de la BD
      console.log('📊 Producto recibido:', producto);
      console.log('📊 IVA del producto:', producto.iva, 'Tipo:', typeof producto.iva);
      
      // Convertir el IVA al formato correcto si viene como número
      let ivaValue = '21.00';
      if (producto.iva !== undefined && producto.iva !== null) {
        const ivaNum = parseFloat(producto.iva);
        ivaValue = ivaNum.toFixed(2);
      }
      
      console.log('📊 IVA formateado:', ivaValue);
      
      setFormData({
        nombre: producto.nombre || '',
        categoria_id: producto.categoria_id || '',
        unidad_medida: producto.unidad_medida || 'Unidades',
        costo: producto.costo || '',
        precio: producto.precio || '',
        iva: ivaValue,
        stock_actual: producto.stock_actual || '0'
      });
      setPrecioConIvaInput(
        String(precioConIvaDesdeNeto(producto.precio, ivaValue))
      );
    } else if (modo === 'crear') {
      // Limpiar formulario para crear nuevo
      setFormData({
        nombre: '',
        categoria_id: '',
        unidad_medida: 'Unidades',
        costo: '',
        precio: '',
        iva: '21.00',
        stock_actual: '0'
      });
      setPrecioConIvaInput('');
      setModoEntradaPrecio('sin_iva');
    }
    setErrores([]);
  }, [producto, modo, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrores([]);
  };

  const handlePrecioNetoChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, precio: value }));
    if (value !== '' && !Number.isNaN(Number(value))) {
      setPrecioConIvaInput(String(precioConIvaDesdeNeto(value, formData.iva)));
    } else {
      setPrecioConIvaInput('');
    }
    setErrores([]);
  };

  const handlePrecioConIvaChange = (e) => {
    const value = e.target.value;
    setPrecioConIvaInput(value);
    if (value !== '' && !Number.isNaN(Number(value))) {
      const neto = precioNetoDesdeConIva(value, formData.iva);
      setFormData((prev) => ({ ...prev, precio: String(neto) }));
    } else {
      setFormData((prev) => ({ ...prev, precio: '' }));
    }
    setErrores([]);
  };

  const handleIvaChange = (e) => {
    const ivaValue = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, iva: ivaValue };
      if (modoEntradaPrecio === 'con_iva' && precioConIvaInput !== '') {
        next.precio = String(precioNetoDesdeConIva(precioConIvaInput, ivaValue));
      } else if (prev.precio !== '') {
        setPrecioConIvaInput(String(precioConIvaDesdeNeto(prev.precio, ivaValue)));
      }
      return next;
    });
    setErrores([]);
  };

  const alternarModoPrecio = () => {
    setModoEntradaPrecio((prev) => (prev === 'sin_iva' ? 'con_iva' : 'sin_iva'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      precio: formData.precio !== '' ? String(roundPrecio(formData.precio)) : '',
    };

    const erroresValidacion = validarDatosProducto(payload);
    if (erroresValidacion.length > 0) {
      setErrores(erroresValidacion);
      return;
    }

    let resultado;
    if (modo === 'crear') {
      resultado = await crearProducto(payload);
    } else {
      resultado = await actualizarProducto(producto.id, payload);
    }

    if (resultado.success) {
      onProductoGuardado();
      onClose();
    }
  };

  const unidadesMedida = [
    'Kilos',
    'Litros',
    'Unidades'
  ];

  const porcentajesIVA = ['0.00', '10.50', '21.00'];

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={modo === 'crear' ? 'Crear Nuevo Producto' : `Editar Producto: ${producto?.nombre}`}
      loading={loading}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Errores */}
        {errores.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm font-semibold text-red-800 mb-1">Errores de validación:</p>
            <ul className="list-disc list-inside text-sm text-red-700">
              {errores.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Grid de 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
              required
              disabled={loading}
              placeholder="Ej: Aceite de Oliva Extra Virgen"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría *
            </label>
            <select
              name="categoria_id"
              value={formData.categoria_id}
              onChange={handleInputChange}
              className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
              disabled={loading}
              required
            >
              <option value="">Seleccionar...</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          {/* Unidad de Medida */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidad de Medida *
            </label>
            <select
              name="unidad_medida"
              value={formData.unidad_medida}
              onChange={handleInputChange}
              className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
              disabled={loading}
              required
            >
              {unidadesMedida.map(unidad => (
                <option key={unidad} value={unidad}>{unidad}</option>
              ))}
            </select>
          </div>

          {/* Costo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo (sin IVA) *
            </label>
            <input
              type="number"
              name="costo"
              value={formData.costo}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
              required
              disabled={loading}
              placeholder="0.00"
            />
          </div>

          {/* Precio */}
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="block text-sm font-medium text-gray-700">
                {modoEntradaPrecio === 'con_iva'
                  ? 'Precio de Venta (con IVA) *'
                  : 'Precio de Venta (sin IVA) *'}
              </label>
              <button
                type="button"
                onClick={alternarModoPrecio}
                className="text-xs font-medium text-primary hover:underline"
              >
                {modoEntradaPrecio === 'con_iva'
                  ? 'Ingresar sin IVA'
                  : 'Ingresar con IVA'}
              </button>
            </div>
            {modoEntradaPrecio === 'con_iva' ? (
              <input
                type="number"
                name="precio_con_iva"
                value={precioConIvaInput}
                onChange={handlePrecioConIvaChange}
                step="0.01"
                min="0"
                className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                required
                disabled={loading}
                placeholder="0.00"
              />
            ) : (
              <input
                type="number"
                name="precio"
                value={formData.precio}
                onChange={handlePrecioNetoChange}
                step="0.01"
                min="0"
                className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                required
                disabled={loading}
                placeholder="0.00"
              />
            )}
            {formData.precio && formData.iva && (
              <p className="mt-1 text-xs text-muted-foreground">
                {modoEntradaPrecio === 'con_iva' ? (
                  <>
                    Precio sin IVA: <strong>{formatearMoneda(roundPrecio(formData.precio))}</strong>
                  </>
                ) : (
                  <>
                    Precio con IVA:{' '}
                    <strong>{formatearMoneda(precioConIvaDesdeNeto(formData.precio, formData.iva))}</strong>
                  </>
                )}
              </p>
            )}
          </div>

          {/* IVA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IVA (%) *
            </label>
            <select
              name="iva"
              value={formData.iva}
              onChange={handleIvaChange}
              className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
              disabled={loading}
              required
            >
              {porcentajesIVA.map(porcentaje => (
                <option key={porcentaje} value={porcentaje}>
                  {parseFloat(porcentaje).toFixed(porcentaje === '10.50' ? 1 : 0)}%
                </option>
              ))}
            </select>
          </div>

          {/* Stock Actual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Actual *
            </label>
            <input
              type="number"
              name="stock_actual"
              value={formData.stock_actual}
              onChange={handleInputChange}
              step="0.5"
              min="0"
              className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
              required
              disabled={loading}
              placeholder="0"
            />
          </div>
        </div>

        {/* Información adicional */}
        {formData.precio && formData.iva && modoEntradaPrecio === 'sin_iva' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Precio con IVA:</span>{' '}
              {formatearMoneda(precioConIvaDesdeNeto(formData.precio, formData.iva))}
            </p>
          </div>
        )}

        {/* Botones — Fase 5: áreas táctiles ≥44px */}
        <div className="flex flex-wrap justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`min-h-[44px] min-w-[44px] px-6 py-2 text-white rounded-md touch-manipulation ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
            disabled={loading}
          >
            {loading ? 'Guardando...' : modo === 'crear' ? 'Crear Producto' : 'Actualizar Producto'}
          </button>
        </div>
      </form>
    </ModalBase>
  );
}

export default React.memo(ModalProducto);
