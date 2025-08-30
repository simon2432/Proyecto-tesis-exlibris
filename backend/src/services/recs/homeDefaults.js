// Defaults para recomendaciones cuando no hay datos del usuario
const HOME_DEFAULTS = {
  tePodrianGustar: [
    {
      volumeId: "PGR2EAAAQBAJ",
      title: "El Señor de los Anillos",
      authors: ["J.R.R. Tolkien"],
      categories: ["Fiction", "Fantasy"],
      description:
        "Una épica aventura de fantasía que ha cautivado a generaciones de lectores.",
      reason: "Clásico de fantasía épica",
    },
    {
      volumeId: "5PQEAAAAMAAJ",
      title: "1984",
      authors: ["George Orwell"],
      categories: ["Fiction", "Dystopian"],
      description:
        "Una distopía clásica que explora temas de vigilancia y control totalitario.",
      reason: "Distopía clásica del siglo XX",
    },
    {
      volumeId: "hFfhrCWiLSMC",
      title: "Cien años de soledad",
      authors: ["Gabriel García Márquez"],
      categories: ["Fiction", "Magical Realism"],
      description:
        "Obra maestra del realismo mágico que narra la historia de la familia Buendía.",
      reason: "Realismo mágico latinoamericano",
    },
    {
      volumeId: "4iMZAAAAYAAJ",
      title: "El Principito",
      authors: ["Antoine de Saint-Exupéry"],
      categories: ["Fiction", "Philosophy"],
      description:
        "Un cuento poético que aborda temas universales como el amor y la amistad.",
      reason: "Fábula filosófica universal",
    },
    {
      volumeId: "7X2lYx8CfjIC",
      title: "Harry Potter y la piedra filosofal",
      authors: ["J.K. Rowling"],
      categories: ["Fiction", "Fantasy"],
      description:
        "El inicio de la saga que introdujo a millones de lectores al mundo de la magia.",
      reason: "Fantasy juvenil contemporánea",
    },
    {
      volumeId: "YwFvEAAAQBAJ",
      title: "Orgullo y prejuicio",
      authors: ["Jane Austen"],
      categories: ["Fiction", "Romance"],
      description:
        "Una comedia romántica que satiriza la sociedad británica del siglo XIX.",
      reason: "Romance clásico británico",
    },
    {
      volumeId: "8iMZAAAAYAAJ",
      title: "El Hobbit",
      authors: ["J.R.R. Tolkien"],
      categories: ["Fiction", "Fantasy"],
      description:
        "Una aventura fantástica que precede a El Señor de los Anillos.",
      reason: "Aventura fantástica preludio",
    },
    {
      volumeId: "9iMZAAAAYAAJ",
      title: "Don Quijote de la Mancha",
      authors: ["Miguel de Cervantes"],
      categories: ["Fiction", "Classic"],
      description:
        "La primera novela moderna que parodia las novelas de caballerías.",
      reason: "Primera novela moderna",
    },
    {
      volumeId: "1iMZAAAAYAAJ",
      title: "Los miserables",
      authors: ["Victor Hugo"],
      categories: ["Fiction", "Historical"],
      description:
        "Una epopeya que retrata la sociedad francesa del siglo XIX.",
      reason: "Epopeya histórica francesa",
    },
    {
      volumeId: "2iMZAAAAYAAJ",
      title: "Madame Bovary",
      authors: ["Gustave Flaubert"],
      categories: ["Fiction", "Realism"],
      description:
        "Una novela realista que critica la sociedad burguesa francesa.",
      reason: "Realismo literario francés",
    },
    {
      volumeId: "3iMZAAAAYAAJ",
      title: "Anna Karenina",
      authors: ["León Tolstói"],
      categories: ["Fiction", "Realism"],
      description:
        "Una tragedia romántica que explora temas de moral y sociedad.",
      reason: "Realismo ruso del siglo XIX",
    },
    {
      volumeId: "4iMZAAAAYAAJ",
      title: "Crimen y castigo",
      authors: ["Fiódor Dostoyevski"],
      categories: ["Fiction", "Psychological"],
      description:
        "Una novela psicológica que explora la culpa y la redención.",
      reason: "Novela psicológica rusa",
    },
  ],
  descubriNuevasLecturas: [
    {
      volumeId: "5iMZAAAAYAAJ",
      title: "El nombre del viento",
      authors: ["Patrick Rothfuss"],
      categories: ["Fiction", "Fantasy"],
      description:
        "Una historia de formación mágica con un sistema de magia único.",
      reason: "Fantasy contemporánea innovadora",
    },
    {
      volumeId: "6iMZAAAAYAAJ",
      title: "La sombra del viento",
      authors: ["Carlos Ruiz Zafón"],
      categories: ["Fiction", "Mystery"],
      description: "Una novela gótica ambientada en la Barcelona de posguerra.",
      reason: "Misterio gótico español",
    },
    {
      volumeId: "7iMZAAAAYAAJ",
      title: "El código Da Vinci",
      authors: ["Dan Brown"],
      categories: ["Fiction", "Thriller"],
      description:
        "Un thriller que combina arte, religión y misterio histórico.",
      reason: "Thriller histórico-artístico",
    },
    {
      volumeId: "8iMZAAAAYAAJ",
      title: "Los juegos del hambre",
      authors: ["Suzanne Collins"],
      categories: ["Fiction", "Young Adult"],
      description: "Una distopía que critica la sociedad del espectáculo.",
      reason: "Distopía juvenil contemporánea",
    },
    {
      volumeId: "9iMZAAAAYAAJ",
      title: "El alquimista",
      authors: ["Paulo Coelho"],
      categories: ["Fiction", "Philosophy"],
      description: "Una fábula sobre la búsqueda del tesoro personal.",
      reason: "Fábula filosófica brasileña",
    },
    {
      volumeId: "10iMZAAAAYAAJ",
      title: "La ladrona de libros",
      authors: ["Markus Zusak"],
      categories: ["Fiction", "Historical"],
      description:
        "Una historia conmovedora narrada por la Muerte durante la Segunda Guerra Mundial.",
      reason: "Narrativa histórica única",
    },
    {
      volumeId: "11iMZAAAAYAAJ",
      title: "El curioso incidente del perro a medianoche",
      authors: ["Mark Haddon"],
      categories: ["Fiction", "Mystery"],
      description:
        "Una novela única narrada desde la perspectiva de un joven con autismo.",
      reason: "Misterio con perspectiva única",
    },
    {
      volumeId: "12iMZAAAAYAAJ",
      title: "La vida de Pi",
      authors: ["Yann Martel"],
      categories: ["Fiction", "Adventure"],
      description:
        "Una historia de supervivencia que cuestiona la realidad y la fe.",
      reason: "Aventura filosófica",
    },
    {
      volumeId: "13iMZAAAAYAAJ",
      title: "El guardián entre el centeno",
      authors: ["J.D. Salinger"],
      categories: ["Fiction", "Coming of Age"],
      description:
        "Un clásico de la literatura juvenil que retrata la alienación adolescente.",
      reason: "Coming of age clásico",
    },
    {
      volumeId: "14iMZAAAAYAAJ",
      title: "Fahrenheit 451",
      authors: ["Ray Bradbury"],
      categories: ["Fiction", "Science Fiction"],
      description:
        "Una distopía que critica la censura y la sociedad del entretenimiento.",
      reason: "Ciencia ficción distópica",
    },
    {
      volumeId: "15iMZAAAAYAAJ",
      title: "El retrato de Dorian Gray",
      authors: ["Oscar Wilde"],
      categories: ["Fiction", "Gothic"],
      description:
        "Una novela gótica que explora temas de belleza, moralidad y decadencia.",
      reason: "Gótico victoriano",
    },
    {
      volumeId: "16iMZAAAAYAAJ",
      title: "Rebelión en la granja",
      authors: ["George Orwell"],
      categories: ["Fiction", "Allegory"],
      description:
        "Una sátira política que critica el totalitarismo a través de una fábula animal.",
      reason: "Alegoría política animal",
    },
  ],
};

// Helper para verificar/actualizar volumeIds válidos de Google Books
const validateGoogleBooksIds = async (ids) => {
  // TODO: Implementar validación real contra Google Books API
  // Por ahora, retornamos los IDs como están
  return ids;
};

// Helper para obtener recomendaciones por defecto
const getDefaultRecommendations = () => {
  return {
    tePodrianGustar: HOME_DEFAULTS.tePodrianGustar,
    descubriNuevasLecturas: HOME_DEFAULTS.descubriNuevasLecturas,
    metadata: {
      strategy: "fallback-defaults",
      generatedAt: new Date().toISOString(),
      shortlistSize: 0,
    },
  };
};

module.exports = {
  HOME_DEFAULTS,
  validateGoogleBooksIds,
  getDefaultRecommendations,
};
