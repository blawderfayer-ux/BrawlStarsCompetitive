# BrawlStarsCompetitive

Plataforma web **mobile-first** para organizar torneos 3v3 de Brawl Stars. La página es la fuente oficial del torneo:
equipos, bracket, rival, modo y mapa de cada game, resultados y eliminaciones. Brawl Stars sigue siendo donde se
juega; la plataforma organiza la competición.

> Proyecto independiente, no afiliado a Supercell.

## Qué incluye

**Jugadores (sin cuenta, desde el celular)**
- Inscripción del equipo: nombre, logo, color, capitán + 2 jugadores con su tag, suplente opcional y contacto.
- Enlace privado para ver el estado de la inscripción (PENDIENTE / APROBADO / REQUIERE CORRECCIÓN) y corregirla.
- Página del torneo: Inicio, Equipos, Bracket, Partidas, Resultados y Reglas.
- “Partida en curso” con marcador y mapa actual, “Mi equipo” con la próxima partida, y avisos en vivo
  (“¡Team Alpha avanza a semifinales!”).
- Bracket por ronda (cómodo en el celular) o cuadro completo con líneas.

**Organización (admin y árbitros)**
- Crear torneos (múltiples), configurar fecha, máximo de equipos, BO1/BO3/BO5/BO7 (también por ronda) y reglamento.
- Revisar inscripciones: aprobar, rechazar, pedir corrección, editar, asignar seeds.
- **Generar el bracket automáticamente** (eliminación simple, con BYE si los equipos no son potencia de 2).
- Plan oficial de **modo y mapa por game** para cada ronda (sin repetir modo en una serie), editable por ronda o por
  partida. Pool de mapas por torneo.
- Registrar resultados game por game: la serie se cierra sola, el perdedor queda ELIMINADO y el ganador avanza.
- Estados de partida (pendiente, en curso, resultado pendiente, disputada, cancelada), reprogramar, deshacer el
  último game, reiniciar serie, walkover, descalificar equipos.
- Historial de auditoría: quién hizo qué y cuándo.
- Catálogo editable de modos y mapas (viene cargado con los mapas 2026 en español; modos y mapas al azar por partida) y gestión del staff.

## Tecnología

- **Next.js 16** (App Router, Server Components y Server Actions) + **Tailwind CSS 4**
- **MongoDB** con Mongoose (pensado para **MongoDB Atlas**, plan gratuito M0)
- Sesión del staff con cookie firmada (`jose`) y contraseñas con `bcryptjs`
- Tests del motor del bracket con **Vitest**

## Puesta en marcha

### 1. Crear la base en MongoDB Atlas (gratis)

1. Entra a [cloud.mongodb.com](https://cloud.mongodb.com) y crea un cluster **M0 (Free)**.
2. **Database Access** → crea un usuario con contraseña.
3. **Network Access** → agrega `0.0.0.0/0` (necesario para Vercel).
4. **Connect → Drivers** → copia la cadena `mongodb+srv://...`.

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Completa `MONGODB_URI` y `SESSION_SECRET` (genera uno con
`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`).

### 3. Instalar, cargar datos iniciales y arrancar

```bash
npm install
ADMIN_EMAIL=tu@correo.com ADMIN_PASSWORD=unaClaveSegura ADMIN_NAME="Tu nombre" npm run seed
npm run dev
```

- Público: http://localhost:3000
- Panel: http://localhost:3000/admin

El `seed` carga los 6 modos 3v3 y sus mapas 2026 en español y crea el primer administrador. Se puede volver a
ejecutar sin duplicar nada.

### 4. Publicar en Vercel

1. Importa el repositorio en [vercel.com/new](https://vercel.com/new).
2. En **Environment Variables** agrega `MONGODB_URI` y `SESSION_SECRET` (y opcionalmente `MONGODB_DB`,
   `NEXT_PUBLIC_TIMEZONE`, `TOURNAMENT_UTC_OFFSET`).
3. Deploy.
4. Entra a `https://tu-sitio.vercel.app/admin`: como la base está vacía, aparece la **configuración inicial** para
   crear el administrador principal (y se cargan los modos y mapas). Hazlo apenas publiques: esa pantalla se bloquea
   en cuanto existe el primer usuario.

> Alternativa sin navegador: `npm run seed` desde tu computadora (paso 3).

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm test` | Tests del motor del bracket (Vitest) |
| `npm run lint` / `npm run typecheck` | ESLint y TypeScript |
| `npm run seed` | Carga modos/mapas y crea el primer admin |

## Arquitectura

```
src/
  lib/bracket/        Motor del torneo, puro y testeado (sin base de datos):
                      siembra, BYE, series BOx, avance, walkover, correcciones, plan de mapas
  lib/services/       Casos de uso que escriben en MongoDB dentro de transacciones
  lib/queries.ts      Lecturas para las páginas (objetos planos)
  models/             Esquemas de Mongoose
  app/torneos/…       Páginas públicas
  app/admin/…         Panel (admin y árbitros) + server actions
  components/         UI compartida (tarjetas, bracket, formularios)
```

### Modelo de datos

| Colección | Descripción |
| --- | --- |
| `tournaments` | Configuración, estado, pool de mapas, plan de mapas por ronda, campeón |
| `teams` | Inscripción de un equipo en un torneo: jugadores embebidos, estado de inscripción y de competición |
| `teamlogos` | Logos (separados para no inflar las consultas) |
| `series` | Un enfrentamiento A vs B (BO1/BO3/BO5) con sus **games embebidos** (modo, mapa, ganador) y el enlace a la siguiente serie del bracket |
| `tournamentevents` | Historial / auditoría / notificaciones |
| `gamemodes`, `gamemaps` | Catálogo editable |
| `users` | Staff: `admin` o `referee` |

**Serie ≠ game:** “Team A vs Team B” es una serie; cada mapa jugado es un game dentro de ella. El marcador de la serie
(p. ej. 2-1) se calcula de sus games.

### Estados

- **Torneo:** borrador → inscripciones abiertas → inscripciones cerradas → en curso → finalizado (o cancelado).
- **Inscripción:** pendiente, requiere corrección, aprobado, rechazado, retirado.
- **Competición del equipo:** inscrito, activo, eliminado, descalificado, campeón (“en partida” se deriva de la serie en curso).
- **Serie:** por definir, pendiente, en curso, resultado pendiente, disputada, finalizada, cancelada.

### Bracket y BYE

El tamaño del cuadro es la potencia de 2 igual o mayor a la cantidad de equipos. Se usa el orden estándar de siembra
(1 vs 16, 8 vs 9, …), así los BYE caen siempre en los mejores seeds y nunca hay BYE contra BYE. Ejemplo: 12 equipos →
cuadro de 16 → 4 BYE → los seeds 1-4 pasan directo a cuartos.

### Seguridad e integridad

- Los jugadores no tienen cuenta: solo pueden inscribirse y consultar. Toda escritura del torneo pasa por server
  actions que verifican el rol en el servidor.
- Los resultados se guardan en una transacción: nunca queda una serie cerrada sin que el ganador avance.
- Una corrección solo se permite si la siguiente partida del ganador aún no empezó.
- Inscripción con trampa anti-bots y límite por conexión; el enlace del capitán es un token aleatorio (se guarda solo su hash).

## Próximos pasos previstos

- Draft de mapas y brawlers (picks, bans, global/visible match bans): la arquitectura ya lo contempla.
- Doble eliminación y round robin.
- Staff por torneo, notificaciones push, validación de tags con la API oficial de Brawl Stars.
