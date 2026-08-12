# DESEING

## Objetivo

Este documento define las guias de diseño de `intraNIC` para mantener una interfaz consistente, sobria y operativa. La aplicacion no busca una estetica de marketing: debe priorizar lectura rapida, densidad de informacion controlada y acciones claras para usuarios internos de Nippon Car / LIESS.

## Direccion visual del proyecto

- Estilo general: interfaz administrativa, limpia, neutra y funcional.
- Personalidad visual: seria, directa y sin ornamentos innecesarios.
- Prioridad: claridad operativa antes que expresividad visual.
- Sensacion buscada: sistema interno confiable, ordenado y facil de recorrer.

La identidad visual actual se apoya en:

- fondos claros
- superficies blancas
- bordes grises finos
- tipografia sans serif neutra
- acentos negros o gris oscuro para acciones primarias
- color semantico solo cuando comunica estado real

## Principios de diseño

### 1. Claridad primero

Cada pantalla debe permitir entender:

- donde estoy
- que datos estoy viendo
- que accion principal puedo hacer
- que estados requieren atencion

Si un elemento no mejora eso, debe simplificarse o eliminarse.

### 2. Densidad controlada

La app maneja tablas, formularios y modulos operativos. Se permite mostrar bastante informacion, pero con:

- jerarquia tipografica clara
- bloques visuales bien delimitados
- separaciones consistentes
- textos cortos y accionables

La preferencia del proyecto debe ser compacta. Ante la duda:

- elegir menos padding
- evitar alturas grandes por defecto
- reducir aire sobrante en cards, headers y formularios
- priorizar mas informacion visible sin sacrificar legibilidad

### 3. Consistencia sobre creatividad

No introducir estilos visuales nuevos por modulo sin una razon funcional. La app debe sentirse como un solo sistema aunque cubra multiples areas.

### 4. Color con significado

El color no se usa para decorar. Se usa para:

- resaltar accion primaria
- marcar estados
- indicar alerta o error
- distinguir condiciones operativas validas

### 5. Responsive sin perder utilidad

En mobile se debe priorizar:

- lectura vertical
- acciones grandes y claras
- scroll horizontal controlado solo cuando la tabla lo necesite
- contenido importante primero

## Paleta base

La base actual del frontend usa una paleta neutra cercana a Tailwind.

### Colores principales

- `#FFFFFF`: superficie primaria
- `#F9FAFB`: fondo general de pagina
- `#F3F4F6`: superficies secundarias
- `#E5E7EB`: bordes y separadores suaves
- `#D1D5DB`: bordes secundarios en tablas o impresiones
- `#6B7280`: texto secundario
- `#374151`: texto de apoyo
- `#111827`: texto principal
- `#000000`: accion primaria, marca y enfasis fuerte

### Colores semanticos

Usar solo cuando el estado lo justifique:

- exito: verdes suaves como `bg-green-100` y `bg-green-200`
- advertencia: amarillos o ambar suaves como `bg-yellow-100`, `bg-yellow-200`, `bg-amber-50`
- error o accion destructiva: rojos suaves como `bg-red-50`, `text-red-700`
- bloqueado o inactivo: grises medios como `bg-gray-200`, `bg-gray-300`, `text-gray-600`

### Regla de uso

- Un componente no debe mezclar demasiados colores semanticos al mismo tiempo.
- Si el estado ya se comunica por texto, usar color como refuerzo, no como unico canal.
- Evitar gradientes, sombras fuertes o colores saturados salvo que exista una necesidad funcional clara.

## Tipografia

### Familia

La direccion actual usa una sans serif neutra tipo `Inter` o equivalente del sistema. Debe mantenerse esa linea:

- legible
- compacta
- profesional
- buena para tablas y formularios

### Jerarquia recomendada

- Titulo de pagina: `text-xl` o `text-2xl`, `font-semibold`, `tracking-tight`
- Titulo de seccion: `text-sm` o `text-base`, `font-semibold`
- Label auxiliar o eyebrow: `text-xs`, `uppercase`, tracking amplio
- Texto base: `text-sm`
- Texto de tabla densa: `text-xs`
- Metadata o ayuda: `text-xs`, `text-gray-500` o `text-gray-600`

### Reglas

- Usar mayusculas solo en labels cortos, encabezados de tabla o metadatos.
- Evitar parrafos largos dentro de modales o cards.
- Mantener vocabulario simple y operativo.

## Espaciado y ritmo

### Escala recomendada

- `gap-1` a `gap-2`: metadatos o grupos muy compactos
- `gap-2` a `gap-3`: formularios y acciones frecuentes
- `gap-4`: bloques principales
- `px-3 py-2`: base preferida para inputs, botones, cards y filas destacadas
- `px-4 py-3`: cabeceras de paneles y modales solo cuando haga falta
- `px-6 py-4` o mayores: evitar salvo casos excepcionales

### Reglas

- Repetir patrones de padding antes de inventar nuevos.
- Preferir siempre la variante mas compacta que siga siendo legible.
- Evitar contenedores altos que agranden artificialmente la interfaz.
- En tablas, priorizar alineacion sobre aire visual.
- En modales, separar claramente: cabecera, contenido, acciones, pero sin sobredimensionar el panel.

## Bordes, radios y sombras

### Bordes

- Base: `border border-gray-200`
- Tablas densas: se permiten bordes un poco mas notorios como `border-gray-300` o `border-gray-400`

### Radios

- `rounded-lg`: acciones y botones
- `rounded-xl`: formularios e inputs
- `rounded-2xl`: cards o paneles principales
- `rounded-sm`: puede usarse en cards de home cuando el patron ya existe

### Sombras

- Preferir `shadow-sm` o `shadow-xl` solo en modales
- No usar sombras decorativas pesadas

