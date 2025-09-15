const { PrismaClient } = require("@prisma/client");

async function testLocalSales() {
  const prisma = new PrismaClient();

  try {
    console.log("🔍 Probando endpoint de publicaciones locales...");

    // 1. Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: 6 },
      select: { ubicacion: true, nombre: true },
    });

    console.log("👤 Usuario encontrado:", user);

    if (!user) {
      console.log("❌ Usuario no encontrado");
      return;
    }

    if (!user.ubicacion) {
      console.log("❌ Usuario sin ubicación");
      return;
    }

    // 2. Buscar publicaciones en la misma ciudad
    const publicaciones = await prisma.publicacion.findMany({
      where: {
        ubicacion: user.ubicacion,
        estado: "activa",
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: {
        fechaCreacion: "desc",
      },
      take: 12,
    });

    console.log(
      `📚 Encontradas ${publicaciones.length} publicaciones en ${user.ubicacion}`
    );

    // 3. Mostrar las publicaciones
    publicaciones.forEach((pub, index) => {
      console.log(
        `${index + 1}. ${pub.titulo} - ${pub.autor} - $${pub.precio} - ${
          pub.ubicacion
        }`
      );
    });

    // 4. Formatear para el frontend
    const resultado = publicaciones.map((pub) => ({
      id: pub.id,
      titulo: pub.titulo,
      autor: pub.autor,
      precio: pub.precio,
      imagenUrl: pub.imagenUrl,
      ubicacion: pub.ubicacion,
      vendedor: {
        id: pub.usuario.id,
        nombre: pub.usuario.nombre,
        apellido: pub.usuario.apellido,
      },
    }));

    console.log("✅ Resultado formateado:", JSON.stringify(resultado, null, 2));
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testLocalSales();
