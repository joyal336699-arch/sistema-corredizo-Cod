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
// FUNCIONES DE VALIDACIÓN
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

// Variable para evitar múltiples llamadas simultáneas
let calculando = false;

async function calcularMedidas() {
    if (calculando) return;
    
    const avValido = validarEntradaAv();
    const hvValido = validarEntradaHv();
    
    if (!avValido || !hvValido) {
        mostrarToast('error', 'Error de validación', 'Corrige las medidas antes de calcular');
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
        console.log('Enviando petición a:', `${API_BASE_URL}/api/calcular`);
        console.log('Datos:', { av, hv, material, espesor });
        
        const response = await fetch(`${API_BASE_URL}/api/calcular`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ av, hv, material, espesor })
        });
        
        console.log('Respuesta status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        // Actualizar UI
        document.getElementById('resultAv').textContent = data.av + ' mm';
        document.getElementById('resultHv').textContent = data.hv + ' mm';
        document.getElementById('resultAp').textContent = data.ap + ' mm';
        document.getElementById('resultHp').textContent = data.hp + ' mm';
        document.getElementById('resultRiel').textContent = data.riel + ' mm';
        document.getElementById('resultEsp').textContent = data.espesor;
        document.getElementById('materialSeleccionado').textContent = data.material;
        
        // Calcular tapacantos
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
        
        mostrarToast('success', 'Cálculo exitoso', `AP: ${data.ap} mm, HP: ${data.hp} mm`);
        
    } catch (error) {
        console.error('Error detallado:', error);
        mostrarToast('error', 'Error de conexión', error.message);
    } finally {
        calculando = false;
    }
}
//function actualizarAutomatico() {
   // const av = document.getElementById('entradaAv').value;
   // const hv = document.getElementById('entradaHv').value;
    
    // Solo actualizar si ya hay medidas válidas ingresadas
  //  if (av && hv && av !== '' && hv !== '') {
      //  const avNum = parseInt(av);
     //   const hvNum = parseInt(hv);
        
        // Verificar rangos antes de llamar
       // if (avNum >= 600 && avNum <= 2400 && hvNum >= 1000 && hvNum <= 2200) {
     //       calcularMedidas();
    //    }
  //  }
//}


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
        fecha: new Date().toLocaleString()
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/reporte`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        
        const html = await response.text();
        const ventana = window.open();
        ventana.document.write(html);
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
    
    const ids = ['resultAv', 'resultHv', 'resultAp', 'resultHp', 'resultEsp', 'resultL', 'resultA', 'resultL1', 'resultL2', 'resultA1', 'resultA2', 'resultRiel'];
    ids.forEach(id => document.getElementById(id).textContent = '....');
    
    document.getElementById('entradaAv').focus();
    mostrarToast('success', 'Nuevo cálculo', 'Formulario reiniciado');
}

// ==============================================
// ACTUALIZACIÓN AUTOMÁTICA AL CAMBIAR SELECTS
// ==============================================
function configurarEventosAutomaticos() {
    // Material y espesor
    document.getElementById('comboMaterial').addEventListener('change', actualizarAutomatico);
    document.getElementById('comboEspesor').addEventListener('change', actualizarAutomatico);
    
    // Tapacantos
    document.getElementById('comboTapacantoLargo').addEventListener('change', actualizarAutomatico);
    document.getElementById('comboTapacantoAncho').addEventListener('change', actualizarAutomatico);
}

// ==============================================
// INICIALIZACIÓN
// ==============================================
document.addEventListener('DOMContentLoaded', function() {
    // Evento para mostrar material seleccionado
    document.getElementById('comboMaterial').addEventListener('change', function() {
        document.getElementById('materialSeleccionado').textContent = this.value;
    });
    
    // Validaciones en tiempo real
    document.getElementById('entradaAv').addEventListener('input', validarEntradaAv);
    document.getElementById('entradaHv').addEventListener('input', validarEntradaHv);
    document.getElementById('entradaAv').addEventListener('input', function() {
    limitar4Digitos(this);
    });

    document.getElementById('entradaHv').addEventListener('input', function() {
    limitar4Digitos(this);
    });
    
    // Configurar eventos automáticos para selects
    configurarEventosAutomaticos();
    
    // Mostrar mensaje de bienvenida
    setTimeout(() => {
        mostrarToast('info', 'Bienvenido', 'Sistema CA-7025. Los cambios en materiales y tapacantos se actualizan automáticamente.');
    }, 1000);
});
