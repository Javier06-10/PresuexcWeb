import Swal from 'sweetalert2';

const BRAND = '#8B4513';
const CANCEL_COLOR = '#6b7280';

export async function showSuccess(text: string, title = '¡Listo!') {
  return Swal.fire({
    icon: 'success', title, text,
    timer: 2200, showConfirmButton: false,
    timerProgressBar: true,
  });
}

export async function showError(text: string, title = 'Error') {
  return Swal.fire({ icon: 'error', title, text, confirmButtonColor: BRAND });
}

export async function showWarning(text: string, title = 'Advertencia') {
  return Swal.fire({ icon: 'warning', title, text, confirmButtonColor: BRAND });
}

export async function showInfo(text: string, title = 'Información') {
  return Swal.fire({ icon: 'info', title, text, confirmButtonColor: BRAND });
}

export async function showConfirm(text: string, title = '¿Estás seguro?'): Promise<boolean> {
  const result = await Swal.fire({
    icon: 'warning', title, text,
    showCancelButton: true,
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: BRAND,
    cancelButtonColor: CANCEL_COLOR,
    reverseButtons: true,
  });
  return result.isConfirmed;
}

export async function showDeleteConfirm(text: string, title = '¿Eliminar?'): Promise<boolean> {
  const result = await Swal.fire({
    icon: 'warning', title, text,
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: CANCEL_COLOR,
    reverseButtons: true,
  });
  return result.isConfirmed;
}
