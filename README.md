# Calculadora CMD

Calculadora web con estética de símbolo del sistema de Windows (`cmd.exe`).
HTML, CSS y JavaScript puro: sin dependencias, sin build, sin `npm install`.

## Cómo abrirla

Haz doble clic en `index.html`. Funciona directamente desde el navegador
(`file://`), ya que no se usa ni `fetch` ni módulos ES.

Si prefieres servirla por HTTP:

```bash
npx serve .
```

## Uso

Escribe una operación en la línea de comandos y pulsa **Enter**:

```
C:\Calculadora> 2+2
4
C:\Calculadora> sqrt(144)
12
C:\Calculadora> (5+3)*2
16
```

### Comandos

| Comando     | Alias            | Descripción                          |
|-------------|------------------|--------------------------------------|
| `ayuda`     | `help`, `?`      | Muestra la lista de comandos         |
| `limpiar`   | `cls`, `clear`   | Borra la pantalla                    |
| `historial` | `history`        | Lista las operaciones realizadas     |
| `version`   | `ver`            | Información de la aplicación         |
| `salir`     | `exit`, `bye`    | Cierra la sesión                     |

### Operadores

`+` `-` `*` `/` `^` `%` (módulo) `(` `)` `,`

También se admite multiplicación implícita (`2pi`, `3(4)`, `4sqrt(9)`) y
`:` como sinónimo de división.

### Funciones

`sqrt(x)` · `raiz(x)` · `abs(x)` · `redondear(x)` · `piso(x)` · `techo(x)`
`sin(x)` · `cos(x)` · `tan(x)` · `asin(x)` · `acos(x)` · `atan(x)`
`log(x)` · `ln(x)` · `exp(x)` · `pot(a,b)` · `mod(a,b)` · `min(...)` · `max(...)`

**Los ángulos se expresan en grados** (`sin(30) = 0.5`).

### Constantes

`pi` · `e`

### Atajos de teclado

| Tecla     | Acción                       |
|-----------|------------------------------|
| `Enter`   | Ejecutar la operación        |
| `↑` `↓`   | Recorrer el historial        |
| `Esc`     | Borrar la línea actual       |
| `Tab`     | Autocompletar un comando     |

## Estructura del proyecto

```
Calculadora/
├── index.html   estructura de la ventana y del teclado
├── styles.css   estilos (ventana, consola, teclado, responsive)
└── script.js    intérprete de expresiones, comandos e interacción
```

## Notas técnicas

- `script.js` incluye un **analizador de expresiones propio** (tokenizador +
  descenso recursivo con precedencia de operadores). No se utiliza `eval()`,
  por lo que no se ejecuta código arbitrario introducido por el usuario.
- Se soportan errores habituales de forma explícita: división entre cero,
  paréntesis sin cerrar, funciones desconocidas, números mal formados.
- Resultados redondeados a 12 cifras significativas para evitar el ruido
  de coma flotante (`0.1 + 0.2` → `0.3`).
- Diseño responsive: en pantallas de 600 px o menos la ventana ocupa
  todo el viewport y las teclas crecen para facilitar el toque.
