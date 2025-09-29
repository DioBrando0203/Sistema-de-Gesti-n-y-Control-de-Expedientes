import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const clasesPersonalizadas = {
  popup: 'border-2 border-[#253659] rounded-xl bg-white font-[Rubik]',
  title: 'text-[#253659] text-xl font-semibold',
  htmlContainer: 'text-[#334155] text-base',
  confirmButton: 'bg-[#253659] text-white px-5 py-2 rounded-md hover:bg-[#1e2238] focus:outline-none',
  cancelButton: 'bg-gray-200 text-gray-800 px-5 py-2 rounded-md hover:bg-gray-300 focus:outline-none',
};

/**
 * Muestra una confirmación con botones Sí / Cancelar
 */
export const mostrarConfirmacion = async ({
  titulo = '¿Estás seguro?',
  texto = '',
  confirmButtonText = 'Sí',
  cancelButtonText = 'Cancelar',
  icon = 'warning'
} = {}) => {
  const resultado = await Swal.fire({
    title: titulo,
    text: texto,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    backdrop: true,
    allowEscapeKey: true,
    allowOutsideClick: true,
    customClass: clasesPersonalizadas,
    buttonsStyling: false, // importante para que funcione customClass en botones
  });

  return resultado.isConfirmed;
};

/**
 * Muestra una alerta de éxito
 */
export const mostrarExito = (mensaje = 'Operación completada') => {
  Swal.fire({
    icon: 'success',
    title: 'Éxito',
    text: mensaje,
    timer: 2000,
    showConfirmButton: false,
    customClass: clasesPersonalizadas,
    buttonsStyling: false,
  });
};

/**
 * Muestra una alerta de error
 */
export const mostrarError = (mensaje = 'Ocurrió un error') => {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: mensaje,
    confirmButtonText: 'Cerrar',
    customClass: clasesPersonalizadas,
    buttonsStyling: false,
  });
};

/**
 * Muestra un loader con mensaje
 */
export const mostrarCargando = (mensaje = 'Procesando...') => {
  Swal.fire({
    title: mensaje,
    customClass: clasesPersonalizadas,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

/**
 * Cierra el loader o cualquier alerta abierta
 */
export const cerrarCargando = () => {
  Swal.close();
};
