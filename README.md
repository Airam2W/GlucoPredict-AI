# GlucoPredict-AI

## Plataforma Inteligente de Predicción de Riesgo de Diabetes Tipo 2

![Estado del Proyecto](https://img.shields.io/badge/Estado-En%20Desarrollo-yellow)
![Lenguajes](https://img.shields.io/badge/Lenguajes-JavaScript%20%7C%20Python%20%7C%20HTML%2FCSS-blue)
![Base de Datos](https://img.shields.io/badge/Base%20de%20Datos-Firebase-orange)

---

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Características Principales](#características-principales)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Guía de Uso](#guía-de-uso)
- [Roles de Usuario](#roles-de-usuario)
- [Funcionalidades Detalladas](#funcionalidades-detalladas)
- [Modelo de Pricing](#modelo-de-pricing)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Configuración de Firebase](#configuración-de-firebase)
- [Estado del Desarrollo](#estado-del-desarrollo)
- [Roadmap Futuro](#roadmap-futuro)
- [Contribuciones](#contribuciones)

---

## 🎯 Descripción General

**GlucoPredict-AI** es una plataforma web integral y basada en inteligencia artificial diseñada para la predicción y monitoreo del riesgo de desarrollo de **Diabetes Tipo 2**. La aplicación combina análisis clínicos especializados, recomendaciones médicas personalizadas e interfaces intuitivas para profesionales de la salud y usuarios particulares.

La plataforma implementa un sistema experto con reglas basadas en conocimiento médico, permitiendo evaluaciones precisas de riesgo mediante algoritmos que consideran múltiples factores de riesgo cardiovasculares y metabólicos. Los resultados incluyen explicaciones médicas, recomendaciones personalizadas y simuladores interactivos que permiten explorar escenarios futuros.

### Propósito Clínico

GlucoPredict-AI fue desarrollada como herramienta preventiva para:
- Identificar individuos con alto riesgo de diabetes tipo 2
- Proporcionar recomendaciones basadas en evidencia para modificación de estilos de vida
- Facilitar el monitoreo longitudinal de pacientes en clínicas
- Educación sanitaria y conciencia sobre factores de riesgo
- Apoyo en la toma de decisiones clínicas

---

## ✨ Características Principales

### 1. **Sistema de Predicción Inteligente**
- Cálculo del porcentaje de riesgo de diabetes tipo 2 basado en inteligencia artificial
- Análisis de múltiples factores de riesgo (antropométricos, metabólicos, genéticos y de estilo de vida)
- Explicaciones médicas detalladas fundamentadas en criterios clínicos
- Recomendaciones personalizadas con análisis de impacto potencial

### 2. **Gestión Médica Profesional**
- **Módulo de Clínicas**: Creación y administración completa de clínicas médicas
- **Gestión de Pacientes**: Registro, seguimiento y análisis de historiales clínicos
- **Dashboard de Médicos**: Panel de control especializado para profesionales de la salud
- **Historial Clínico Digital**: Almacenamiento seguro de datos clínicos del paciente

### 3. **Monitoreo Personal**
- **Perfiles Personales**: Creación de múltiples perfiles para automonitoreo
- **Simulador de Riesgo**: Herramienta interactiva para visualizar impacto de cambios en variables de riesgo
- **Análisis Temporal**: Gráficas de evolución del riesgo, IMC y glucosa en el tiempo
- **Historial de Predicciones**: Registro cronológico de todas las evaluaciones

### 4. **Análisis de Impacto**
- Simulación de escenarios a 4, 8 y 12 semanas
- Visualización gráfica de tendencias de riesgo
- Análisis de impacto de recomendaciones específicas
- Interpretación automática de resultados

### 5. **Seguridad y Autenticación**
- Autenticación mediante Google y correo electrónico
- Sistema de guardias de autenticación en rutas protegidas
- Gestión de sesiones seguras con Firebase Authentication
- Protección de datos sensibles de pacientes

### 6. **Modelo de Negocio Flexible**
- **Plan Gratuito**: 1 clínica, 3 pacientes, 3 perfiles personales
- **Plan de Pago (Premium)**: Acceso ilimitado a clínicas, pacientes y perfiles
- Control de restricciones por tipo de usuario
- Interfaz integrada de pago

---

## 🏗️ Arquitectura del Sistema

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                        GlucoPredict-AI                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     FRONTEND (HTML/CSS/JS)              │   │
│  │  - Interfaz de Usuario Responsiva                       │   │
│  │  - Validación de Formularios en Tiempo Real             │   │
│  │  - Gráficas Interactivas (Chart.js)                     │   │
│  │  - Gestión de Estado de Sesión                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   BACKEND (JavaScript/Python)           │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Módulo de Lógica (JavaScript)                    │  │   │
│  │  │  - CRUD Operations                                │  │   │
│  │  │  - Gestión de Historiales                         │  │   │
│  │  │  - Integración Firebase                           │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Motor de Predicción (Python/API)                 │  │   │
│  │  │  - Sistema Experto                                │  │   │
│  │  │  - Cálculo de Riesgo                              │  │   │
│  │  │  - Generación de Recomendaciones                  │  │   │
│  │  │  - Explicaciones Médicas                          │  │   │
│  │  │  - Endpoint: /api/predict                         │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              BASE DE DATOS (Firebase Firestore)          │   │
│  │  Estructura:                                             │   │
│  │  /users/{uid}/                                           │   │
│  │    ├── clinicas/{clinicaId}/                             │   │
│  │    │   └── pacientes/{pacienteId}/                       │   │
│  │    │       ├── historial_clinico/actual                  │   │
│  │    │       └── predicciones/                             │   │
│  │    ├── perfiles/{perfilId}/                              │   │
│  │    │   ├── historial_clinico/actual                      │   │
│  │    │   └── predicciones/                                 │   │
│  │    └── información_de_usuario                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │        AUTENTICACIÓN Y AUTORIZACIÓN (Firebase Auth)      │   │
│  │  - Google OAuth 2.0                                      │   │
│  │  - Email/Password                                        │   │
│  │  - Gestión de Sesiones                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de Datos para Predicción

```
Usuario Ingresa Datos Clínicos
         ↓
Validación en Formulario (Frontend)
         ↓
Envío a Backend (JavaScript)
         ↓
Llamada a API de Predicción (Python)
         ↓
Sistema Experto Procesa Información
         ↓
Generación de:
  • Porcentaje de Riesgo
  • Explicaciones Médicas
  • Recomendaciones Personalizadas
  • Análisis de Impacto
         ↓
Almacenamiento en Firestore
         ↓
Visualización con Gráficas y Tablas
```

---

## 📋 Requisitos Previos

### Hardware
- Computadora con procesador moderno
- Mínimo 4 GB de RAM
- Conexión a Internet estable
- Navegador web moderno (Chrome, Firefox, Safari, Edge)

### Software
- **Node.js** (v14 o superior)
- **Python** (v3.8 o superior)
- **pip** (gestor de paquetes de Python)
- **Git** (para control de versiones)

### Credenciales Externas
- Cuenta de **Firebase** (con proyecto configurado)
- Credenciales de OAuth de Google (para autenticación)
- Servidor de API Python (https://expertsystem-glucopredict-ai.onrender.com)

---

## 🛠️ Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/GlucoPredict-AI.git
cd GlucoPredict-AI
```

### 2. Configurar Frontend

```bash
# No es necesario instalar dependencias NPM adicionales para el frontend
# (se utilizan librerías CDN)
# Solo asegúrate de tener un servidor HTTP
```

### 3. Instalar Dependencias del Backend

#### Dependencias Python

```bash
pip install flask
pip install flask-cors
pip install pytesseract
pip install Pillow
pip install pdfplumber
```

#### Dependencias JavaScript

```bash
npm install firebase
```

### 4. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```
FIREBASE_API_KEY=AIzaSyATJaR9NoVzk6EwpSxm9OG3bajhcY23Y4M
FIREBASE_AUTH_DOMAIN=glucopredict-ai.firebaseapp.com
FIREBASE_PROJECT_ID=glucopredict-ai
FIREBASE_STORAGE_BUCKET=glucopredict-ai.appspot.com
FIREBASE_MESSAGING_SENDER_ID=5344131264
FIREBASE_APP_ID=1:5344131264:web:a98c148676c4173cdad525

API_URL=https://expertsystem-glucopredict-ai.onrender.com
```

### 5. Ejecutar la Aplicación

#### Servidor Frontend

```bash
# Usando Python 3
python -m http.server 8000

# O usando http-server de Node
npx http-server -p 8000
```

Accede a `http://localhost:8000` en tu navegador.

---

## 📖 Guía de Uso

### Primer Acceso

1. Accede a la página de inicio de GlucoPredict-AI
2. Haz clic en **"Registrarse"** o **"Continuar con Google"**
3. Completa el registro con tu correo electrónico y contraseña
4. Serás redirigido al panel principal

### Panel Principal

El panel principal ofrece dos opciones:

#### 🏥 **Módulo de Clínicas**
Para médicos y profesionales de la salud:
- Crear y administrar clínicas
- Registrar pacientes
- Acceder a historiales clínicos
- Realizar predicciones de riesgo
- Generar reportes

#### 👤 **Módulo de Perfiles Personales**
Para usuarios individuales:
- Crear múltiples perfiles personales
- Automonitoreo de riesgo
- Acceso al simulador
- Análisis de evolución

### Flujo Típico de Uso

```
1. Inicia Sesión / Regístrate
        ↓
2. Selecciona Módulo (Clínicas o Perfiles)
        ↓
3. Para Clínicas:
   - Crear Clínica → Agregar Paciente → Ingresar Historial Clínico
   - O Para Perfiles:
   - Crear Perfil → Ingresar Datos Personales
        ↓
4. Sistema Calcula Predicción
        ↓
5. Visualiza Resultados y Recomendaciones
        ↓
6. (Opcional) Usa Simulador para Explorar Escenarios
```

---

## 👥 Roles de Usuario

### 1. **Usuario Gratuito (GRATIS)**
- **Límites**:
  - Máximo 1 clínica
  - Máximo 3 pacientes por clínica
  - Máximo 3 perfiles personales
- **Acceso**:
  - Predicciones básicas
  - Visualización de resultados
  - Simulador limitado
- **Restricción**: Botón "Actualizar a Versión de Pago" visible

### 2. **Usuario Premium (PAGA)**
- **Límites**: Ilimitados
  - Clínicas sin límite
  - Pacientes sin límite
  - Perfiles personales sin límite
- **Acceso**:
  - Todas las funcionalidades
  - Prioridad en procesamiento
  - Sin restricciones operacionales

### 3. **Médico/Profesional de la Salud**
- Acceso al módulo de clínicas
- Capacidad de gestionar múltiples pacientes
- Acceso a historiales clínicos completos
- Generación de reportes

---

## 🔧 Funcionalidades Detalladas

### A. Módulo de Predicción

#### Variables de Entrada
El sistema analiza los siguientes parámetros clínicos:

| Variable | Rango | Unidad | Descripción |
|----------|-------|--------|-------------|
| Nombre completo | Texto | - | Identificador del paciente |
| Edad | 0-120 | años | Edad del individuo |
| Sexo | M/F/O | - | Sexo biológico |
| IMC | 10-80 | kg/m² | Índice de Masa Corporal |
| Glucosa en ayunas | 40-600 | mg/dL | Nivel de glucosa en sangre en ayunas |
| Presión arterial sistólica | 70-250 | mmHg | Presión arterial sistólica |
| Antecedentes familiares | Sí/No | - | Historial de diabetes en familia |
| Hipertensión previa | Sí/No | - | Diagnóstico previo de hipertensión |
| Actividad física | 3 niveles | - | Sedentario, Moderado, Activo |
| Consumo de alcohol | 3 niveles | - | No, Ocasional, Frecuente |

#### Salida del Sistema

El sistema retorna:

1. **Porcentaje de Riesgo**: Probabilidad de desarrollar diabetes tipo 2 (0-100%)

2. **Explicaciones Médicas**: 
   - Justificación clínica del riesgo
   - Factores dominantes en el cálculo
   - Referencia a criterios diagnósticos

3. **Recomendaciones Personalizadas**:
   - Modificaciones en estilo de vida
   - Recomendaciones nutricionales
   - Programas de ejercicio
   - Monitoreo adicional

4. **Análisis de Impacto**:
   - Impacto potencial de cada recomendación
   - Reducción estimada de riesgo

### B. Módulo de Simulación

#### Características

- **Tiempo de Simulación**: 4, 8 o 12 semanas
- **Variables Modificables**: Selección de recomendaciones a aplicar
- **Gráficas Interactivas**:
  - Evolución del riesgo de diabetes
  - Cambios en IMC
  - Variación de glucosa en sangre
- **Interpretación Automática**: Categorización de resultados

#### Categorías de Riesgo

- **Bajo**: 0-25%
- **Moderado**: 25-50%
- **Alto**: 50-75%
- **Muy Alto**: 75-100%

### C. Gestión de Historiales Clínicos

#### Fuentes de Datos

1. **Entrada Manual**: Formularios validados
2. **Carga de PDF**: OCR y extracción automática de datos
3. **Importación de Datos**: Carga desde registros existentes

#### Validaciones

- Campos obligatorios completos
- Rangos de valores dentro de límites clínicos
- Coherencia entre datos relacionados
- Alerta si datos están fuera de rango normal

### D. Generación de Reportes

#### Datos Incluidos

- Información del paciente
- Historial clínico completo
- Resultados de predicción
- Recomendaciones médicas
- Gráficas de evolución
- Fecha y hora del reporte

#### Formato

- **PDF**: Reporte descargable y imprimible

---

## 💳 Modelo de Pricing

### Plan Gratuito

| Característica | Cantidad |
|---|---|
| Clínicas | 1 |
| Pacientes por clínica | 3 |
| Perfiles personales | 3 |
| Predicciones | Ilimitadas |
| Simulador | Acceso completo |
| Soporte | Básico |
| Costo | Gratuito |

### Plan Premium (de Pago)

| Característica | Cantidad |
|---|---|
| Clínicas | Ilimitadas |
| Pacientes por clínica | Ilimitados |
| Perfiles personales | Ilimitados |
| Predicciones | Ilimitadas |
| Simulador | Acceso completo |
| Soporte | Prioritario |
| Reportes avanzados | Sí |
| Costo | A definir |

### Acceso a Pago

La plataforma incluye interfaz de pago integrada en `paga.html` con validación de datos de tarjeta (formato básico para desarrollo).

---

## 📂 Estructura del Proyecto

```
GlucoPredict-AI/
│
├── README.md                          # Este archivo
│
├── FrontEnd/
│   ├── HTML/
│   │   ├── index.html                # Página de inicio
│   │   ├── panel_principal.html       # Panel principal del usuario
│   │   ├── medico_dashboard.html      # Dashboard de médicos
│   │   ├── persona_dashboard.html     # Dashboard de perfiles personales
│   │   ├── clinica.html               # Gestión de clínicas
│   │   ├── paciente.html              # Perfil del paciente
│   │   ├── perfil_persona.html        # Perfil personal
│   │   ├── historial_clinico.html     # Ingreso de historial clínico
│   │   ├── simulador.html             # Simulador de riesgo
│   │   ├── agregar_clinica.html       # Formulario agregar clínica
│   │   ├── agregar_paciente.html      # Formulario agregar paciente
│   │   ├── agregar_perfil.html        # Formulario agregar perfil
│   │   ├── paga.html                  # Página de pago
│   │   ├── registro.html              # Página de registro
│   │   └── ...otros HTML...
│   │
│   ├── CSS/
│   │   ├── base.css                   # Estilos base de la aplicación
│   │   ├── index.css                  # Estilos de la página de inicio
│   │   ├── panel_principal.css        # Estilos del panel principal
│   │   ├── historial_clinico.css      # Estilos del historial clínico
│   │   ├── simulador.css              # Estilos del simulador
│   │   ├── medico_dashboard.css       # Estilos del dashboard médico
│   │   ├── paciente.css               # Estilos del perfil del paciente
│   │   ├── perfil_persona.css         # Estilos del perfil personal
│   │   ├── paga.css                   # Estilos de la página de pago
│   │   ├── registro.css               # Estilos de registro
│   │   └── ...otros CSS...
│   │
│   └── img/
│       ├── logo.png                   # Logo principal
│       ├── logosolo.png               # Logo sin fondo
│       └── ...otros assets...
│
├── BackEnd/
│   ├── requeriments.txt               # Dependencias de Python y NPM
│   │
│   ├── JS/
│   │   ├── configurationFirebase.js   # Configuración de Firebase
│   │   ├── prediccion.js              # Lógica de predicción (llamadas API)
│   │   ├── simulador.js               # Lógica del simulador
│   │   ├── medico_dashboard.js        # Lógica del dashboard médico
│   │   ├── persona_dashboard.js       # Lógica del dashboard personal
│   │   ├── clinica.js                 # Lógica de gestión de clínicas
│   │   ├── paciente.js                # Lógica del perfil del paciente
│   │   ├── perfil_persona.js          # Lógica del perfil personal
│   │   ├── historial_clinico.js       # Lógica del historial clínico
│   │   ├── panel_principal.js         # Lógica del panel principal
│   │   ├── inicio_sesion.js           # Lógica de autenticación
│   │   ├── registro.js                # Lógica de registro
│   │   ├── auth-guard.js              # Protección de rutas
│   │   ├── licencia-guard.js          # Validación de licencia
│   │   ├── formValidation.js          # Validación de formularios
│   │   ├── crud_helpers.js            # Funciones CRUD auxiliares
│   │   ├── reestrinccionesLicencia.js # Restricciones por licencia
│   │   └── ...otros JS...
│   │
│   └── api/
│       ├── app.py                     # Aplicación Flask principal
│       ├── predictor.py               # Sistema experto de predicción
│       ├── rules_engine.py            # Motor de reglas
│       └── ...otros módulos...

└── index.html                         # Página de inicio principal
```

---

## 🛠️ Tecnologías Utilizadas

### Frontend

| Tecnología | Versión | Propósito |
|---|---|---|
| **HTML5** | - | Estructura de la aplicación |
| **CSS3** | - | Estilos y diseño responsivo |
| **JavaScript (Vanilla)** | ES6+ | Lógica de aplicación cliente |
| **Chart.js** | 3.x | Gráficas interactivas |
| **Firebase SDK** | 10.7.1 | Autenticación y base de datos |

### Backend

| Tecnología | Versión | Propósito |
|---|---|---|
| **Python** | 3.8+ | Lógica de predicción y procesamiento |
| **Flask** | Latest | Framework web |
| **Flask-CORS** | Latest | Manejo de CORS |
| **PyTesseract** | Latest | OCR para extracción de PDF |
| **Pillow** | Latest | Procesamiento de imágenes |
| **PDFPlumber** | Latest | Extracción de texto de PDF |
| **Node.js** | 14+ | Runtime de JavaScript |

### Infraestructura y Servicios

| Servicio | Propósito |
|---|---|
| **Firebase** | Autenticación, Firestore (base de datos), hosting |
| **Google OAuth 2.0** | Autenticación social |
| **Render.com** | Hosting del servidor Python de predicción |

### APIs Externas

- **Google Auth API**: Autenticación
- **Firebase Authentication**: Gestión de sesiones
- **Firestore REST API**: Acceso a datos

---

## 🔐 Configuración de Firebase

### Pasos de Configuración

1. **Crear Proyecto en Firebase Console**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Crea un nuevo proyecto
   - Anota las credenciales

2. **Habilitar Autenticación**
   - Authentication → Sign-in method
   - Habilitar "Email/Password"
   - Habilitar "Google"

3. **Configurar Firestore Database**
   - Cloud Firestore → Create database
   - Inicia en modo de prueba (para desarrollo)
   - Define reglas de seguridad apropiadas

4. **Actualizar Configuración en el Código**
   - Edita `BackEnd/JS/configurationFirebase.js`
   - Reemplaza las credenciales con las tuyas

### Estructura de Firestore

```
firestore-root
└── users/{uid}
    ├── tipo: "GRATIS" | "PAGA"
    ├── correo: "email@example.com"
    ├── nombre: "Nombre del usuario"
    │
    ├── clinicas/{clinicaId}
    │   ├── nombre: "Nombre Clínica"
    │   ├── direccion: "Dirección"
    │   ├── telefono: "Teléfono"
    │   ├── correo: "correo@clinica.com"
    │   ├── responsable: "Nombre Responsable"
    │   ├── especialidad: "Especialidad"
    │   ├── horario: "Horario de atención"
    │   │
    │   └── pacientes/{pacienteId}
    │       ├── nombre: "Nombre Paciente"
    │       ├── edad: 45
    │       ├── sexo: "Masculino"
    │       ├── peso: 85
    │       ├── altura: 1.75
    │       ├── telefono: "Teléfono"
    │       ├── correo: "correo@email.com"
    │       ├── contacto_emergencia: "Contacto"
    │       ├── tipo_sangre: "O+"
    │       ├── observaciones: "Observaciones"
    │       │
    │       ├── historial_clinico/actual
    │       │   ├── nombre: "Juan Ramírez"
    │       │   ├── edad: 52
    │       │   ├── sexo: "Masculino"
    │       │   ├── antecedentes_familiares: true
    │       │   ├── hipertension_previa: true
    │       │   ├── actividad_fisica: "Sedentario"
    │       │   ├── consumo_alcohol: "Ocasional"
    │       │   ├── imc: 32.6
    │       │   ├── glucosa_ayunas: 132
    │       │   ├── presion_arterial: "145/92"
    │       │   └── fecha: timestamp
    │       │
    │       └── predicciones/{prediccionId}
    │           ├── porcentaje_riesgo: 78.5
    │           ├── explicacion_medica: [...]
    │           ├── explicacion_general: [...]
    │           ├── recomendaciones: [...]
    │           ├── recomendaciones_con_impacto: [...]
    │           └── fecha: timestamp
    │
    └── perfiles/{perfilId}
        ├── nombre: "Nombre Perfil"
        ├── edad: 45
        ├── sexo: "Masculino"
        │
        ├── historial_clinico/actual
        │   └── [misma estructura que pacientes]
        │
        └── predicciones/{prediccionId}
            └── [misma estructura que pacientes]
```

---

## 🚀 Estado del Desarrollo

### ✅ Funcionalidades Implementadas

- [x] Sistema de autenticación (Email/Password + Google OAuth)
- [x] Panel principal de usuario
- [x] Gestión de clínicas (CRUD)
- [x] Gestión de pacientes (CRUD)
- [x] Gestión de perfiles personales (CRUD)
- [x] Ingreso de historiales clínicos
- [x] Motor de predicción de riesgo
- [x] Cálculo y visualización de resultados
- [x] Explicaciones médicas
- [x] Recomendaciones personalizadas
- [x] Simulador de evolución del riesgo
- [x] Gráficas interactivas
- [x] Sistema de control de acceso por tipo de usuario
- [x] Formularios con validación
- [x] Interfaz de pago (mock)

### 🟡 Funcionalidades en Desarrollo

- [ ] Mejoras de responsividad en simulador
- [ ] Mejoras de diseño de interfaces
- [ ] Validaciones mejoradas con mensajes de error
- [ ] Funcionalidad de edición completa de registros
- [ ] Gráficas adicionales de análisis
- [ ] Mejora del simulador con más parámetros
- [ ] Mejora del OCR para extracción de PDF
- [ ] Sistema de reglas más exacto y profesional

### 🔴 Funcionalidades Planeadas

- [ ] Integración de gráficas avanzadas
- [ ] Dashboard ejecutivo de clínicas
- [ ] Reportes en PDF descargables
- [ ] Análisis estadístico de cohortes
- [ ] Integración con sistemas EMR externos
- [ ] API REST pública
- [ ] Aplicación móvil nativa
- [ ] Machine Learning para mejora de predicciones
- [ ] Integración con calendario médico
- [ ] Sistema de notificaciones

---

## 📈 Roadmap Futuro

### Phase 1: Mejoras Inmediatas (1-2 meses)
- Pulir interfaz de usuario
- Completar validaciones de formularios
- Mejorar responsividad móvil
- Documentación completa del usuario

### Phase 2: Funcionalidades Avanzadas (3-4 meses)
- Reportes avanzados en PDF
- Dashboard ejecutivo
- Análisis estadístico mejorado
- Sistema de reglas de predicción mejorado

### Phase 3: Expansión (5-6 meses)
- API REST pública para integraciones
- Aplicación móvil
- Integración con sistemas externos
- Soporte multiidioma

### Phase 4: ML y IA Avanzada (7+ meses)
- Machine Learning para personalización
- Predicción mejorada con históricos
- Análisis predictivo de evolución
- Recomendaciones asistidas por IA

---

## 🤝 Contribuciones

Se aceptan contribuciones al proyecto. Para contribuir:

1. Fork el repositorio
2. Crea una rama para tu característica (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución
- Sigue los estándares de código existentes
- Documenta cambios significativos
- Incluye pruebas para nuevas funcionalidades
- Actualiza la documentación según corresponda

---

## 📄 Licencia

Este proyecto está bajo licencia [MIT/LICENSE - A definir]. Ver archivo `LICENSE` para más detalles.

---

## 📞 Soporte y Contacto

Para soporte, reportar bugs o sugerencias:

- **Email**: [contacto@glucopredict-ai.com]
- **Issues**: Abre un issue en GitHub
- **Documentación**: [Wiki del proyecto]

---

## ⚠️ Aviso Legal y Médico

**IMPORTANTE**: GlucoPredict-AI es una herramienta de apoyo preventivo y educativa. 

- **NO** sustituye la consulta médica profesional
- **NO** es un diagnóstico médico
- **NO** reemplaza evaluaciones clínicas presenciales
- Los resultados son estimaciones basadas en modelos matemáticos
- Consulta siempre con un profesional de la salud antes de tomar decisiones médicas

---

## 📊 Estadísticas del Proyecto

- **Archivos HTML**: 13
- **Archivos CSS**: 15
- **Archivos JavaScript**: 18
- **Total de Líneas de Código**: ~10,000+
- **Módulos Funcionales**: 8
- **Base de Datos**: Cloud Firestore
- **Usuarios Objetivo**: Médicos, Pacientes, Profesionales de la Salud

---

## 🎓 Contexto Académico

GlucoPredict-AI fue desarrollado como proyecto de investigación en el contexto de **Taller de Investigación II** en una institución educativa, con énfasis en:

- Sistemas expertos aplicados a la salud
- Inteligencia artificial para predicción de enfermedades
- Desarrollo full-stack de aplicaciones web
- Prácticas de ingeniería de software
- Salud digital y eSalud

---

## 🙏 Agradecimientos

- A los docentes y asesores del proyecto
- A la comunidad de desarrolladores de código abierto
- A Firebase por la infraestructura
- A los profesionales médicos que contribuyeron con criterios clínicos

---

## 📝 Changelog

### Versión Actual (En Desarrollo)
- Implementación de todas las características base
- Integración completa con Firebase
- Sistema de predicción operativo
- Panel de usuario funcional

### Versiones Futuras
- Mejoras de UI/UX
- Optimizaciones de rendimiento
- Nuevas funcionalidades

---

## ✨ Características Destacadas

### Interfaz Intuitiva
Diseño limpio y responsivo optimizado para desktop y dispositivos móviles.

### Seguridad Robusta
Autenticación segura mediante Firebase y Google OAuth 2.0.

### Análisis Avanzado
Sistema experto de predicción basado en múltiples variables clínicas.

### Datos Privados
Todos los datos de pacientes se almacenan de forma segura en Firestore.

### Escalable
Arquitectura preparada para crecer con nuevas funcionalidades.

---

**Última actualización**: Abril de 2026

**Versión**: Beta 1.0

**Estado**: En Desarrollo Activo

---

*GlucoPredict-AI - Predicción Inteligente de Riesgo de Diabetes Tipo 2*
