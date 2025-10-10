# Sistema de Recomendaciones - Documentación

## 📚 ¿Qué hace este sistema?

Genera recomendaciones personalizadas de libros para cada usuario usando **ChatGPT** y **Google Books API**.

---

## 📁 Archivos del sistema

| Archivo                  | Propósito                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `homeRecs.js`            | **Cerebro principal** - Orquesta todo el algoritmo de recomendaciones              |
| `homeDefaults.js`        | Libros por defecto cuando el usuario es nuevo o ChatGPT falla                      |
| `recommendationCache.js` | Mantiene consistencia: el usuario ve la misma versión del libro en home y búsqueda |
| `preferredBooks.js`      | Prioriza libros con imagen y autor (para que la app se vea bonita)                 |

---

## 🔄 Cómo funciona (flujo simple)

```
1. Usuario abre el home
   ↓
2. ¿Ya generamos recomendaciones antes? (caché)
   → SÍ: Mostrar las mismas (instantáneo) ✅
   → NO: Continuar...
   ↓
3. Obtener gustos del usuario:
   - Favoritos
   - Lecturas con rating ≥3 (le gustaron)
   - Lecturas con rating ≤2 (no le gustaron)
   ↓
4. ¿El usuario tiene datos?
   → NO: Mostrar libros por defecto ("El Principito", "1984", etc.)
   → SÍ: Continuar...
   ↓
5. Enviar a ChatGPT:
   "Este usuario leyó X, Y, Z y le gustaron"
   "No le gustó A, B"
   "Recomiéndame 40 libros (20 + 20)"
   ↓
6. ChatGPT responde: 40 títulos de libros
   ↓
7. Para cada título, buscar en Google Books:
   - Obtener imagen de portada
   - Obtener descripción
   - Obtener categorías, autor, etc.
   ↓
8. Filtrar:
   - Eliminar libros ya leídos
   - Eliminar favoritos
   - Eliminar duplicados
   ↓
9. Seleccionar los 10 mejores de cada lista:
   - Priorizar libros con imagen
   - Priorizar libros con autor
   ↓
10. Guardar en caché (para la próxima vez)
    ↓
11. Mostrar en el home: 10+10 libros con portadas ✨
```

---

## 🎯 Archivos explicados

### **1. `homeRecs.js` - El cerebro**

**Función principal:** `getHomeRecommendations(userId)`

**Lo que hace:**

1. Verifica si ya hay recomendaciones en caché → las retorna inmediatamente
2. Si no hay caché, obtiene los gustos del usuario (favoritos, historial)
3. Envía los gustos a ChatGPT (GPT-4o)
4. ChatGPT recomienda 40 libros (solo títulos)
5. Busca cada libro en Google Books API (en paralelo, 10 a la vez)
6. Filtra libros ya leídos y duplicados
7. Selecciona los 10 mejores con imagen
8. Guarda en caché
9. Retorna 10+10 libros completos

**Funciones clave:**

- `getUserSignals()` - Obtiene favoritos, likes y dislikes del usuario
- `callLLMForPicks()` - Llama a ChatGPT para que recomiende libros
- `processLLMRecommendations()` - Busca cada libro en Google Books y obtiene imágenes
- `selectBestBooks()` - Prioriza libros con imagen sobre los que no tienen

---

### **2. `homeDefaults.js` - Libros por defecto**

**Lo que contiene:**

- Lista de libros clásicos y populares predefinidos
- Se usa cuando el usuario es nuevo (sin favoritos ni historial)
- Se usa cuando ChatGPT falla
- Garantiza que siempre haya algo que mostrar

**Ejemplo:**

```javascript
{
  tePodrianGustar: [
    "El Principito",
    "1984",
    "Cien años de soledad",
    ...
  ]
}
```

---

### **3. `recommendationCache.js` - Consistencia**

**Problema que resuelve:**

Imagina que el home muestra "El Alquimista" con una portada azul.  
Luego el usuario busca "El Alquimista" manualmente.  
Google Books podría devolver una versión con portada verde.  
**Resultado:** El usuario ve dos veces el mismo libro (confusión).

**Solución:**

Cuando se recomienda un libro, se guarda su versión exacta:

