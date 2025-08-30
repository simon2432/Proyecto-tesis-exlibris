# Sistema de Recomendaciones - Exlibris

## Descripción

Este sistema proporciona recomendaciones personalizadas de libros para el home de la aplicación Exlibris, utilizando una combinación de:

- **Señales del usuario**: Favoritos, historial de lecturas con ratings
- **Google Books API**: Para buscar candidatos de libros
- **OpenAI GPT-3.5**: Para seleccionar las mejores recomendaciones
- **Algoritmos de fallback**: Cuando las APIs externas no están disponibles

## Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   APIs Externas │
│                 │    │                  │    │                 │
│ - Home Screen   │───▶│ - Controller     │───▶│ - Google Books  │
│ - User Profile  │    │ - Service Layer  │    │ - OpenAI        │
└─────────────────┘    │ - Cache          │    └─────────────────┘
                       └──────────────────┘
```

## Endpoints

### GET `/api/recommendations/home?userId={userId}`

Obtiene recomendaciones personalizadas para el home del usuario.

**Query Parameters:**

- `userId` (required): ID del usuario

**Response:**

```json
{
  "tePodrianGustar": [
    {
      "volumeId": "string",
      "title": "string",
      "authors": ["string"],
      "categories": ["string"],
      "reason": "string"
    }
  ],
  "descubriNuevasLecturas": [...],
  "metadata": {
    "userId": "string",
    "generatedAt": "string",
    "strategy": "llm+shortlist" | "fallback-defaults" | "fallback-local",
    "shortlistSize": number
  }
}
```

### POST `/api/recommendations/invalidate`

Invalida el cache de recomendaciones para un usuario específico.

**Body:**

```json
{
  "userId": "string"
}
```

### GET `/api/recommendations/health`

Endpoint de salud para verificar el estado del servicio.

## Estrategias de Recomendación

### 1. LLM + Shortlist (Estrategia Principal)

- Genera shortlist de 60-150 candidatos usando Google Books API
- Usa ChatGPT para seleccionar 12+12 libros basándose en señales del usuario
- Prompt estructurado que garantiza JSON válido

### 2. Fallback Local

- Algoritmo de scoring basado en afinidad autor/categoría
- MMR (Maximal Marginal Relevance) para diversidad en la segunda lista
- λ = 0.7 (balance entre relevancia y diversidad)

### 3. Fallback Defaults

- Listas predefinidas de libros populares y variados
- Cubre ficción/no ficción, distintos géneros, clásicos y contemporáneos

## Flujo de Datos

1. **Obtener Señales del Usuario**

   - Top 3 favoritos
   - Historial de lecturas (LIKES: rating ≥ 3, DISLIKES: rating ≤ 2)

2. **Generar Shortlist**

   - Búsquedas por autor, categoría, palabras clave del título
   - Filtrado de duplicados y libros ya leídos
   - Límite máximo de 120 candidatos

3. **Selección con LLM**

   - Prompt estructurado para ChatGPT
   - Validación de respuesta JSON
   - Reintento con prompt de corrección si falla

4. **Validación y Cache**
   - Verificación de estructura y conteo (12+12)
   - Cache por 24 horas
   - Invalidación automática al cambiar favoritos o rating ≥ 4

## Variables de Entorno

```bash
# OpenAI API Key (para ChatGPT)
OPENAI_API_KEY=sk-your-key-here

# Google Books API Key
GOOGLE_BOOKS_API_KEY=your-key-here

# Environment
NODE_ENV=development
```

## Cache

- **Duración**: 24 horas
- **Invalidación**: Manual o automática
- **Almacenamiento**: Memoria (en producción usar Redis)

## Manejo de Errores

- **Timeout**: 30 segundos para APIs externas
- **Fallbacks**: Múltiples niveles de degradación
- **Logging**: Nivel DEBUG para decisiones del sistema
- **Validación**: Estructura JSON y conteo exacto

## Testing

### Casos de Prueba

1. **Sin datos del usuario** → Defaults
2. **Solo favoritos** → 12+12 recomendaciones
3. **Con historial completo** → No recomendar duplicados
4. **LIKES vs DISLIKES** → Evitar similitudes con dislikes

### Endpoints de Prueba

```bash
# Health check
curl http://localhost:3000/api/recommendations/health

# Recomendaciones para usuario 1
curl "http://localhost:3000/api/recommendations/home?userId=1"

# Invalidar cache
curl -X POST http://localhost:3000/api/recommendations/invalidate \
  -H "Content-Type: application/json" \
  -d '{"userId": "1"}'
```

## Monitoreo

- **Métricas**: Tiempo de respuesta, tasa de éxito por estrategia
- **Logs**: Decisiones del sistema, errores de APIs externas
- **Health Checks**: Estado de dependencias (OpenAI, Google Books)

## Consideraciones de Producción

1. **Rate Limiting**: Implementar para APIs externas
2. **Redis**: Reemplazar cache en memoria
3. **Monitoring**: APM, métricas de negocio
4. **A/B Testing**: Comparar estrategias de recomendación
5. **Personalización**: Ajustar parámetros por usuario
