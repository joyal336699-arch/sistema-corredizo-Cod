// ==============================================
// CONFIGURACIÓN DEL BACKEND
// ==============================================
const API_BASE_URL = 'https://sistema-corrediza-ca7025.onrender.com';

// Variable para recordar qué select fue el último en cambiar
let ultimoSelectCambiado = null;

// ==============================================
// SISTEMA DE NOTIFICACIONES TOAST
// ==============================================
function mostrarToast(tipo, titulo, mensaje) {
    const container = document.getElementById('toastContainer');
    const toastsExistentes = container.querySelectorAll('.toast');
    toastsExistentes.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    let icon = 'info-circle';
    if (tipo === 'warning') icon = 'exclamation-triangle';
    if (tipo === 'error') icon = 'times-circle';
    if (tipo === 'success') icon = 'check-circle';
    
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas fa-${icon}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${titulo}</div>
            <div class="toast-message">${mensaje}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function mostrarAyuda() {
    mostrarToast('info', 'Ayuda', 'Ingresa las medidas del vano (Ancho 600-2400 mm, Altura 1000-2200 mm)');
}

// ==============================================
// FUNCIONES DE VALIDACIÓN
// ==============================================
function validarEntradaAv(mostrarToastError = false) {
    const input = document.getElementById('entradaAv');
    const value = parseInt(input.value);
    const message = document.getElementById('avMessage');
    const icon = input.parentElement.querySelector('.input-icon');
    
    if (!input.value || input.value.trim() === '') {
        input.className = 'form-control warning';
        icon.className = 'input-icon fas fa-exclamation-triangle';
        message.className = 'validation-message';
        if (mostrarToastError) {
            mostrarToast('warning', 'Campo vacío', 'Ingresa el ancho del vano (600-2400 mm)');
        }
        return false;
    }
    
    if (value < 600 || value > 2400) {
        input.className = 'form-control error';
        icon.className = 'input-icon error fas fa-times-circle';
        message.className = 'validation-message error';
        message.textContent = `❌ Error: ${value} mm fuera de rango (600-2400 mm)`;
        if (mostrarToastError) {
            mostrarToast('error', 'Error de validación', `Ancho ${value} mm fuera de rango (600-2400 mm)`);
        }
        return false;
    } else {
        input.className = 'form-control valid';
        icon.className = 'input-icon valid fas fa-check-circle';
        message.className = 'validation-message valid';
        message.textContent = `✅ Correcto: ${value} mm`;
        return true;
    }
}

function validarEntradaHv(mostrarToastError = false) {
    const input = document.getElementById('entradaHv');
    const value = parseInt(input.value);
    const message = document.getElementById('hvMessage');
    const icon = input.parentElement.querySelector('.input-icon');
    
    if (!input.value || input.value.trim() === '') {
        input.className = 'form-control warning';
        icon.className = 'input-icon fas fa-exclamation-triangle';
        message.className = 'validation-message';
        if (mostrarToastError) {
            mostrarToast('warning', 'Campo vacío', 'Ingresa la altura del vano (1000-2200 mm)');
        }
        return false;
    }
    
    if (value < 1000 || value > 2200) {
        input.className = 'form-control error';
        icon.className = 'input-icon error fas fa-times-circle';
        message.className = 'validation-message error';
        message.textContent = `❌ Error: ${value} mm fuera de rango (1000-2200 mm)`;
        if (mostrarToastError) {
            mostrarToast('error', 'Error de validación', `Altura ${value} mm fuera de rango (1000-2200 mm)`);
        }
        return false;
    } else {
        input.className = 'form-control valid';
        icon.className = 'input-icon valid fas fa-check-circle';
        message.className = 'validation-message valid';
        message.textContent = `✅ Correcto: ${value} mm`;
        return true;
    }
}

function limitar4Digitos(input) {
    if (input.value.length > 4) {
        input.value = input.value.slice(0, 4);
    }
}

// ==============================================
// FUNCIONES PRINCIPALES
// ==============================================
function obtenerValorTapacanto(texto) {
    return parseFloat(texto.replace(' mm', ''));
}

let calculando = false;

function mostrarMensajePorSelect() {
    // Verificar si ya hay un resultado previo
    const apActual = document.getElementById('resultAp').textContent;
    if (apActual === '....') {
        return;
    }
    
    switch(ultimoSelectCambiado) {
        case 'material':
            const material = document.getElementById('comboMaterial').value;
            mostrarToast('info', 'Cambio detectado', `Cambio de material: ${material}`);
            break;
            
        case 'espesor':
            const espesor = document.getElementById('comboEspesor').value;
            mostrarToast('info', 'Cambio detectado', `Espesor actualizado: ${espesor}`);
            break;
            
        case 'tapacantoLargo':
            const tapaLargo = document.getElementById('comboTapacantoLargo').value;
            const anchoPuertaCorte = document.getElementById('resultA').textContent;
            mostrarToast('info', 'Cambio detectado', `Tapacanto Largo cambiado: ${tapaLargo} - Ancho Puerta Corte: ${anchoPuertaCorte}`);
            break;
            
        case 'tapacantoAncho':
            const tapaAncho = document.getElementById('comboTapacantoAncho').value;
            const largoPuertaCorte = document.getElementById('resultL').textContent;
            mostrarToast('info', 'Cambio detectado', `Tapacanto Ancho cambiado: ${tapaAncho} - Largo Puerta Corte: ${largoPuertaCorte}`);
            break;
            
        default:
            break;
    }
    
    // Reset después de mostrar
    ultimoSelectCambiado = null;
}

async function calcularMedidas(mostrarToastVacio = false) {
    if (calculando) return;
    
    const avValido = validarEntradaAv(mostrarToastVacio);
    const hvValido = validarEntradaHv(mostrarToastVacio);
    
    if (!avValido || !hvValido) {
        ultimoSelectCambiado = null;
        return;
    }
    
    const av = parseInt(document.getElementById('entradaAv').value);
    const hv = parseInt(document.getElementById('entradaHv').value);
    const material = document.getElementById('comboMaterial').value;
    const espesor = parseInt(document.getElementById('comboEspesor').value.replace(' mm', ''));
    const tapacantoLargo = obtenerValorTapacanto(document.getElementById('comboTapacantoLargo').value);
    const tapacantoAncho = obtenerValorTapacanto(document.getElementById('comboTapacantoAncho').value);
    
    calculando = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/calcular`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ av, hv, material, espesor })
        });
        
        if (!response.ok) throw new Error(`Error ${response.status}`);
        
        const data = await response.json();
        
        document.getElementById('resultAv').textContent = data.av + ' mm';
        document.getElementById('resultHv').textContent = data.hv + ' mm';
        document.getElementById('resultAp').textContent = data.ap + ' mm';
        document.getElementById('resultHp').textContent = data.hp + ' mm';
        document.getElementById('resultRiel').textContent = data.riel + ' mm';
        document.getElementById('resultEsp').textContent = data.espesor;
        document.getElementById('materialSeleccionado').textContent = data.material;
        
        const responseTap = await fetch(`${API_BASE_URL}/api/tapacantos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ap: data.ap, hp: data.hp, tapacantoLargo, tapacantoAncho })
        });
        
        if (!responseTap.ok) throw new Error(`Error ${responseTap.status} en tapacantos`);
        
        const tapData = await responseTap.json();
        
        document.getElementById('resultL').textContent = tapData.largoPuertaCorte;
        document.getElementById('resultA').textContent = tapData.anchoPuertaCorte;
        document.getElementById('resultL1').textContent = tapData.largoTapacanto;
        document.getElementById('resultL2').textContent = tapData.largoTapacanto;
        document.getElementById('resultA1').textContent = tapData.anchoTapacanto;
        document.getElementById('resultA2').textContent = tapData.anchoTapacanto;
        
        // Mostrar mensaje según el select que cambió (si aplica)
        if (ultimoSelectCambiado !== null) {
            mostrarMensajePorSelect();
        } else if (mostrarToastVacio) {
            // Solo mostrar "Cálculo exitoso" si fue por clic en el botón
            mostrarToast('success', 'Cálculo exitoso', `AP: ${data.ap} mm, HP: ${data.hp} mm`);
        }
        
    } catch (error) {
        console.error('Error:', error);
        if (mostrarToastVacio) {
            mostrarToast('error', 'Error de conexión', error.message);
        }
        ultimoSelectCambiado = null;
    } finally {
        calculando = false;
    }
}