## Layout

### Estructura general

El layout base actual responde a este esquema:

1. navbar superior fija en lenguaje visual liviano
2. contenido principal centrado
3. footer sobrio con informacion de contexto

### Anchos recomendados

- contenedor principal: `max-w-7xl`
- modales complejos: hasta `max-w-5xl`
- formularios largos: usar grillas de 1 o 2 columnas segun necesidad

### Fondos

- pagina: `bg-gray-50`
- paneles, tablas y modales: `bg-white`

## Componentes

### Navbar

Debe mantenerse:

- blanca
- con borde inferior
- acciones secundarias discretas
- branding minimo y compacto

No recargar con badges, banners o accesos duplicados.

### Cards de navegacion

Patron actual:

- fondo blanco
- borde fino
- hover sutil
- icono pequeno
- copy corto
- padding contenido y altura minima estrictamente necesaria

Ideal para home y hubs internos. Evitar descripciones largas dentro de estas cards.

### Botones

#### Primario

- fondo negro o gris muy oscuro
- texto blanco
- peso visual alto
- usar para guardar, crear, confirmar
- evitar botones demasiado altos o anchos sin necesidad

#### Secundario

- fondo blanco
- borde gris
- texto oscuro
- usar para cancelar, editar, navegar o acciones no dominantes

#### Destructivo

- base roja suave
- texto rojo oscuro
- usar solo para eliminar o acciones irreversibles

### Inputs y selects

Patron actual recomendado:

- `rounded-xl`
- borde gris
- tipografia `text-sm`
- focus sobrio con cambio de borde
- ayuda y errores debajo del control
- padding vertical corto; evitar campos visualmente gigantes

### Checkboxes y toggles

- Siempre acompaniados por label claro
- Mejor dentro de bloques con fondo suave si representan configuraciones
- No usar switch complejo si el checkbox simple ya resuelve el caso

### Tablas

Las tablas son una pieza central del sistema.

Reglas:

- encabezado claramente diferenciado
- filas con estados visibles
- tipografia pequena pero legible
- acciones alineadas y agrupadas
- permitir `overflow-x-auto` cuando la densidad lo requiera
- reducir padding de celdas antes de reducir contraste o tipografia

Cuando haya estados especiales como `bloqueado`, `reserva` o `entregado`, usar:

- fondo de fila semantico
- etiqueta textual explicita
- iconografia de apoyo solo si agrega valor

### Modales

Patron esperado:

- overlay oscuro suave
- panel blanco con borde y radio amplio
- titulo claro
- cierre visible
- footer con acciones alineadas a la derecha

## Iconografia

El proyecto usa `lucide-react`, y debe seguir asi salvo necesidad fuerte.

Reglas:

- iconos pequenos, limpios y consistentes
- evitar mezclar sets distintos
- usar iconos para reforzar orientacion, no para decorar
- mantener `strokeWidth` consistente dentro de cada contexto

## Estados de interfaz

### Loading

- simple y claro
- evitar esqueletos complejos si no agregan valor

### Vacio

Debe explicar:

- que falta
- si es normal
- que accion puede tomar el usuario

### Error

Debe ser directo y operativo:

- que fallo
- que puede revisar el usuario
- cuando corresponde, como reintentar

### Exito

Usar feedback breve, preferentemente toast o mensaje corto:

- accion realizada
- sin texto excesivo

## Contenido y microcopy

La voz del sistema debe ser:

- clara
- breve
- profesional
- sin tono promocional

### Reglas de escritura

- usar verbos directos: `Guardar cambios`, `Crear agenda`, `Buscar en SIAC`
- mantener el mismo termino durante todo el flujo
- evitar tecnicismos internos si el usuario reconoce mejor el termino operativo
- no usar mensajes vagos como `Ocurrio un error` si se puede ser mas especifico

## Accesibilidad

Minimos obligatorios:

- foco visible en acciones e inputs
- contraste suficiente entre texto y fondo
- labels asociados a campos
- `aria-label` en botones iconicos si corresponde
- soporte de teclado en modales y menus

## Impresion

El proyecto ya contempla estilos de impresion. Al extender pantallas imprimibles:

- usar fondo blanco
- eliminar elementos no utiles para papel
- asegurar tablas legibles
- reducir sombras y adornos
- respetar clases existentes como `dashboard-print-area`, `print-hidden` y relacionadas

## Reglas para futuras pantallas

Antes de crear una nueva vista, verificar:

1. Si ya existe un layout similar que pueda reutilizarse.
2. Si el patron visual coincide con el resto del sistema.
3. Si la accion principal esta clara en menos de 3 segundos.
4. Si los estados semanticos usan el mismo lenguaje que otras vistas.
5. Si en mobile la pantalla sigue siendo operable.

## Cosas a evitar

- interfaces con apariencia de landing page
- gradientes llamativos o colores saturados sin motivo funcional
- demasiados tamanos tipograficos en una misma vista
- exceso de sombras
- multiples acciones primarias compitiendo
- iconos decorativos sin funcion
- textos largos en cards, botones o headers
- modales con demasiada logica visual distinta al resto del sistema
- padding excesivo que haga ver la app mas grande o vacia de lo necesario

## Recomendacion de implementacion

Para consolidar estas guias en codigo, conviene evolucionar el frontend hacia:

- tokens de color compartidos
- componentes base reutilizables para botones, headers, tablas y formularios
- utilidades comunes para estados vacios, errores y loading
- menos estilos inline por vista y mas patrones compartidos

## Resumen

`intraNIC` debe verse como una herramienta interna robusta: blanca, ordenada, neutra, precisa y orientada a operacion. Cada nueva pantalla tiene que reforzar esa sensacion en lugar de competir con ella.
