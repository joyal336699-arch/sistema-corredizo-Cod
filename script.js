// ==============================================
// CONFIGURACIÓN DEL BACKEND
// ==============================================
const API_BASE_URL = 'https://sistema-corrediza-ca7025.onrender.com';

// ==============================================
// SISTEMA DE NOTIFICACIONES TOAST
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
// VALIDACIONES DE UI
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

// ==============================================
// FUNCIONES PRINCIPALES
// ==============================================
async function calcularMedidas() {
    // Validar campos
    const avValido = validarEntradaAv();
    const hvValido = validarEntradaHv();
    
    if (!avValido || !hvValido) {
        mostrarToast('error', 'Error de validación', 'Corrige las medidas antes de calcular');
        return;
    }
    
    // Obtener valores
    const av = parseInt(document.getElementById('entradaAv').value);
    const hv = parseInt(document.getElementById('entradaHv').value);
    const material = document.getElementById('comboMaterial').value;
    const espesor = parseInt(document.getElementById('comboEspesor').value.replace(' mm', ''));
    const tapacantoLargo = parseFloat(document.getElementById('comboTapacantoLargo').value.replace(' mm', ''));
    const tapacantoAncho = parseFloat(document.getElementById('comboTapacantoAncho').value.replace(' mm', ''));
    
    // Mostrar loading en el botón
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculando...';
    button.disabled = true;
    
    try {
        // 1. Calcular medidas básicas
        const responseMedidas = await fetch(`${API_BASE_URL}/api/calcular`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ av, hv, material, espesor })
        });
        
        if (!responseMedidas.ok) {
            throw new Error(`Error ${responseMedidas.status}: ${responseMedidas.statusText}`);
        }
        
        const medidas = await responseMedidas.json();
        
        // Actualizar UI con resultados
        document.getElementById('resultAv').textContent = medidas.av + ' mm';
        document.getElementById('resultHv').textContent = medidas.hv + ' mm';
        document.getElementById('resultAp').textContent = medidas.ap + ' mm';
        document.getElementById('resultHp').textContent = medidas.hp + ' mm';
        document.getElementById('resultRiel').textContent = medidas.riel + ' mm';
        document.getElementById('resultEsp').textContent = medidas.espesor;
        document.getElementById('materialSeleccionado').textContent = medidas.material;
        
        // 2. Calcular tapacantos
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
        
        if (!responseTapacantos.ok) {
            throw new Error(`Error ${responseTapacantos.status} en cálculo de tapacantos`);
        }
        
        const tapacantos = await responseTapacantos.json();
        
        document.getElementById('resultL').textContent = tapacantos.largoPuertaCorte;
        document.getElementById('resultA').textContent = tapacantos.anchoPuertaCorte;
        document.getElementById('resultL1').textContent = tapacantos.largoTapacanto;
        document.getElementById('resultL2').textContent = tapacantos.largoTapacanto;
        document.getElementById('resultA1').textContent = tapacantos.anchoTapacanto;
        document.getElementById('resultA2').textContent = tapacantos.anchoTapacanto;
        
        mostrarToast('success', 'Cálculo exitoso', `AP: ${medidas.ap} mm, HP: ${medidas.hp} mm`);
        
    } catch (error) {
        console.error('Error detallado:', error);
        mostrarToast('error', 'Error de conexión', `No se pudo conectar con el backend: ${error.message}`);
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

async function generarReporte() {
    const ap = document.getElementById('resultAp').textContent.replace(' mm', '');
    const hp = document.getElementById('resultHp').textContent.replace(' mm', '');
    
    if (ap === '....' || hp === '....') {
        mostrarToast('warning', 'Sin datos', 'Primero calcula las medidas');
        return;
    }
    
    const datosReporte = {
        av: parseInt(document.getElementById('entradaAv').value),
        hv: parseInt(document.getElementById('entradaHv').value),
        ap: parseInt(ap),
        hp: parseInt(hp),
        riel: parseInt(document.getElementById('resultRiel').textContent.replace(' mm', '')),
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
        fecha: new Date().toLocaleString()
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/reporte`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosReporte)
        });
        
        if (!response.ok) throw new Error('Error al generar reporte');
        
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
    
    const resultados = ['resultAv', 'resultHv', 'resultAp', 'resultHp', 'resultEsp',
        'resultL', 'resultA', 'resultL1', 'resultL2', 'resultA1', 'resultA2', 'resultRiel'];
    resultados.forEach(id => { document.getElementById(id).textContent = '....'; });
    
    document.getElementById('entradaAv').focus();
    mostrarToast('success', 'Nuevo cálculo', 'Formulario reiniciado');
}

// ==============================================
// VERIFICAR CONEXIÓN AL INICIAR
// ==============================================
async function verificarConexion() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (response.ok) {
            mostrarToast('success', 'Conectado', 'Backend disponible');
        } else {
            mostrarToast('warning', 'Advertencia', 'Backend no responde correctamente');
        }
    } catch (error) {
        mostrarToast('error', 'Sin conexión', 'No se pudo conectar con el backend');
    }
}

// ==============================================
// EVENT LISTENERS
// ==============================================
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('comboMaterial').addEventListener('change', function() {
        document.getElementById('materialSeleccionado').textContent = this.value;
    });
    
    document.getElementById('entradaAv').addEventListener('input', validarEntradaAv);
    document.getElementById('entradaHv').addEventListener('input', validarEntradaHv);
    
    // Verificar conexión al cargar
    setTimeout(verificarConexion, 1000);
});
