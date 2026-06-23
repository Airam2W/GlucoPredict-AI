# 🩺 GlucoPredict-AI

**GlucoPredict-AI** es una aplicación web que combina inteligencia artificial, datos clínicos y conductuales para estimar el riesgo de desarrollar diabetes tipo 2. A través de una interfaz sencilla e intuitiva, los usuarios pueden registrar perfiles personales, capturar información clínica y conductual, y recibir un análisis, explicaciones y recomendaciones detalladas generadas por un sistema experto.

El proyecto funciona como cliente web estático (HTML, CSS y JavaScript), utiliza **Firebase** para autenticación y almacenamiento, y se conecta a un **sistema experto externo** desplegado en Render para procesar las predicciones.

> ⚕️ **Aviso importante:** GlucoPredict-AI es una herramienta informativa y de prevención. Sus resultados **no sustituyen** la valoración, diagnóstico ni tratamiento de un profesional de la salud. Ante cualquier duda, consulta a tu médico.

---

## Tabla de contenidos

- [¿Qué puede hacer GlucoPredict-AI?](#qué-puede-hacer-glucopredict-ai)
- [Alcance actual](#alcance-actual)
- [Arquitectura](#arquitectura)
- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Flujo de funcionamiento](#flujo-de-funcionamiento)
- [Autenticación y datos](#autenticación-y-datos)
- [Módulo de perfiles personales](#módulo-de-perfiles-personales)
- [Registro clínico y conductual](#registro-clínico-y-conductual)
- [Integración con el sistema experto](#integración-con-el-sistema-experto)
- [Visualización de resultados](#visualización-de-resultados)
- [Validaciones](#validaciones)
- [Diseño e interfaz](#diseño-e-interfaz)
- [Restricciones por tipo de usuario](#restricciones-por-tipo-de-usuario)
- [Estado actual del desarrollo](#estado-actual-del-desarrollo)
- [Ejecución local](#ejecución-local)
- [Aviso médico](#aviso-médico)

---

## ¿Qué puede hacer GlucoPredict-AI?

GlucoPredict-AI guía al usuario a través de un proceso claro:

1. **Crear un perfil personal** con datos básicos.
2. **Registrar información clínica y de hábitos** (glucosa, IMC, actividad física, entre otros).
3. **Obtener una estimación de riesgo** de diabetes tipo 2 desde un sistema experto.
4. **Revisar análisis, explicaciones y recomendaciones** personalizadas.
5. **Consultar el historial** de predicciones anteriores con gráficas comparativas.

La aplicación organiza toda la información por usuario autenticado, garantizando privacidad y acceso personal a los datos.

---

## Alcance actual

### ✅ Funcionalidades implementadas

- Página de inicio con modales de inicio de sesión y registro.
- Registro e inicio de sesión con correo y contraseña.
- Inicio de sesión con Google mediante Firebase Authentication.
- Panel personal con listado de perfiles.
- Creación, edición y eliminación de perfiles personales.
- Registro clínico y conductual vinculado a cada perfil.
- Cálculo automático de IMC a partir de peso y estatura.
- Predicción clínica y conductual desde el sistema experto externo.
- Visualización de riesgos, análisis, explicaciones y recomendaciones.
- Gráficas interactivas de factores clínicos y conductuales con Chart.js.
- Historial de predicciones guardado en Firestore.
- Validaciones personalizadas de formularios con mensajes de error accesibles.
- Tema claro/oscuro persistido en el navegador.
- Interfaz de pago simulada que actualiza el tipo de usuario en Firestore.

### 🚧 En desarrollo o deshabilitado temporalmente

- **Módulo médico:** visible en el código pero bloqueado desde la navegación. Muestra mensaje de módulo en desarrollo.
- **Simulador:** cuenta con archivos de interfaz y lógica, pero permanece deshabilitado desde el perfil personal.
- **Lectura de PDF:** la lógica JavaScript existe, pero el bloque de carga está comentado en la vista de registro clínico.
- **Backend local:** no existe una API Python local en este repositorio; las predicciones se consumen desde el servicio externo en Render.

---

## Arquitectura

GlucoPredict-AI sigue una arquitectura **cliente-servicio**, donde el frontend es completamente estático y se apoya en dos servicios externos: Firebase y el sistema experto.

```text
Usuario
  │
  ▼
Frontend Web Estático
(HTML + CSS + JavaScript)
  │
  ├──▶ Firebase Authentication   →  Gestión de sesiones
  │
  ├──▶ Cloud Firestore           →  Almacenamiento de usuarios, perfiles y predicciones
  │
  └──▶ ExpertSystem en Render    →  Análisis y predicciones
           /api/clinic
           /api/conductual
           /api/metricas
           /api/eyra
```

El frontend maneja navegación, formularios, validaciones, sesión activa y presentación de resultados. Firebase se encarga de la autenticación y la base de datos. El sistema experto externo procesa los datos clínicos y conductuales y devuelve predicciones y análisis.

---

## Tecnologías utilizadas

| Tecnología | Rol en el proyecto |
|---|---|
| HTML5 | Estructura de páginas y formularios |
| CSS3 | Diseño visual, responsividad y tema claro/oscuro |
| JavaScript (ES Modules) | Lógica de autenticación, formularios, Firestore, predicción y renderizado |
| Firebase SDK 10.7.1 | Autenticación y conexión con Firestore |
| Cloud Firestore | Almacenamiento de usuarios, perfiles, registros y predicciones |
| Chart.js | Gráficas de factores clínicos y conductuales |
| PDF.js | Lectura de texto desde PDF (lógica existente, no activa) |
| Render | Hospedaje del servicio externo de sistema experto |

---

## Estructura del proyecto

```text
GlucoPredict-AI/
├── index.html
├── README.md
├── BackEnd/
│   ├── requirements.txt
│   └── JS/
│       ├── configurationFirebase.js
│       ├── inicio_sesion.js
│       ├── registro.js
│       ├── auth-guard.js
│       ├── formValidation.js
│       ├── persona_dashboard.js
│       ├── agregar_perfil.js
│       ├── registro_clinico.js
│       ├── perfil_persona.js
│       ├── prediccion.js
│       ├── paga.js
│       ├── theme.js
│       ├── restriccionesLicencia.js
│       └── otros módulos de soporte
└── FrontEnd/
    ├── HTML/
    │   ├── persona_dashboard.html
    │   ├── agregar_perfil.html
    │   ├── registro_clinico.html
    │   ├── perfil_persona.html
    │   ├── paga.html
    │   └── otras vistas
    ├── CSS/
    │   ├── base.css
    │   ├── index.css
    │   ├── persona_dashboard.css
    │   ├── agregar_perfil.css
    │   ├── registro_clinico.css
    │   ├── perfil_persona.css
    │   └── estilos por vista
    └── img/
        ├── logo.png
        ├── logosolo.png
        └── logo texto.png
```

> 📝 **Nota:** A pesar del nombre, la carpeta `BackEnd/` contiene principalmente JavaScript ejecutado en el navegador. La API de predicción no está implementada localmente; se consume desde el servicio externo en Render.

---

## Flujo de funcionamiento

El recorrido típico de un usuario dentro de la aplicación es el siguiente:

1. El usuario accede a `index.html`.
2. Inicia sesión o crea una cuenta (correo/contraseña o Google).
3. Firebase Authentication valida la sesión.
4. Se crea o consulta el documento del usuario en Firestore.
5. El usuario accede a su panel de perfiles personales.
6. Crea un perfil con datos básicos y, opcionalmente, registra datos clínicos y conductuales.
7. El registro se guarda en Firestore.
8. Al abrir el perfil, el frontend consulta el registro clínico existente.
9. Si hay un registro disponible, se consumen los endpoints del sistema experto.
10. Los resultados se presentan en pantalla y se guardan como historial de predicción.

---

## Autenticación y datos

La autenticación se configura en `BackEnd/JS/configurationFirebase.js` y se utiliza en los módulos de login, registro y protección de rutas.

**Estructura de datos en Firestore:**

```text
users/{uid}
├── email
├── nombre
├── tipo
├── uso
└── createdAt

users/{uid}/perfiles/{perfilId}
├── nombre
├── edad
├── sexo
├── observaciones
└── createdAt

users/{uid}/perfiles/{perfilId}/registro_clinico/actual
├── nombre
├── clinico
├── conductual
└── updatedAt

users/{uid}/perfiles/{perfilId}/predicciones/{prediccionId}
├── predictClinica
├── predictConductual
├── analisis
├── explicaciones
├── recomendaciones
├── metricas
├── historialSnapshot
└── fecha
```

---

## Módulo de perfiles personales

El módulo de perfiles es el núcleo de la experiencia del usuario. Está compuesto por:

| Archivo | Descripción |
|---|---|
| `FrontEnd/HTML/persona_dashboard.html` | Panel principal con listado de perfiles |
| `FrontEnd/HTML/agregar_perfil.html` | Formulario de creación de perfil |
| `FrontEnd/HTML/perfil_persona.html` | Vista detallada del perfil y predicciones |
| `BackEnd/JS/persona_dashboard.js` | Lógica del panel de perfiles |
| `BackEnd/JS/agregar_perfil.js` | Lógica de creación de perfil |
| `BackEnd/JS/perfil_persona.js` | Lógica de visualización y predicción |

Desde el panel, el usuario puede listar, abrir, editar o eliminar sus perfiles, así como acceder al registro clínico y consultar predicciones.

---

## Registro clínico y conductual

El registro clínico se administra en `FrontEnd/HTML/registro_clinico.html` y `BackEnd/JS/registro_clinico.js`. Los datos se dividen en dos bloques principales:

### Datos clínicos

```js
clinico: {
  edad, Peso, Estatura, imc,
  glu_suero, hb1ac, insulina,
  trig, col_hdl, col_ldl,
  ac_urico, sexo_Hombre, sexo_Mujer
}
```

### Datos conductuales

```js
conductual: {
  PhysActivity, Smoker, HighBP,
  Fruits, BMI, Sex, Age, Veggies,
  HvyAlcoholConsump, DiffWalk,
  MentHlth, AnyHealthcare,
  NoDocbcCost, Education, Income
}
```

Las respuestas booleanas del formulario se transforman a `1`, `0` o `null`. Los campos numéricos se convierten con `Number(...)` cuando tienen valor. El IMC se calcula automáticamente cuando el usuario no lo ingresa y proporciona peso y estatura.

---

## Integración con el sistema experto

La integración se concentra en `BackEnd/JS/prediccion.js`.

**URL base del servicio:**

```
https://expertsystem-glucopredict-ai.onrender.com
```

**Endpoints consumidos:**

| Función | Endpoint | Datos enviados | Resultado |
|---|---|---|---|
| `prediccionClinica` | `/api/clinic` | `historial.clinico` | `clinic_result` |
| `prediccionConductual` | `/api/conductual` | `historial.conductual` | `conductual_result` |
| `obtenerMetricas` | `/api/metricas` | `historial` completo | `metricas_result` |
| `obtenerEYRA` | `/api/eyra` | `historial` completo | `eyra_result` |

Todas las peticiones se realizan con `fetch`, método `POST`, encabezado `Content-Type: application/json` y cuerpo serializado con `JSON.stringify(...)`. No se utiliza Axios.

El resultado integrado que se guarda en Firestore tiene la siguiente forma:

```js
{
  predictClinica,
  predictConductual,
  analisis,
  explicaciones,
  recomendaciones,
  metricas,
  historialSnapshot
}
```

---

## Visualización de resultados

Los resultados se presentan en `perfil_persona.html` mediante `perfil_persona.js` e incluyen:

- 📊 Riesgo clínico y riesgo conductual (porcentaje).
- 🏷️ Clasificación textual del nivel de riesgo.
- 📝 Análisis general generado por el módulo EYRA.
- 💡 Explicaciones del resultado y recomendaciones personalizadas.
- 🕐 Fecha de la última predicción e historial de predicciones anteriores.
- 📈 Gráficas interactivas de factores clínicos y conductuales.

**Clasificación visual de riesgo:**

| Porcentaje | Nivel |
|---|---|
| < 30% | 🟢 Bajo |
| 30% – 59% | 🟡 Moderado |
| ≥ 60% | 🔴 Alto |

---

## Validaciones

Las validaciones se centralizan en `BackEnd/JS/formValidation.js` y cubren:

- Campos de texto obligatorios y opcionales.
- Selecciones en listas desplegables.
- Enteros y números con rangos específicos.
- Teléfono, correo electrónico y tipo de sangre.
- Rangos clínicos y personales validados por campo.

Cuando un campo no cumple una regla, se muestra un mensaje de error debajo del campo, se aplica una clase visual de error y se utiliza `aria-invalid` para mejorar la accesibilidad.

---

## Diseño e interfaz

El diseño se construye sobre `FrontEnd/CSS/base.css` con estilos específicos por vista. Características principales:

- 🎨 Variables CSS para colores, fondos, bordes y sombras.
- 🌙 Tema claro y oscuro controlado desde `theme.js`, persistido en el navegador.
- 🃏 Componentes tipo tarjeta para formularios y resultados.
- 🔘 Botones primarios, secundarios y de acción de riesgo.
- ⏳ Estados de carga con animaciones tipo spinner/skeleton.
- 📱 Media queries para una experiencia adaptable en pantallas pequeñas.
- 📉 Gráficas responsivas con Chart.js.

La página de inicio incluye una presentación visual del proyecto, beneficios generales y los modales de autenticación.

---

## Restricciones por tipo de usuario

El campo `tipo` en el documento del usuario controla los límites de uso:

| Tipo | Comportamiento |
|---|---|
| `GRATIS` | Máximo 3 perfiles personales |
| `PAGA` | Sin límite de perfiles |

La vista `paga.html` simula el proceso de actualización de plan. Al confirmar el pago o ingresar un código válido, el campo `tipo` del usuario se actualiza a `PAGA` directamente en Firestore.

---

## Estado actual del desarrollo

### ✅ Flujo principal funcional

- Autenticación completa con Firebase (correo/contraseña y Google).
- Almacenamiento y lectura de datos en Firestore.
- Predicción desde el servicio externo `ExpertSystem_GlucoPredict-AI`.
- Visualización de predicciones, análisis, explicaciones, recomendaciones y gráficas.

### ⚠️ Puntos técnicos a considerar

- La URL del servicio experto está escrita directamente en `prediccion.js`; no existe variable de entorno local para modificarla.
- `prediccion.js` no valida `response.ok` explícitamente; los errores HTTP se manejan en el `try/catch` del módulo que llama las funciones.
- El módulo médico y el simulador están deshabilitados en el flujo actual.
- Algunas vistas y scripts médicos permanecen en el repositorio como base para desarrollo futuro.

---

## Ejecución local

El proyecto puede ejecutarse como sitio estático. Se recomienda servirlo desde la raíz del repositorio para que las rutas absolutas funcionen correctamente.

**Con Python:**

```bash
python -m http.server 8000
```

Luego abre en tu navegador:

```
http://localhost:8000/GlucoPredict-AI/
```

> 💡 Si sirves directamente desde la carpeta `GlucoPredict-AI/`, asegúrate de que las rutas absolutas `/GlucoPredict-AI/...` estén disponibles desde el servidor utilizado.

---

## Configuración externa

La configuración de Firebase se encuentra en `BackEnd/JS/configurationFirebase.js`.

La URL del sistema experto está definida directamente en `BackEnd/JS/prediccion.js`.

Actualmente no se utiliza ningún archivo `.env` ni variables de entorno dentro del repositorio para modificar estas configuraciones.

---

## Aviso médico

GlucoPredict-AI entrega una estimación basada en los datos proporcionados por el usuario y en las respuestas del sistema experto externo. Sus resultados deben interpretarse **únicamente como apoyo informativo y preventivo**.

> ⚕️ Esta aplicación **no diagnostica diabetes**, no prescribe tratamientos y no reemplaza estudios clínicos ni consulta médica profesional. Ante cualquier resultado de riesgo o duda sobre tu salud, acude con personal médico calificado.