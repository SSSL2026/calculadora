/* =========================================================
   Calculadora CMD — lógica de la aplicación
   Consola interactiva: acepta expresiones matemáticas y
   comandos tipo shell (ayuda, limpiar, historial, salir).
   ========================================================= */

(function () {
  'use strict';

  /* ---------------------------------------------------------
     Referencias al DOM
     --------------------------------------------------------- */

  const ventana = document.getElementById('ventana');
  const barraTitulo = document.getElementById('barraTitulo');
  const consola = document.getElementById('consola');
  const salida = document.getElementById('salida');
  const entrada = document.getElementById('entrada');
  const textoAntes = document.getElementById('textoAntes');
  const textoDespues = document.getElementById('textoDespues');
  const teclado = document.getElementById('teclado');
  const cierre = document.getElementById('cierre');

  const PREFIJO = 'C:\\Calculadora>';

  /* ---------------------------------------------------------
     Utilidades de salida
     --------------------------------------------------------- */

  function bajar() {
    consola.scrollTop = consola.scrollHeight;
  }

  function imprimir(lineas, clase) {
    const lista = Array.isArray(lineas) ? lineas : [lineas];
    const fragmento = document.createDocumentFragment();

    lista.forEach(function (texto) {
      const div = document.createElement('div');
      div.className = 'linea' + (clase ? ' linea--' + clase : '');
      div.textContent = texto;
      fragmento.appendChild(div);
    });

    salida.appendChild(fragmento);
    bajar();
  }

  function imprimirEntrada(texto) {
    const div = document.createElement('div');
    div.className = 'linea linea--eco';

    const prompt = document.createElement('span');
    prompt.className = 'prompt';
    prompt.textContent = PREFIJO;

    div.appendChild(prompt);
    div.appendChild(document.createTextNode(' ' + texto));
    salida.appendChild(div);
    bajar();
  }

  function vaciar() {
    salida.textContent = '';
  }

  /* ---------------------------------------------------------
     Motor de expresiones
     --------------------------------------------------------- */

  const CONSTANTES = {
    pi: Math.PI,
    e: Math.E
  };

  function gradosARadianes(g) { return (g * Math.PI) / 180; }
  function radianesAGrados(r) { return (r * 180) / Math.PI; }

  const FUNCIONES = {
    sqrt:     { p: 1, f: function (a) { return Math.sqrt(a[0]); } },
    raiz:     { p: 1, f: function (a) { return Math.sqrt(a[0]); } },
    abs:      { p: 1, f: function (a) { return Math.abs(a[0]); } },
    sen:      { p: 1, f: function (a) { return Math.sin(gradosARadianes(a[0])); } },
    sin:      { p: 1, f: function (a) { return Math.sin(gradosARadianes(a[0])); } },
    seno:     { p: 1, f: function (a) { return Math.sin(gradosARadianes(a[0])); } },
    cos:      { p: 1, f: function (a) { return Math.cos(gradosARadianes(a[0])); } },
    coseno:   { p: 1, f: function (a) { return Math.cos(gradosARadianes(a[0])); } },
    tan:      { p: 1, f: function (a) { return Math.tan(gradosARadianes(a[0])); } },
    tangente: { p: 1, f: function (a) { return Math.tan(gradosARadianes(a[0])); } },
    asin:     { p: 1, f: function (a) { return radianesAGrados(Math.asin(a[0])); } },
    acos:     { p: 1, f: function (a) { return radianesAGrados(Math.acos(a[0])); } },
    atan:     { p: 1, f: function (a) { return radianesAGrados(Math.atan(a[0])); } },
    log:      { p: 1, f: function (a) { return Math.log10(a[0]); } },
    ln:       { p: 1, f: function (a) { return Math.log(a[0]); } },
    exp:      { p: 1, f: function (a) { return Math.exp(a[0]); } },
    pot:      { p: 2, f: function (a) { return Math.pow(a[0], a[1]); } },
    potencia: { p: 2, f: function (a) { return Math.pow(a[0], a[1]); } },
    mod:      { p: 2, f: function (a) { return a[0] % a[1]; } },
    min:      { p: null, min: 1, f: function (a) { return Math.min.apply(null, a); } },
    max:      { p: null, min: 1, f: function (a) { return Math.max.apply(null, a); } },
    redondear: { p: 1, f: function (a) { return Math.round(a[0]); } },
    round:    { p: 1, f: function (a) { return Math.round(a[0]); } },
    piso:     { p: 1, f: function (a) { return Math.floor(a[0]); } },
    techo:    { p: 1, f: function (a) { return Math.ceil(a[0]); } }
  };

  function tokenizar(entrada) {
    const tokens = [];
    let i = 0;

    while (i < entrada.length) {
      const c = entrada[i];

      if (/\s/.test(c)) { i++; continue; }

      if (/[0-9.]/.test(c)) {
        let j = i;
        while (j < entrada.length && /[0-9.]/.test(entrada[j])) j++;
        const texto = entrada.slice(i, j);
        if ((texto.match(/\./g) || []).length > 1) {
          throw new Error('Número no válido: "' + texto + '".');
        }
        const valor = parseFloat(texto);
        if (Number.isNaN(valor)) {
          throw new Error('Número no válido: "' + texto + '".');
        }
        tokens.push({ tipo: 'num', valor: valor, texto: texto });
        i = j;
        continue;
      }

      if (/[a-záéíóúüñ]/i.test(c)) {
        let j = i;
        while (j < entrada.length && /[a-záéíóúüñ0-9]/i.test(entrada[j])) j++;
        const nombre = entrada.slice(i, j).toLowerCase();
        tokens.push({ tipo: 'fn', nombre: nombre, texto: nombre });
        i = j;
        continue;
      }

      if ('+-*/^%():,'.indexOf(c) !== -1) {
        tokens.push({ tipo: 'op', valor: c, texto: c });
        i++;
        continue;
      }

      throw new Error('Carácter inesperado: "' + c + '".');
    }

    return tokens;
  }

  /* Inserta multiplicaciones implícitas: 2(3), 2pi, 4sqrt(9), (1+1)(2) */
  function insertarMultiplicaciones(tokens) {
    const terminaValor = function (t) {
      return !!t && (t.tipo === 'num' || t.tipo === 'fn' || t.valor === ')');
    };
    const empiezaValor = function (t) {
      return !!t && (t.tipo === 'num' || t.tipo === 'fn' || t.valor === '(');
    };

    const salidaTokens = [];

    for (let k = 0; k < tokens.length; k++) {
      const anterior = tokens[k - 1];
      const actual = tokens[k];
      const esLlamada = anterior && anterior.tipo === 'fn' && actual.valor === '(';

      if (terminaValor(anterior) && empiezaValor(actual) && !esLlamada) {
        salidaTokens.push({ tipo: 'op', valor: '*', texto: '*' });
      }
      salidaTokens.push(actual);
    }

    return salidaTokens;
  }

  /* Analizador recursivo con precedencia de operadores */
  function evaluar(texto) {
    const tokens = insertarMultiplicaciones(tokenizar(texto));

    if (tokens.length === 0) {
      throw new Error('La expresión está vacía.');
    }

    let pos = 0;

    const actual = function () { return tokens[pos]; };
    const esOp = function (v) {
      const t = actual();
      return !!t && t.tipo === 'op' && t.valor === v;
    };

    function expresion() {
      let valor = termino();
      while (esOp('+') || esOp('-')) {
        const op = tokens[pos++].valor;
        const derecha = termino();
        valor = op === '+' ? valor + derecha : valor - derecha;
      }
      return valor;
    }

    function termino() {
      let valor = potencia();
      while (esOp('*') || esOp('/') || esOp(':') || esOp('%')) {
        const op = tokens[pos++].valor;
        const derecha = potencia();

        if (op === '/' || op === ':') {
          if (derecha === 0) throw new Error('División entre cero.');
          valor = valor / derecha;
        } else if (op === '%') {
          if (derecha === 0) throw new Error('Módulo entre cero.');
          valor = valor % derecha;
        } else {
          valor = valor * derecha;
        }
      }
      return valor;
    }

    function potencia() {
      const base = unario();
      if (esOp('^')) {
        pos++;
        return Math.pow(base, potencia());
      }
      return base;
    }

    function unario() {
      if (esOp('-')) { pos++; return -unario(); }
      if (esOp('+')) { pos++; return unario(); }
      return primario();
    }

    function primario() {
      const token = actual();

      if (!token) {
        throw new Error('La expresión está incompleta.');
      }

      if (token.tipo === 'num') {
        pos++;
        return token.valor;
      }

      if (token.tipo === 'fn') {
        const nombre = token.nombre;
        pos++;

        if (Object.prototype.hasOwnProperty.call(CONSTANTES, nombre)) {
          return CONSTANTES[nombre];
        }

        const def = FUNCIONES[nombre];
        if (!def) {
          throw new Error('Función desconocida: "' + nombre + '". Escribe "ayuda" para ver la lista.');
        }
        if (!esOp('(')) {
          throw new Error('Después de "' + nombre + '" se esperaba "(".');
        }
        pos++;

        const args = [expresion()];
        while (esOp(',')) {
          pos++;
          args.push(expresion());
        }

        if (!esOp(')')) {
          throw new Error('Falta cerrar el paréntesis: ")".');
        }
        pos++;

        if (def.p !== null && args.length !== def.p) {
          throw new Error('"' + nombre + '" espera ' + def.p + ' argumento(s) y recibe ' + args.length + '.');
        }
        if (def.p === null && args.length < def.min) {
          throw new Error('"' + nombre + '" espera al menos ' + def.min + ' argumento(s).');
        }

        return def.f(args);
      }

      if (token.tipo === 'op' && token.valor === '(') {
        pos++;
        const valor = expresion();
        if (!esOp(')')) {
          throw new Error('Falta cerrar el paréntesis: ")".');
        }
        pos++;
        return valor;
      }

      throw new Error('No se esperaba "' + token.texto + '".');
    }

    const resultado = expresion();

    if (pos < tokens.length) {
      throw new Error('No se esperaba "' + tokens[pos].texto + '".');
    }
    if (Number.isNaN(resultado)) {
      throw new Error('El resultado no es un número (NaN).');
    }
    if (!Number.isFinite(resultado)) {
      throw new Error('El resultado es demasiado grande (infinito).');
    }

    return resultado;
  }

  function formatear(numero) {
    const limpio = parseFloat(numero.toPrecision(12));
    const abs = Math.abs(limpio);

    if (limpio !== 0 && (abs >= 1e15 || abs < 1e-9)) {
      return limpio.toExponential(6);
    }
    return String(limpio);
  }

  /* ---------------------------------------------------------
     Comandos
     --------------------------------------------------------- */

  const AYUDA = [
    'Calculadora CMD — comandos disponibles',
    '',
    '  ayuda      Muestra este mensaje de ayuda',
    '  limpiar    Borra la pantalla            (alias: cls, clear)',
    '  historial  Lista las operaciones realizadas',
    '  version    Información de la aplicación',
    '  salir      Cierra la sesión             (alias: exit, bye)',
    '',
    'Operadores :  +   -   *   /   ^   % (módulo)   (   )   ,',
    'Funciones  :  sqrt(x)   abs(x)   redondear(x)   min(a,b)   max(a,b)',
    '               sin(x)   cos(x)   tan(x)   asin(x)   acos(x)   atan(x)',
    '               log(x)   ln(x)   exp(x)   pot(a,b)   mod(a,b)',
    'Constantes :  pi   e',
    '',
    'Ejemplos   :  2+2    sqrt(144)    2^10    (5+3)*2    sin(30)    7%3',
    'Los ángulos se expresan en GRADOS. Multiplicación implícita: 2pi, 3(4).'
  ];

  let historial = [];
  let posicionHistorial = null;
  let borrador = '';

  const comandos = {
    ayuda: function () { imprimir(AYUDA, 'info'); },
    limpiar: function () { vaciar(); },
    historial: function () {
      if (historial.length === 0) {
        imprimir('  (todavía no hay operaciones)', 'info');
        return;
      }
      const lineas = historial.map(function (item, index) {
        const numero = String(index + 1).padStart(3, ' ');
        let resultado;
        try {
          resultado = formatear(evaluar(item));
        } catch (error) {
          resultado = 'error';
        }
        return '  ' + numero + '.  ' + item + '  =  ' + resultado;
      });
      imprimir(lineas, 'info');
    },
    version: function () {
      imprimir([
        'Calculadora CMD  ·  versión 1.0.0',
        'Compilada con HTML, CSS y JavaScript puro.',
        'Intérprete de expresiones propio (sin eval).'
      ], 'info');
    },
    salir: function () {
      imprimir(['', 'Sesion finalizada. Gracias por usar Calculadora CMD.', ''], 'destacado');
      entrada.value = '';
      sincronizar();
    }
  };

  const ALIAS = {
    ayuda: 'ayuda', help: 'ayuda', '?': 'ayuda',
    limpiar: 'limpiar', cls: 'limpiar', clear: 'limpiar', clsr: 'limpiar',
    historial: 'historial', history: 'historial',
    version: 'version', ver: 'version',
    salir: 'salir', exit: 'salir', bye: 'salir'
  };

  /* ---------------------------------------------------------
     Procesamiento de la entrada
     --------------------------------------------------------- */

  function procesar(crudo) {
    const texto = crudo.trim();

    if (texto === '') {
      imprimirEntrada('');
      return;
    }

    imprimirEntrada(texto);

    const comando = ALIAS[texto.toLowerCase()];

    if (comando) {
      comandos[comando]();
      return;
    }

    historial.push(texto);
    posicionHistorial = null;
    borrador = '';

    try {
      imprimir('  ' + formatear(evaluar(texto)), 'resultado');
    } catch (error) {
      imprimir('  ' + error.message, 'error');
    }
  }

  function ejecutar() {
    const crudo = entrada.value;
    entrada.value = '';
    sincronizar();
    posicionHistorial = null;
    borrador = '';
    procesar(crudo);
    bajar();
  }

  /* ---------------------------------------------------------
     Entrada de texto
     --------------------------------------------------------- */

  function sincronizar() {
    const valor = entrada.value;
    const cursor = entrada.selectionStart === null ? valor.length : entrada.selectionStart;
    textoAntes.textContent = valor.slice(0, cursor);
    textoDespues.textContent = valor.slice(cursor);
  }

  function enfocar() {
    if (cierre.hidden === false) return;
    entrada.focus({ preventScroll: true });
  }

  function insertar(texto) {
    const inicio = entrada.selectionStart === null ? entrada.value.length : entrada.selectionStart;
    const fin = entrada.selectionEnd === null ? inicio : entrada.selectionEnd;

    entrada.value = entrada.value.slice(0, inicio) + texto + entrada.value.slice(fin);
    const nuevaPos = inicio + texto.length;

    entrada.setSelectionRange(nuevaPos, nuevaPos);
    sincronizar();
    enfocar();
  }

  function borrarCaracter() {
    const inicio = entrada.selectionStart;
    const fin = entrada.selectionEnd;

    if (inicio === null) { return; }

    if (inicio !== fin) {
      entrada.value = entrada.value.slice(0, inicio) + entrada.value.slice(fin);
      entrada.setSelectionRange(inicio, inicio);
    } else if (inicio > 0) {
      entrada.value = entrada.value.slice(0, inicio - 1) + entrada.value.slice(inicio);
      entrada.setSelectionRange(inicio - 1, inicio - 1);
    }

    sincronizar();
    enfocar();
  }

  function navegarHistorial(direccion) {
    if (historial.length === 0) return;

    if (posicionHistorial === null) {
      if (direccion > 0) return;
      borrador = entrada.value;
      posicionHistorial = historial.length;
    }

    posicionHistorial += direccion;

    if (posicionHistorial >= historial.length) {
      posicionHistorial = null;
      entrada.value = borrador;
    } else if (posicionHistorial < 0) {
      posicionHistorial = 0;
      entrada.value = historial[0];
    } else {
      entrada.value = historial[posicionHistorial];
    }

    entrada.setSelectionRange(entrada.value.length, entrada.value.length);
    sincronizar();
  }

  function autocompletar() {
    const texto = entrada.value.trim().toLowerCase();
    if (!texto) return;

    const coincidencia = Object.keys(ALIAS).filter(function (nombre) {
      return nombre.indexOf(texto) === 0;
    })[0];

    if (coincidencia) {
      entrada.value = ALIAS[coincidencia];
      entrada.setSelectionRange(entrada.value.length, entrada.value.length);
      sincronizar();
    }
  }

  entrada.addEventListener('input', sincronizar);
  entrada.addEventListener('click', sincronizar);
  entrada.addEventListener('keyup', sincronizar);
  document.addEventListener('selectionchange', sincronizar);

  entrada.addEventListener('keydown', function (evento) {
    switch (evento.key) {
      case 'Enter':
        evento.preventDefault();
        ejecutar();
        break;
      case 'ArrowUp':
        evento.preventDefault();
        navegarHistorial(-1);
        break;
      case 'ArrowDown':
        evento.preventDefault();
        navegarHistorial(1);
        break;
      case 'Escape':
        evento.preventDefault();
        entrada.value = '';
        sincronizar();
        break;
      case 'Tab':
        evento.preventDefault();
        autocompletar();
        break;
      default:
        break;
    }
  });

  /* ---------------------------------------------------------
     Teclado en pantalla
     --------------------------------------------------------- */

  teclado.addEventListener('mousedown', function (evento) {
    if (evento.target.closest('.tecla')) {
      evento.preventDefault();
    }
  });

  teclado.addEventListener('click', function (evento) {
    const tecla = evento.target.closest('.tecla');
    if (!tecla) return;

    const accion = tecla.getAttribute('data-accion');
    const texto = tecla.getAttribute('data-insertar');

    if (accion === 'borrar') {
      borrarCaracter();
    } else if (accion === 'limpiar') {
      entrada.value = '';
      sincronizar();
      enfocar();
    } else if (accion === 'calcular') {
      enfocar();
      ejecutar();
    } else if (texto !== null) {
      insertar(texto);
    }
  });

  /* ---------------------------------------------------------
     Consola: enfocar al hacer clic (sin robar la selección)
     --------------------------------------------------------- */

  consola.addEventListener('click', function () {
    const seleccion = window.getSelection();
    if (!seleccion || seleccion.toString() === '') {
      enfocar();
    }
  });

  document.addEventListener('click', function (evento) {
    const objetivo = evento.target;
    if (objetivo && objetivo.closest &&
        !objetivo.closest('button') &&
        !objetivo.closest('.campo__input')) {
      enfocar();
    }
  });

  /* ---------------------------------------------------------
     Controles de la ventana
     --------------------------------------------------------- */

  document.getElementById('btnMaximizar').addEventListener('click', function () {
    const maximizada = ventana.classList.toggle('ventana--maximizada');
    this.textContent = maximizada ? '❐' : '□';
    this.title = maximizada ? 'Restaurar' : 'Maximizar';
    this.setAttribute('aria-label', this.title);
    enfocar();
  });

  document.getElementById('btnMinimizar').addEventListener('click', function (evento) {
    evento.stopPropagation();
    const minimizada = ventana.classList.toggle('ventana--minimizada');
    this.textContent = minimizada ? '❐' : '─';
    this.title = minimizada ? 'Restaurar' : 'Minimizar';
    this.setAttribute('aria-label', this.title);
    if (!minimizada) enfocar();
  });

  barraTitulo.addEventListener('click', function () {
    if (ventana.classList.contains('ventana--minimizada')) {
      ventana.classList.remove('ventana--minimizada');
      const boton = document.getElementById('btnMinimizar');
      boton.textContent = '─';
      boton.title = 'Minimizar';
      boton.setAttribute('aria-label', 'Minimizar');
      enfocar();
    }
  });

  document.getElementById('btnCerrar').addEventListener('click', function (evento) {
    evento.stopPropagation();
    cierre.hidden = false;
  });

  document.getElementById('btnReiniciar').addEventListener('click', function () {
    window.location.reload();
  });

  /* ---------------------------------------------------------
     Arranque
     --------------------------------------------------------- */

  imprimir([
    'Microsoft Windows [Versión 10.0.19045]',
    '(c) Microsoft Corporation. Todos los derechos reservados.',
    '',
    '  Calculadora CMD  ·  v1.0.0',
    '  Escribe "ayuda" para ver los comandos disponibles.',
    ''
  ], 'info');

  sincronizar();
  enfocar();
})();
