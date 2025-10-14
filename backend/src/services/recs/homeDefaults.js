// Defaults para recomendaciones cuando no hay datos del usuario
const HOME_DEFAULTS = {
  tePodrianGustar: [
    {
      volumeId: "GuLZAAAAMAAJ",
      title: "The Lord of the Rings",
      authors: ["John Ronald Reuel Tolkien"],
      categories: ["Fiction"],
      description:
        "In time for the golden anniversary of the arrival of part one of Tolkien's epic masterpiece on these shore comes a spectacular new edition of \"The Lord of the Rings.\" The text is fully correctedQunder the supervision of Christopher TolkienQto meet the author's exacting wishes, and includes two large-format fold-out maps, a ribbon placemarker, and exceptionally elegant packaging. 0-618-51765-0$100.00 / Houghton Mifflin",
      reason: "Clásico de fantasía épica",
      image:
        "http://books.google.com/books/content?id=GuLZAAAAMAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
    },
    {
      volumeId: "2_zzAAAACAAJ",
      title: "Harry Potter and the Philosopher's Stone",
      authors: ["J. K. Rowling"],
      categories: ["Fiction", "Fantasy"],
      description:
        "An adult edition of the hugely popular book. Find out how Harry discovers his true heritage at Hogwarts School of Wizardry and Witchcraft, the reason behind his parents mysterious death, who is out to kill him, and how he uncovers the most fabled secret of all time.",
      reason: "Fenómeno literario mundial",
      image:
        "http://books.google.com/books/content?id=2_zzAAAACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
    },
    {
      volumeId: "0NEbHGREK7cC",
      title: "To Kill a Mockingbird",
      authors: ["Harper Lee"],
      categories: ["Fiction"],
      description:
        "Harper Lee's classic novel of a lawyer in the Deep South defending a black man charged with the rape of a white girl. One of the best-loved stories of all time, To Kill a Mockingbird has earned many distinctions since its original publication in 1960. It won the Pulitzer Prize, has been translated into more than forty languages, sold more than thirty million copies worldwide, and been made into an enormously popular movie. Most recently, librarians across the country gave the book the highest of honors by voting it the best novel of the twentieth century.",
      reason: "Clásico de la literatura estadounidense",
      image:
        "http://books.google.com/books/content?id=0NEbHGREK7cC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
    },
    {
      volumeId: "iXn5U2IzVH0C",
      title: "The Great Gatsby",
      authors: ["F. Scott Fitzgerald"],
      categories: ["Fiction"],
      description:
        "The only edition of the beloved classic that is authorized by Fitzgerald's family and from his lifelong publisher. This edition is the enduring original text, updated with the author's own revisions, a foreword by his granddaughter, and with a new introduction by National Book Award winner Jesmyn Ward. The Great Gatsby, F. Scott Fitzgerald's third book, stands as the supreme achievement of his career. First published by Scribner in 1925, this quintessential novel of the Jazz Age has been acclaimed by generations of readers. The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan is an exquisitely crafted tale of America in the 1920s.",
      reason: "Obra maestra de F. Scott Fitzgerald",
      image:
        "http://books.google.com/books/content?id=iXn5U2IzVH0C&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
    },
    {
      volumeId: "s1gVAAAAYAAJ",
      title: "Pride and Prejudice",
      authors: ["Jane Austen"],
      categories: ["Courtship", "Romance"],
      description:
        "Austen's most celebrated novel tells the story of Elizabeth Bennet, a bright, lively young woman with four sisters, and a mother determined to marry them to wealthy men. At a party near the Bennets' home in the English countryside, Elizabeth meets the wealthy, proud Fitzwilliam Darcy. Elizabeth initially finds Darcy haughty and intolerable, but circumstances continue to unite the pair. Mr. Darcy finds himself captivated by Elizabeth's wit and candor, while her reservations about his character slowly vanish. The story is as much a social critique as it is a love story, and the prose crackles with Austen's wry wit.",
      reason: "Romance clásico de Jane Austen",
      image:
        "http://books.google.com/books/content?id=s1gVAAAAYAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
    },
    {
      volumeId: "5xTzEAAAQBAJ",
      title: "El Guardian Entre El Centeno (The Catcher In The Rye)",
      authors: ["J.D. Salinger"],
      categories: ["Fiction", "Coming of Age"],
      description:
        'RESUMEN COMPLETO: EL GUARDIAN ENTRE EL CENTENO (THE CATCHER IN THE RYE) - BASADO EN EL LIBRO DE J. D. SALINGER ¿Estás listo para potenciar tu conocimiento sobre "EL GUARDIAN ENTRE EL CENTENO"? ¿Quieres aprender de manera rápida y concisa las lecciones clave de este libro? ¿Estás preparado para procesar la información de todo un libro en tan solo una lectura de aproximadamente 20 minutos? ¿Te gustaría tener una comprensión más profunda de las técnicas y ejercicios del libro original? ¡Entonces este libro es para ti! CONTENIDO DEL LIBRO: Análisis De Los Temas Alienación Falsedad Sexualidad El Dolor De Crecer',
      reason: "Novela icónica sobre la adolescencia",
      image:
        "http://books.google.com/books/content?id=5xTzEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
    },
    {
      volumeId: "Vbb3EAAAQBAJ",
      title: "The Hobbit",
      authors: ["J. R. R. Tolkien"],
      categories: ["Fiction", "Fantasy"],
      description:
        "This is the story of how a Baggins had an adventure, and found himself doing and saying things altogether unexpected… 'A flawless masterpiece' The Times Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life, rarely travelling further than the pantry of his hobbit-hole in Bag End. But his contentment is disturbed when the wizard, Gandalf, and a company of thirteen dwarves arrive on his doorstep one day, to whisk him away on a journey 'there and back again'. They have a plot to raid the treasure hoard of Smaug the Magnificent, a large and very dangerous dragon… The prelude to THE LORD OF THE RINGS, THE HOBBIT has sold many millions of copies since its publication in 1937, establishing itself as one of the most beloved and influential books of the twentieth century.",
      reason: "Aventura fantástica precursora de El Señor de los Anillos",
      image:
        "http://books.google.com/books/content?id=Vbb3EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
    },
    {
      volumeId: "B2hODwAAQBAJ",
      title: "Moby Dick",
      authors: ["Herman Melville"],
      categories: ["Fiction", "Adventure"],
      description:
        "Moby-Dick narra la travesía del barco ballenero Pequod en la obsesiva y autodestructiva persecución de una gran ballena blanca (cachalote) impulsada por el capitán Ahab. Al margen de la persecución y evolución de sus personajes, el tema de la novela es eminentemente enciclopédico al incluir detalladas y extensas descripciones de la caza de las ballenas en el siglo XIX y multitud de otros detalles sobre la vida marinera de la época. Quizá por ello la novela no tuvo ningún éxito comercial en su primera publicación, aunque con posterioridad haya servido para cimentar la reputación del autor y situarlo entre los mejores escritoires estadounidenses.",
      reason: "Épica historia de Herman Melville",
      image:
        "http://books.google.com/books/content?id=B2hODwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
    },
    {
      volumeId: "FLkv8k9EmvgC",
      title: "El ingenioso hidalgo don Quixote de la Mancha",
      authors: ["Miguel de Cervantes Saavedra"],
      categories: ["Fiction", "Classic"],
      description:
        "La primera novela moderna que parodia las novelas de caballerías. Obra cumbre de la literatura española que narra las aventuras de don Quijote y su fiel escudero Sancho Panza.",
      reason: "Obra cumbre de la literatura española",
      image:
        "http://books.google.com/books/content?id=FLkv8k9EmvgC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
    },
    {
      volumeId: "6-pmDwAAQBAJ",
      title: "The Da Vinci Code",
      authors: ["Dan Brown"],
      categories: ["Fiction", "Thriller"],
      description:
        "Robert Langdon menerima telepon misterius yang mengundangnya ke Museum Louvre Paris pada tengah malam. Sesampai di sana, yang ditemui Langdon adalah mayat telanjang sang kurator museum dengan posisi dan tato aneh di perutnya. Langdon terkejut ketika menyadari bahwa teka-teki itu mengarah ke misteri terbesar sepanjang sejarah yang petunjuknya tersembunyi dalam karya-karya Da Vinci. Misteri tentang persaudaraan rahasia yang melibatkan nama-nama besar. Persaudaraan yang menjaga sebuah fakta sejarah yang sangat mengejutkan.",
      reason: "Thriller bestseller internacional",
      image:
        "http://books.google.com/books/content?id=6-pmDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
    },
    {
      volumeId: "xk-p0AEACAAJ",
      title: "Crime and Punishment",
      authors: ["Fyodor Dostoevsky"],
      categories: ["Fiction", "Psychological"],
      description:
        "Crime and Punishment follows the mental anguish and moral dilemmas of Rodion Raskolnikov, an impoverished ex-student in Saint Petersburg who plans to kill an unscrupulous pawnbroker, an old woman who stores money and valuable objects in her flat. He theorises that with the money he could liberate himself from poverty and go on to perform great deeds and seeks to convince himself that certain crimes are justifiable if they are committed in order to remove obstacles to the higher goals of 'extraordinary' men. Once the deed is done, however, he finds himself wracked with confusion, paranoia, and disgust.",
      reason: "Obra maestra de Dostoievski",
      image:
        "http://books.google.com/books/content?id=xk-p0AEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
    },
    {
      volumeId: "a_VhRBaET1sC",
      title: "Jane Eyre",
      authors: ["Charlotte Brontë"],
      categories: ["Fiction", "Romance"],
      description:
        "Una de las novelas más queridas de la literatura inglesa. La historia de Jane Eyre, una institutriz que se enamora de su empleador, el misterioso Sr. Rochester. Una historia de amor, independencia y moralidad que ha cautivado a lectores durante generaciones.",
      reason: "Clásico romántico de Charlotte Brontë",
      image:
        "http://books.google.com/books/content?id=a_VhRBaET1sC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
    },
  ],
  descubriNuevasLecturas: [
    {
      volumeId: "Sz2_6vTrMBIC",
      title: "The Chronicles of Narnia",
      authors: ["Clive Staples Lewis"],
      categories: ["Fiction", "Fantasy"],
      description:
        "Journeys to the end of the world, fantastic creatures and epic battles between good and evil. Una serie mágica que transporta a los lectores a través de un armario hacia un mundo de fantasía lleno de aventuras inolvidables.",
      reason: "Serie fantástica de C.S. Lewis",
      image:
        "http://books.google.com/books/content?id=Sz2_6vTrMBIC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
    },
    {
      volumeId: "w9A98UIGNMAC",
      title: "The Picture of Dorian Gray",
      authors: ["Oscar Wilde"],
      categories: ["Fiction", "Gothic"],
      description:
        "Una novela gótica que explora temas de belleza, moralidad y decadencia. La historia de un joven que vende su alma para mantener su juventud mientras su retrato envejece en su lugar.",
      reason: "Novela filosófica de Oscar Wilde",
      image:
        "http://books.google.com/books/content?id=w9A98UIGNMAC&printsec=frontcover&img=1&zoom=1&source=gbs_api",
    },
    {
      volumeId: "wW4wOB0EYKoC",
      title: "Frankenstein o el prometeo moderno",
      authors: ["Mary Wollstonecraft Shelley"],
      categories: ["Fiction", "Gothic"],
      description:
        "La historia del científico Victor Frankenstein y su creación monstruosa. Una reflexión profunda sobre la ciencia, la responsabilidad y la naturaleza humana que ha influenciado la literatura de terror y ciencia ficción.",
      reason: "Clásico de terror gótico de Mary Shelley",
      image:
        "http://books.google.com/books/content?id=wW4wOB0EYKoC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
    },
    {
      volumeId: "UqYt6JWab0IC",
      title: "Dracula",
      authors: ["Bram Stoker"],
      categories: ["Fiction", "Horror"],
      description:
        "La novela definitiva de vampiros que estableció el género. La historia del conde Drácula y su llegada a Inglaterra, contada a través de cartas y diarios que crean una atmósfera de terror inolvidable.",
      reason: "Novela de vampiros icónica de Bram Stoker",
      image:
        "http://books.google.com/books/content?id=UqYt6JWab0IC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
    },
    {
      volumeId: "_zSzAwAAQBAJ",
      title: "The Hunger Games",
      authors: ["Suzanne Collins"],
      categories: ["Fiction", "Dystopian"],
      description:
        "First in the ground-breaking HUNGER GAMES trilogy. In a vision of the near future, a terrifying reality TV show is taking place. Twelve boys and twelve girls are forced to appear in a live event called The Hunger Games. There is only one rule: kill or be killed. But Katniss has been close to death before. For her, survival is second nature.",
      reason: "Bestseller distópico juvenil",
      image:
        "http://books.google.com/books/content?id=_zSzAwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
    },
    {
      volumeId: "c9A_EQAAQBAJ",
      title: "The Alchemist",
      authors: ["Paulo Coelho"],
      categories: ["Fiction", "Philosophy"],
      description:
        "Una fábula sobre la búsqueda del tesoro personal. La historia de Santiago, un pastor andaluz que viaja desde España hasta las pirámides de Egipto en busca de su Leyenda Personal. Un libro inspirador sobre seguir tus sueños.",
      reason: "Bestseller de Paulo Coelho",
      image:
        "http://books.google.com/books/content?id=c9A_EQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
    },
    {
      volumeId: "IeBVbSw71JAC",
      title: "Brave New World",
      authors: ["Aldous Huxley"],
      categories: ["Fiction", "Science Fiction"],
      description:
        "Una distopía visionaria que critica la sociedad del entretenimiento y el control social. Un mundo donde la felicidad es obligatoria pero la libertad ha sido sacrificada. Una obra maestra de la ciencia ficción que sigue siendo relevante hoy.",
      reason: "Distopía visionaria de Aldous Huxley",
      image:
        "http://books.google.com/books/content?id=IeBVbSw71JAC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
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
