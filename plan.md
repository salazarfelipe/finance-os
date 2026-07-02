# Finance OS

> Personal Finance Operating System de Felipe Salazar

**Versión:** 0.1.0  
**Estado:** En diseño  
**Fecha de inicio:** Julio 2026

---

# Visión

Construir una aplicación **PWA** que permita administrar las finanzas personales con un enfoque en el crecimiento del patrimonio, eliminando la dependencia de hojas de cálculo tradicionales y evitando costos de infraestructura.

El objetivo no es registrar gastos.

El objetivo es responder continuamente la pregunta:

> **¿Mi patrimonio está creciendo al ritmo que debería?**

---

# Objetivos del proyecto

## Objetivos financieros

- Construir un fondo de emergencia equivalente a seis meses de gastos.
- Terminar de pagar los créditos actuales.
- Viajar a España después del viaje a Egipto.
- Comenzar a invertir para generar ingresos adicionales.
- Medir absolutamente todas las finanzas personales.
- Tener una única fuente de verdad para todas las decisiones financieras.

---

# Filosofía del sistema

## Principio 1

El dinero nunca desaparece.

Solamente cambia de lugar o cambia de estado.

---

## Principio 2

Registrar eventos.

Nunca registrar contabilidad manualmente.

El usuario registra decisiones.

El sistema genera automáticamente los movimientos financieros internos.

---

## Principio 3

Cada peso debe tener un propósito.

Inspirado en la filosofía de presupuesto tipo YNAB.

---

## Principio 4

El patrimonio es el indicador principal.

No el saldo del banco.

No el dinero disponible.

No el ahorro del mes.

El patrimonio.

---

## Principio 5

Toda la información se registra una sola vez.

Nunca duplicar información.

---

## Principio 6

Cada nueva funcionalidad debe cumplir al menos uno de estos objetivos:

- Reducir trabajo manual.
- Reducir errores.
- Mejorar la calidad de los datos.
- Ayudar a tomar mejores decisiones financieras.
- Ayudar a aumentar el patrimonio.

Si no cumple alguno, no entra al producto.

---

# Decisiones de arquitectura

## Plataforma

Se desarrollará una Progressive Web App (PWA).

No se utilizará Google Sheets como producto principal.

---

## Backend

No existirá backend.

No habrá:

- Django
- PostgreSQL
- Redis
- Celery
- Kubernetes
- AWS

Todo funcionará completamente en el navegador.

---

## Base de datos

SQLite ejecutándose dentro del navegador mediante WebAssembly.

Motor elegido:

```
sql.js
```

sql.js vive en memoria. Después de cada escritura, el `.db` se serializa completo y se guarda en IndexedDB. Al abrir la app, se restaura desde IndexedDB hacia memoria.

La base de datos será un único archivo.

```
finance.db
```

### Versionado de schema

No existe backend que ejecute migraciones, así que el propio cliente debe versionar el schema:

- Tabla `schema_version` dentro de `finance.db`.
- Migraciones definidas en código (TypeScript), ejecutadas en orden al abrir la base de datos si la versión es menor a la esperada.

### Backup manual

El guardado automático a IndexedDB en cada escritura reduce el riesgo de pérdida de datos, pero no protege contra borrado de datos del navegador o cambio de dispositivo. Exportar/importar el archivo `finance.db` queda planeado para una fase posterior del roadmap (junto a la sincronización), no bloquea el inicio de la implementación.

---

## Hosting

GitHub Pages.

Costo:

```
$0
```

Next.js debe configurarse con exportación estática (`output: 'export'`): sin rutas de API, sin SSR. Todo el build es HTML/JS/CSS estático servido desde GitHub Pages.

---

## Sincronización

Inicialmente:

Local.

Posteriormente podrá sincronizarse mediante:

- Google Drive
- iCloud
- Dropbox

Sin necesidad de servidor propio.

---

## Tecnologías

- React
- Next.js
- TypeScript
- Tailwind CSS
- Zustand
- SQLite (WASM)
- Chart.js o Recharts
- PWA

---

# Arquitectura

```
Presentation

↓

Application

↓

Domain

↓

Infrastructure

↓

SQLite
```

La lógica del negocio nunca dependerá de React.

---

# Clean Architecture

La aplicación seguirá una arquitectura limpia.

```
UI

↓

Hooks

↓

Use Cases

↓

Repositories

↓

SQLite
```

---

# Modelo del dominio

Entidades principales:

- Account
- Movement
- Event
- Budget
- Category
- Goal
- Reserve
- Project
- Credit
- CreditCard
- Asset
- Liability
- Dashboard
- Person
- Period

---

# Casos de uso previstos

- ReceiveSalary
- RegisterExpense
- RegisterIncome
- TransferMoney
- RegisterSaving
- RegisterInvestment
- RegisterCreditPayment
- RegisterCreditCardPayment
- RegisterInterest
- CloseMonth
- GenerateBudget
- CalculatePatrimony
- CalculateCashFlow
- GenerateDashboard

