// ==============================================
// CONFIGURACIÓN DEL BACKEND
// ==============================================
// ⚠️ CAMBIAR ESTA URL CUANDO DESPLIEGUES EN RENDER
const API_BASE_URL = 'https://sistema-corrediza-ca7025.onrender.com'; 

// ==============================================
// SISTEMA DE NOTIFICACIONES TOAST (COMPLETO)
// ==============================================
function mostrarToast(tipo, titulo, mensaje) {
    const container = document.getElementById('toastContainer');
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
        <button class="toast-close" onclick="this.parentElement.classList.remove('show'); setTimeout(() => this.parentElement.remove(), 300)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
    }, 5000);
    
    const toasts = container.querySelectorAll('.toast');
    if (toasts.length > 3) {
        toasts[0].classList.remove('show');
        setTimeout(() => { if (toasts[0].parentNode) toasts[0].remove(); }, 300);
    }
}

function mostrarAyuda() {
    mostrarToast('info', 'Ayuda', 'Ingresa las medidas del vano (Ancho 600-2400 mm, Altura 1000-2200 mm) y selecciona los materiales. Los cálculos se realizan en el servidor.');
}

// ==============================================
// VALIDACIONES (SOLO UI - MEJORA LA EXPERIENCIA)
// ==============================================
function validarEntradaAv() {
    const input = document.getElementById('entradaAv');
    const value = parseInt(input.value);
    const message = document.getElementById('avMessage');
    const icon = input.parentElement.querySelector('.input-icon');
    
    if (!input.value || input.value.trim() === '') {
        input.className = 'form-control warning';
        icon.className = 'input-icon fas fa-exclamation-triangle';
        message.className = 'validation-message';
        return false;
    }
    
    if (value < 600 || value > 2400) {
        input.className = 'form-control error';
        icon.className = 'input-icon error fas fa-times-circle';
        message.className = 'validation-message error';
        message.textContent = `❌ Error: ${value} mm fuera de rango (600-2400 mm)`;
        return false;
    } else {
        input.className = 'form-control valid';
        icon.className = 'input-icon valid fas fa-check-circle';
        message.className = 'validation-message valid';
        message.textContent = `✅ Correcto: ${value} mm`;
        return true;
    }
}

function validarEntradaHv() {
    const input = document.getElementById('entradaHv');
    const value = parseInt(input.value);
    const message = document.getElementById('hvMessage');
    const icon = input.parentElement.querySelector('.input-icon');
    
    if (!input.value || input.value.trim() === '') {
        input.className = 'form-control warning';
        icon.className = 'input-icon fas fa-exclamation-triangle';
        message.className = 'validation-message';
        return false;
    }
    
    if (value < 1000 || value > 2200) {
        input.className = 'form-control error';
        icon.className = 'input-icon error fas fa-times-circle';
        message.className = 'validation-message error';
        message.textContent = `❌ Error: ${value} mm fuera de rango (1000-2200 mm)`;
        return false;
    } else {
        input.className = 'form-control valid';
        icon.className = 'input-icon valid fas fa-check-circle';
        message.className = 'validation-message valid';
        message.textContent = `✅ Correcto: ${value} mm`;
        return true;
    }
}

function validarCampos() {
    const avValido = validarEntradaAv();
    const hvValido = validarEntradaHv();
    return { valido: avValido && hvValido };
}

// ==============================================
// FUNCIONES DE ACTUALIZACIÓN DE UI (SOLO VISUAL)
// ==============================================
function actualizarUIconResultados(datos) {
    document.getElementById('resultAv').textContent = datos.av + ' mm';
    document.getElementById('resultHv').textContent = datos.hv + ' mm';
    document.getElementById('resultAp').textContent = datos.ap + ' mm';
    document.getElementById('resultHp').textContent = datos.hp + ' mm';
    document.getElementById('resultRiel').textContent = datos.riel + ' mm';
    document.getElementById('resultEsp').textContent = datos.espesor;
    document.getElementById('materialSeleccionado').textContent = datos.material;
}

function actualizarUIconTapacantos(datos) {
    document.getElementById('resultL').textContent = datos.largoPuertaCorte;
    document.getElementById('resultA').textContent = datos.anchoPuertaCorte;
    document.getElementById('resultL1').textContent = datos.largoTapacanto;
    document.getElementById('resultL2').textContent = datos.largoTapacanto;
    document.getElementById('resultA1').textContent = datos.anchoTapacanto;
    document.getElementById('resultA2').textContent = datos.anchoTapacanto;
}

