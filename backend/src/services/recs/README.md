# Sistema de Recomendaciones - Home

## Descripción

Sistema inteligente de recomendaciones de libros para la pantalla de inicio, que combina señales del usuario con IA (ChatGPT) y fallbacks locales.

## Características del Caché

### 🚀 **Caché Persistente por Sesión**

- **Duración**: `Infinity` - Las recomendaciones se mantienen hasta que se invaliden explícitamente
- **Persistencia**: Mientras el usuario esté logueado, verá las mismas recomendaciones
- **Invalidación**: Solo se regeneran cuando el usuario se desloguea y vuelve a entrar

### 📊 **Endpoints de Caché**

#### `GET /api/recommendations/cache-status?userId={userId}`

Verifica el estado del caché sin invalidarlo:

```json
{
  "userId": "123",
  "hasCache": true,
  "timestamp": 1703123456789,
  "age": "2h 15m",
  "strategy": "llm+shortlist",
  "tePodrianGustar": 12,
  "descubriNuevasLecturas": 12,
  "message": "Caché válido con 12 + 12 libros"
}
```

#### `POST /api/recommendations/invalidate`

Invalida el caché para regenerar recomendaciones:

```json
{
  "userId": "123"
}
```

### 🔄 **Flujo de Caché**

1. **Primera visita**: Se generan recomendaciones y se cachean
2. **Visitas posteriores**: Se usan las recomendaciones del caché
3. **Navegación**: Entre home, perfil, etc. - **MISMAS recomendaciones**
4. **Deslogueo**: Se invalida el caché
5. **Relogueo**: Se generan nuevas recomendaciones

### 🛡️ **Validaciones del Caché**

- **Integridad**: Se verifica que tenga exactamente 12+12 libros
- **Corrupción**: Si el caché está corrupto, se regenera automáticamente
- **Logging**: Se registra cada hit/miss del caché

## Uso del Frontend

### **Para mantener recomendaciones consistentes:**

```typescript
// NO llamar a /api/recommendations/home en cada navegación
// Solo llamar cuando:
// 1. Usuario entra por primera vez
// 2. Usuario se reloguea
// 3. Se necesita refrescar explícitamente
```

### **Para invalidar al desloguear:**

```typescript
// Al hacer logout
await fetch("/api/recommendations/invalidate", {
  method: "POST",
  body: JSON.stringify({ userId: currentUserId }),
});
```

## Logs del Sistema

### **Caché Hit:**

```
[Cache] Hit para usuario 123, usando cache existente
[Cache] Cache generado: 12/21/2024, 3:45:30 PM
[Cache] Estrategia usada: llm+shortlist
[Cache] Caché válido: 12 + 12 libros
```

### **Caché Miss:**

```
[Cache] Miss para usuario 123, generando nuevas recomendaciones
```

### **Invalidación:**

```
[Cache] Invalidando caché para usuario 123
[Cache] Caché existía desde: 12/21/2024, 3:45:30 PM
[Cache] Estrategia usada: llm+shortlist
[Cache] Caché invalidado para usuario 123 (relogear)
[Cache] El usuario verá nuevas recomendaciones en su próxima visita
```

## Beneficios

✅ **Consistencia**: Mismas recomendaciones durante toda la sesión  
✅ **Performance**: No se regeneran en cada navegación  
✅ **UX**: Experiencia predecible para el usuario  
✅ **Control**: Solo se regeneran cuando es necesario  
✅ **Debugging**: Logs detallados para monitoreo