function actualizarPorSelect() {
    const av = document.getElementById('entradaAv').value;
    const hv = document.getElementById('entradaHv').value;
    
    if (!av || !hv || av === '' || hv === '') {
        ultimoSelectCambiado = null;
        return;
    }
    
    const avNum = parseInt(av);
    const hvNum = parseInt(hv);
    
    if (avNum >= 600 && avNum <= 2400 && hvNum >= 1000 && hvNum <= 2200) {
        calcularMedidas(false);
    } else {
        ultimoSelectCambiado = null;
    }
}

async function generarReporte() {
    const ap = document.getElementById('resultAp').textContent;
    if (ap === '....') {
        mostrarToast('warning', 'Sin datos', 'Primero calcula las medidas');
        return;
    }
    
    const datos = {
        av: parseInt(document.getElementById('entradaAv').value),
        hv: parseInt(document.getElementById('entradaHv').value),
        ap: parseInt(document.getElementById('resultAp').textContent),
        hp: parseInt(document.getElementById('resultHp').textContent),
        riel: parseInt(document.getElementById('resultRiel').textContent),
        material: document.getElementById('comboMaterial').value,
        espesor: parseInt(document.getElementById('resultEsp').textContent),
        tapacantoLargo: document.getElementById('comboTapacantoLargo').value,
        tapacantoAncho: document.getElementById('comboTapacantoAncho').value,
        largoPuertaCorte: parseInt(document.getElementById('resultL').textContent),
        anchoPuertaCorte: parseInt(document.getElementById('resultA').textContent),
        largoTapacanto1: document.getElementById('resultL1').textContent,
        largoTapacanto2: document.getElementById('resultL2').textContent,
        anchoTapacanto1: document.getElementById('resultA1').textContent,
        anchoTapacanto2: document.getElementById('resultA2').textContent,
        fecha: new Date().toLocaleString(undefined, { hour12: false })
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/reporte`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        
        const html = await response.text();
        
        // Abrir ventana con título personalizado
        const ventana = window.open('', '_blank');
        ventana.document.write(html);
        ventana.document.title = 'Reporte CA-7025 - Puertas Corredizas';
        ventana.document.close();
        
        mostrarToast('success', 'Reporte generado', 'El reporte se abrió en una nueva ventana');
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('error', 'Error', 'No se pudo generar el reporte');
    }
}

function nuevaCalculo() {
    document.getElementById('entradaAv').value = '';
    document.getElementById('entradaHv').value = '';
    document.getElementById('entradaAv').className = 'form-control warning';
    document.getElementById('entradaHv').className = 'form-control warning';
    document.getElementById('comboMaterial').selectedIndex = 0;
    document.getElementById('comboEspesor').selectedIndex = 1;
    document.getElementById('comboTapacantoLargo').selectedIndex = 5;
    document.getElementById('comboTapacantoAncho').selectedIndex = 5;
    document.getElementById('materialSeleccionado').textContent = 'Melamina';
    
    const avIcon = document.getElementById('entradaAv').parentElement.querySelector('.input-icon');
    const hvIcon = document.getElementById('entradaHv').parentElement.querySelector('.input-icon');
    avIcon.className = 'input-icon fas fa-exclamation-triangle';
    hvIcon.className = 'input-icon fas fa-exclamation-triangle';
    document.getElementById('avMessage').className = 'validation-message';
    document.getElementById('hvMessage').className = 'validation-message';
    
    const ids = ['resultAv', 'resultHv', 'resultAp', 'resultHp', 'resultEsp', 'resultL', 'resultA', 'resultL1', 'resultL2', 'resultA1', 'resultA2', 'resultRiel'];
    ids.forEach(id => document.getElementById(id).textContent = '....');
    
    document.getElementById('entradaAv').focus();
    mostrarToast('success', 'Nuevo cálculo', 'Formulario reiniciado');
    ultimoSelectCambiado = null;
}

// ==============================================
// INICIALIZACIÓN (EVENTOS)
// ==============================================
document.addEventListener('DOMContentLoaded', function() {
    // Select: Material
    document.getElementById('comboMaterial').addEventListener('change', function() {
        document.getElementById('materialSeleccionado').textContent = this.value;
        ultimoSelectCambiado = 'material';
        actualizarPorSelect();
    });
    
    // Select: Espesor
    document.getElementById('comboEspesor').addEventListener('change', function() {
        ultimoSelectCambiado = 'espesor';
        actualizarPorSelect();
    });
    
    // Select: Tapacanto Largo
    document.getElementById('comboTapacantoLargo').addEventListener('change', function() {
        ultimoSelectCambiado = 'tapacantoLargo';
        actualizarPorSelect();
    });
    
    // Select: Tapacanto Ancho
    document.getElementById('comboTapacantoAncho').addEventListener('change', function() {
        ultimoSelectCambiado = 'tapacantoAncho';
        actualizarPorSelect();
    });
    
    // Inputs: Ancho y Alto
    document.getElementById('entradaAv').addEventListener('input', function() {
        limitar4Digitos(this);
        validarEntradaAv(false);
        ultimoSelectCambiado = null;
    });
    
    document.getElementById('entradaHv').addEventListener('input', function() {
        limitar4Digitos(this);
        validarEntradaHv(false);
        ultimoSelectCambiado = null;
    });
    
    // Mensaje de bienvenida
    setTimeout(() => {
        mostrarToast('info', 'Bienvenido', 'Sistema CA-7025. Los cambios en selects actualizan los resultados.');
    }, 1000);
});