---

# Flujo del sistema

```
Usuario

↓

Evento Financiero

↓

Motor Financiero

↓

Movimientos Internos

↓

Dashboard

↓

Reportes
```

---

# Estructura del repositorio

```
finance-os/

apps/
    web/

packages/
    domain/
    application/
    database/
    ui/
    shared/

docs/

.github/
```

---

# Roadmap

## Sprint 0

Arquitectura.

---

## Sprint 1

Modelo de datos.

---

## Sprint 2

Motor financiero.

---

## Sprint 3

Presupuesto.

---

## Sprint 4

Dashboard.

---

## Sprint 5

Objetivos financieros.

---

## Sprint 6

Automatizaciones.

---

## Versión 1.0

Aplicación completamente funcional.

---

# Información financiera inicial

## Ingresos

### Salario mensual

Aproximadamente

```
$10.700.000 COP
```

Incluye salario y prestaciones legales.

Ocasionalmente se reciben bonos.

---

# Activos

## Bancos

- Bancolombia (principal)
- Nu Cuenta
- Nu Cajita
- Nequi
- Rappi Cuenta

---

## Efectivo

Aproximadamente

```
$750.000
```

---

## Saldos actuales

### Bancolombia

```
$14.870.000
```

(antes de pagar algunos compromisos del mes)

### Nu Cajita

```
$5.000.000
```

Rentabilidad:

```
8% EA
```

### Rappi

```
$200.000
```

---

## Cesantías

Aproximadamente

```
$24.000.000
```

---

## Vehículo

Mazda 2

Modelo 2017

Valor estimado

```
$50.000.000
```

---

# Pasivos

## Crédito Comfamiliar

Monto inicial

```
$28.934.225
```

Inicio

Febrero 2025

Plazo

60 meses

Cuota

```
$686.522
```

---

## Crédito LuloBank

Monto inicial

```
$22.000.000
```

Saldo aproximado

```
$18.976.064
```

Plazo

48 meses

Cuota aproximada

```
$695.000
```

Actualmente alrededor de la cuota número 11.

---

# Tarjetas

- Tarjeta Nu
- Tarjeta Rappi

Uso habitual:

- Una cuota.
- Tres cuotas únicamente cuando son al 0%.

Objetivo:

Aprovechar beneficios.

No financiar consumo.

---

# Gastos fijos

| Concepto | Valor |
|----------|-------:|
| Arriendo | $950.000 |
| Servicios | $250.000 |
| Internet | $77.900 |
| Ayuda mamá | $500.000 |
| Celular | $46.400 |
| Cuota hijo | $1.500.000 |
| Gimnasio | $65.000 |
| Seguro funerario | $30.400 |
| Seguro vehículo | $517.700 |
| Directv Go | $80.000 |
| Netflix | $30.000 |

---

# Gastos variables presupuestados

| Categoría | Valor |
|-----------|-------:|
| Mercado | $1.200.000 |
| Restaurantes | $500.000 |
| Gasolina | $350.000 |
| Ropa | $200.000 |
| Regalos | $200.000 |

---

# Objetivos financieros

Prioridad alta

- Fondo de emergencia.
- Pagar créditos.
- Viaje a España.
- Iniciar inversiones.

---

# Reservas iniciales

## Fondo de emergencia

Actualmente asociado a:

```
Nu Cajita

$5.000.000
```

---

# Filosofía de reservas

Siempre existirá diferencia entre:

## ¿Dónde está el dinero?

Cuenta.

Ejemplo:

Nu Cajita.

---

## ¿Para qué existe?

Reserva.

Ejemplo:

Fondo de emergencia.

---

# Dashboard esperado

Debe responder preguntas como:

- ¿Cuál es mi patrimonio hoy?
- ¿Cuánto creció este mes?
- ¿Cuál es mi liquidez?
- ¿Cuál es mi flujo de caja?
- ¿Cuánto me falta para el fondo de emergencia?
- ¿Qué porcentaje del presupuesto he consumido?
- ¿Cuánto he pagado de cada crédito?
- ¿Qué porcentaje de mis ingresos ahorro?
- ¿Cuánto dinero destino a ayudar a mi familia?
- ¿Cuál es el costo real de tener mi vehículo?

---

# Experiencia de usuario

El registro de un movimiento debe tomar menos de 15 segundos.

La pantalla principal será el Dashboard.

El botón más importante será:

```
+
Registrar movimiento
```

El usuario registrará únicamente el evento.

El sistema hará el resto automáticamente.

---

# Visión futura

La aplicación deberá ser capaz de generar análisis inteligentes como:

- Evolución del patrimonio.
- Proyección del fondo de emergencia.
- Fecha estimada para terminar créditos.
- Recomendaciones de ahorro.
- Tendencias de gasto.
- Línea del tiempo financiera.
- Comparativos entre años.
- Indicadores financieros personales.

---

# Regla de oro del proyecto

> Construir un software que Felipe quiera seguir usando dentro de 20 años.