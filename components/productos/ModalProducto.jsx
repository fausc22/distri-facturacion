import { useState, useEffect } from 'react';
import ModalBase from '../common/ModalBase';
import { useProductos } from '../../hooks/useProductos';

export default function ModalProducto({
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
    }
    setErrores([]);
  }, [producto, modo, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrores([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar datos
    const erroresValidacion = validarDatosProducto(formData);
    if (erroresValidacion.length > 0) {
      setErrores(erroresValidacion);
      return;
    }

    let resultado;
    if (modo === 'crear') {
      resultado = await crearProducto(formData);
    } else {
      resultado = await actualizarProducto(producto.id, formData);
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
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
              placeholder="0.00"
            />
          </div>

          {/* Precio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio de Venta (sin IVA) *
            </label>
            <input
              type="number"
              name="precio"
              value={formData.precio}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
              placeholder="0.00"
            />
          </div>

          {/* IVA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IVA (%) *
            </label>
            <select
              name="iva"
              value={formData.iva}
              onChange={handleInputChange}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
              placeholder="0"
            />
          </div>
        </div>

        {/* Información adicional */}
        {formData.precio && formData.iva && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Precio con IVA:</span>{' '}
              ${(parseFloat(formData.precio) * (1 + parseFloat(formData.iva) / 100)).toFixed(2)}
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`px-6 py-2 text-white rounded-md ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
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
