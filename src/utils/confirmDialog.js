// utils/confirmDialog.js
import Swal from 'sweetalert2';

export const mostrarConfirmacion = async ({
  titulo = '¿Estás seguro?',
  texto = '',
  confirmButtonText = 'Sí',
  cancelButtonText = 'Cancelar'
} = {}) => {
  const resultado = await Swal.fire({
    title: titulo,
    text: texto,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    backdrop: true,
  });

  return resultado.isConfirmed;
};
