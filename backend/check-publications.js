const { PrismaClient } = require("@prisma/client");

async function checkPublications() {
  const prisma = new PrismaClient();

  try {
    console.log("🔍 Verificando publicaciones en la base de datos...");

    // Verificar todas las publicaciones
    const todasLasPublicaciones = await prisma.publicacion.findMany({
      select: {
        id: true,
        titulo: true,
        ubicacion: true,
        estado: true,
        fechaCreacion: true,
      },
    });

    console.log(`📚 Total publicaciones: ${todasLasPublicaciones.length}`);
    todasLasPublicaciones.forEach((pub, index) => {
      console.log(
        `${index + 1}. ${pub.titulo} - ${pub.ubicacion} - ${pub.estado}`
      );
    });

    // Verificar usuarios
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        nombre: true,
        ubicacion: true,
      },
    });

    console.log(`\n👥 Total usuarios: ${usuarios.length}`);
    usuarios.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nombre} - ${user.ubicacion}`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPublications();