```javascript
saveRecommendedVersion("El Alquimista", "Paulo Coelho", {
  volumeId: "ABC123",
  image: "portada-azul.jpg",
  ...
});
```

Cuando el usuario busca después:

```javascript
const cached = getRecommendedVersion("El Alquimista");
// Retorna la versión ABC123 con portada azul
// El usuario ve LA MISMA portada que en el home ✅
```

**Duración:** 24 horas

---

### **4. `preferredBooks.js` - Selector de calidad**

**Lo que hace:**

Cuando Google Books devuelve 5 versiones de "Harry Potter", elige la mejor.

**Criterios (en orden):**

1. ¿Tiene imagen real? → Prioridad alta
2. ¿Tiene autor? → Prioridad media

**Ejemplo:**

```
Resultados de Google Books:
1. "Harry Potter - Resumen" (sin imagen, sin autor) ❌
2. "Harry Potter" (con imagen, con autor) ✅ ← ESTA SE ELIGE
3. "Harry Potter - Guía" (sin imagen, con autor) ⚠️

prioritizeBooksByQuality() → Retorna #2 (la mejor)
```

---

## 🗂️ Dos cachés diferentes

| Caché               | Ubicación                | Duración       | Qué guarda                       |
| ------------------- | ------------------------ | -------------- | -------------------------------- |
| **Recomendaciones** | `homeRecs.js`            | Toda la sesión | 10+10 libros completos           |
| **Versiones**       | `recommendationCache.js` | 24 horas       | Versión específica de cada libro |

**Ejemplo:**

- **Caché 1:** Guarda las recomendaciones completas del usuario 123
- **Caché 2:** Guarda que "El Alquimista" = versión ABC123 con portada azul

---

## 🚀 Endpoints disponibles

| Endpoint                                           | Qué hace                                          |
| -------------------------------------------------- | ------------------------------------------------- |
| `GET /api/recommendations/home?userId={id}`        | Obtiene 10+10 recomendaciones personalizadas      |
| `GET /api/recommendations/local-sales?userId={id}` | Obtiene publicaciones en venta en la misma ciudad |
| `POST /api/recommendations/clear-cache`            | Limpia caché al cerrar sesión                     |

---

## 🛡️ Sistema de seguridad (3 capas)

Para asegurar que **NUNCA** se recomiende un libro ya leído:

1. **CAPA 1:** Filtrado en `processLLMRecommendations` (99% efectivo)
2. **CAPA 2:** Eliminación de duplicados con `removeDuplicates`
3. **CAPA 3:** Validación final con `validateAndCorrectRecommendations` (red de seguridad)

Si un libro inválido se escapa de las capas 1 y 2, la capa 3 lo detecta y reemplaza automáticamente.

---

## ⚙️ Configuración del procesamiento

**Velocidad optimizada:**

- Procesa 10 libros en paralelo al mismo tiempo
- 50ms de delay entre cada libro (evita saturar Google Books)
- 200ms de delay entre cada grupo de 10 libros
- Timeout de 5 segundos por libro

**Resultado:** ~1 segundo para procesar 40 libros (vs 20 segundos secuencial)

---

## 🔧 Variables de entorno necesarias

```env
GOOGLE_BOOKS_API_KEY=tu_google_books_key
OPENAI_API_KEY=tu_openai_key
```

---

## 💡 Estrategias de recomendación

| Estrategia          | Cuándo se usa                 | Descripción                                     |
| ------------------- | ----------------------------- | ----------------------------------------------- |
| `llm+googlebooks`   | Usuario con historial         | ChatGPT analiza → Google Books obtiene imágenes |
| `fallback-defaults` | Usuario nuevo o ChatGPT falla | Libros predefinidos populares                   |

---

## 📝 Notas importantes

- **Caché persistente:** Las recomendaciones NO cambian hasta cerrar sesión (consistencia)
- **ChatGPT modelo:** GPT-4o (el más inteligente para análisis complejo)
- **Procesamiento paralelo:** 10 libros a la vez para velocidad
- **Rate limiting:** Delays controlados para no saturar Google Books API
- **Fallbacks múltiples:** Siempre hay algo que mostrar, nunca falla completamente