// ==============================================
// FUNCIONES QUE LLAMAN AL BACKEND
// ==============================================
async function calcularMedidas() {
    if (!validarCampos().valido) {
        mostrarToast('error', 'Error de validación', 'Corrige las medidas antes de calcular');
        return;
    }
    
    const av = parseInt(document.getElementById('entradaAv').value);
    const hv = parseInt(document.getElementById('entradaHv').value);
    const material = document.getElementById('comboMaterial').value;
    const espesor = parseInt(document.getElementById('comboEspesor').value.replace(' mm', ''));
    const tapacantoLargo = parseFloat(document.getElementById('comboTapacantoLargo').value.replace(' mm', ''));
    const tapacantoAncho = parseFloat(document.getElementById('comboTapacantoAncho').value.replace(' mm', ''));
    
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculando...';
    button.disabled = true;
    
    try {
        // 1. Calcular medidas básicas (backend)
        const responseMedidas = await fetch(`${API_BASE_URL}/api/calcular`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ av, hv, material, espesor })
        });
        
        if (!responseMedidas.ok) throw new Error('Error en el servidor');
        const medidas = await responseMedidas.json();
        actualizarUIconResultados(medidas);
        
        // 2. Calcular tapacantos (backend)
        const responseTapacantos = await fetch(`${API_BASE_URL}/api/tapacantos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ap: medidas.ap,
                hp: medidas.hp,
                tapacantoLargo: tapacantoLargo,
                tapacantoAncho: tapacantoAncho
            })
        });
        
        if (!responseTapacantos.ok) throw new Error('Error en cálculo de tapacantos');
        const tapacantos = await responseTapacantos.json();
        actualizarUIconTapacantos(tapacantos);
        
        mostrarToast('success', 'Cálculo exitoso', `Medidas calculadas: AP=${medidas.ap}mm, HP=${medidas.hp}mm`);
        
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('error', 'Error de conexión', 'No se pudo conectar con el servidor backend. Verifica que esté ejecutándose.');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

async function generarReporte() {
    const av = document.getElementById('entradaAv').value;
    const hv = document.getElementById('entradaHv').value;
    const material = document.getElementById('comboMaterial').value;
    const espesor = document.getElementById('comboEspesor').value;
    const tapacantoLargo = document.getElementById('comboTapacantoLargo').value;
    const tapacantoAncho = document.getElementById('comboTapacantoAncho').value;
    
    const resultAv = document.getElementById('resultAv').textContent;
    const resultHv = document.getElementById('resultHv').textContent;
    const resultAp = document.getElementById('resultAp').textContent;
    const resultHp = document.getElementById('resultHp').textContent;
    const resultEsp = document.getElementById('resultEsp').textContent;
    const resultL = document.getElementById('resultL').textContent;
    const resultA = document.getElementById('resultA').textContent;
    const resultL1 = document.getElementById('resultL1').textContent;
    const resultL2 = document.getElementById('resultL2').textContent;
    const resultA1 = document.getElementById('resultA1').textContent;
    const resultA2 = document.getElementById('resultA2').textContent;
    const resultRiel = document.getElementById('resultRiel').textContent;
    
    if (resultAp === '....' || resultHp === '....') {
        mostrarToast('warning', 'Sin datos', 'Primero calcula las medidas');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/reporte`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                av: parseInt(av), hv: parseInt(hv), ap: parseInt(resultAp), hp: parseInt(resultHp),
                riel: parseInt(resultRiel), material: material, espesor: parseInt(resultEsp),
                tapacantoLargo: tapacantoLargo, tapacantoAncho: tapacantoAncho,
                largoPuertaCorte: parseInt(resultL), anchoPuertaCorte: parseInt(resultA),
                largoTapacanto1: resultL1, largoTapacanto2: resultL2,
                anchoTapacanto1: resultA1, anchoTapacanto2: resultA2,
                fecha: new Date().toLocaleString()
            })
        });
        
        const reporteHTML = await response.text();
        const ventana = window.open('', '_blank');
        ventana.document.write(reporteHTML);
        ventana.document.close();
        mostrarToast('success', 'Reporte generado', 'El reporte se abrió en una nueva ventana');
        
    } catch (error) {
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
    
    const resultados = ['resultAv', 'resultHv', 'resultAp', 'resultHp', 'resultEsp',
        'resultL', 'resultA', 'resultL1', 'resultL2', 'resultA1', 'resultA2', 'resultRiel'];
    resultados.forEach(id => { document.getElementById(id).textContent = '....'; });
    
    document.getElementById('entradaAv').focus();
    mostrarToast('success', 'Nuevo cálculo', 'Formulario reiniciado');
}

// ==============================================
// EVENT LISTENERS
// ==============================================
document.getElementById('comboMaterial').addEventListener('change', function() {
    document.getElementById('materialSeleccionado').textContent = this.value;
});

document.getElementById('entradaAv').addEventListener('input', validarEntradaAv);
document.getElementById('entradaHv').addEventListener('input', validarEntradaHv);

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('comboMaterial').selectedIndex = 0;
    document.getElementById('comboEspesor').selectedIndex = 1;
    document.getElementById('comboTapacantoLargo').selectedIndex = 5;
    document.getElementById('comboTapacantoAncho').selectedIndex = 5;
    
    setTimeout(() => {
        mostrarToast('info', 'Bienvenido', 'Sistema CA-7025. Conectado al backend Java.');
    }, 1000);
});
