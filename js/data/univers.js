// =============================================================================
//  L'UNIVERS DU JEU : Expédition Gombessa
//  Personnages, paliers de plongée, expéditions bonus, compétences, rangs,
//  avatars, thèmes, badges, espèces du carnet de bord, prologue et épilogue.
//  Tout est modifiable (textes, seuils…).
// =============================================================================
window.BNL = window.BNL || {};

// L'équipage et les autres personnages (dessins : js/ui/persos.js).
BNL.PERSONNAGES = {
  cap:      { nom: "Capitaine Sel", role: "capitaine de la Luciole", couleur: "#1d3c78" },
  bolt:     { nom: "Bolt", role: "mécano", couleur: "#c4501a" },
  nour:     { nom: "Dr Nour", role: "biologiste", couleur: "#0f6f6a" },
  luci:     { nom: "LUCI", role: "IA de bord", couleur: "#0f8f86" },
  huit:     { nom: "Huit", role: "poulpe clandestin", couleur: "#b84a2a" },
  vex:      { nom: "Vex", role: "pilote", couleur: "#6b3fd6" },
  orsa:     { nom: "Orsa Kell", role: "directrice d'Abyssal Collection", couleur: "#a3202f" },
  gombessa: { nom: "Le Gombessa", role: "cœlacanthe", couleur: "#3d5f96" },
  narration: { nom: "", role: "", couleur: "#5b6b78" },
  journal:  { nom: "", role: "", couleur: "#5b6b78" },
};

// Les 7 compétences travaillées. Chaque mission en vise une.
BNL.COMPETENCES = {
  reperer:    { nom: "Repérer",    icone: "🔍", aide: "Trouver un élément, une ligne, une erreur." },
  comprendre: { nom: "Comprendre", icone: "💡", aide: "Prévoir ce que fait un programme sans le lancer." },
  expliquer:  { nom: "Expliquer",  icone: "💬", aide: "Dire avec des mots ce que fait une instruction." },
  completer:  { nom: "Compléter",  icone: "🧩", aide: "Remplir les trous d'un programme." },
  corriger:   { nom: "Corriger",   icone: "🔧", aide: "Réparer un programme qui ne marche pas." },
  concevoir:  { nom: "Concevoir",  icone: "📐", aide: "Organiser les étapes d'un algorithme." },
  ecrire:     { nom: "Écrire",     icone: "✍️", aide: "Écrire soi-même du code Python." },
};

// Chapitres : les 7 paliers de la descente (parcours principal) puis les expéditions bonus.
// prof : profondeur affichée. carte : espèce débloquée dans le carnet de bord.
BNL.CHAPITRES = [
  { id: "p0", titre: "Le hangar", theme: "Les listes", prof: 0, carte: "poulpe", bonus: false },
  { id: "p1", titre: "L'herbier", theme: "Parcourir une liste", prof: 3, carte: "dugong", bonus: false },
  { id: "p2", titre: "Le récif", theme: "Les dictionnaires", prof: 12, carte: "nudibranche", bonus: false },
  { id: "p3", titre: "La passe", theme: "Parcourir et filtrer", prof: 30, carte: "manta", bonus: false },
  { id: "p4", titre: "Le tombant", theme: "L'algorithme du maximum", prof: 80, carte: "dauphin", bonus: false },
  { id: "p5", titre: "La zone crépusculaire", theme: "Maximum et position", prof: 200, carte: "lumieres", bonus: false },
  { id: "p6", titre: "Les grottes du Gombessa", theme: "Compter et synthèse", prof: 250, carte: "coelacanthe", bonus: false },
  { id: "e1", titre: "Le lac Dziani", theme: "Listes, niveau 2", carte: "stromatolithes", bonus: true },
  { id: "e2", titre: "Le grand recensement", theme: "Tableaux et dictionnaires de dictionnaires", carte: "barriere", bonus: true },
  { id: "e3", titre: "Le chant des baleines", theme: "Tuples, grilles et modulo", carte: "baleine", bonus: true },
  { id: "e4", titre: "Les plages des tortues", theme: "Dictionnaires de tuples", carte: "tortue", bonus: true },
  { id: "e5", titre: "Retour à la mangrove", theme: "Défis d'expert", carte: "mangrove", bonus: true },
];

// Carnet de bord : une espèce (ou une merveille) par chapitre terminé.
// Faits vérifiés : Parc naturel marin de Mayotte (OFB), Futura-Sciences, Mayotte Hebdo,
// ANR (lac Dziani), Sci.News (âge du cœlacanthe), site Gombessa.
BNL.ESPECES = {
  poulpe: { nom: "Poulpe de jour", latin: "Octopus cyanea", faits: [
    "Il change de couleur et de texture en un clin d'œil pour se cacher.",
    "Environ les deux tiers de ses neurones sont dans ses bras : chaque bras « réfléchit » un peu tout seul.",
    "Il se construit des abris avec des coquillages et des morceaux de corail. S'il a peur, il crache de l'encre.",
  ] },
  dugong: { nom: "Dugong", latin: "Dugong dugon", faits: [
    "C'est un mammifère marin herbivore : il broute les herbiers sous-marins.",
    "À Mayotte, il en reste moins de 10. C'est l'un des animaux les plus menacés du lagon.",
    "Les herbiers de Mayotte couvrent environ 700 hectares. Ils nourrissent aussi les tortues vertes.",
  ] },
  nudibranche: { nom: "Nudibranche", latin: "limace de mer", faits: [
    "C'est une limace de mer sans coquille. Son nom veut dire « branchies nues » : on voit ses branchies sur son dos.",
    "Ses couleurs vives préviennent les prédateurs : « Attention, je ne suis pas bon à manger ! »",
    "Ses deux « cornes » s'appellent des rhinophores. Elles lui servent à sentir l'eau.",
  ] },
  manta: { nom: "Raie manta", latin: "Mobula alfredi", faits: [
    "Son envergure peut dépasser 4 mètres.",
    "Elle se fait nettoyer par de petits poissons, dans des « stations de nettoyage » du récif.",
    "Les taches sous son ventre sont uniques : elles permettent de reconnaître chaque raie.",
  ] },
  dauphin: { nom: "Grand dauphin de l'Indo-Pacifique", latin: "Tursiops aduncus", faits: [
    "Une vingtaine d'espèces de dauphins et de baleines fréquentent les eaux de Mayotte.",
    "Le grand dauphin de l'Indo-Pacifique vit près des côtes : on en compte moins de 100 à Mayotte.",
    "Les dauphins communiquent avec des sifflements.",
  ] },
  lumieres: { nom: "Les lumières vivantes", latin: "bioluminescence", faits: [
    "Vers 200 mètres de profondeur, la lumière du soleil a presque disparu.",
    "Beaucoup d'animaux y fabriquent leur propre lumière : c'est la bioluminescence.",
    "Ils s'en servent pour se cacher, attirer leurs proies ou communiquer.",
  ] },
  coelacanthe: { nom: "Cœlacanthe, ou gombessa", latin: "Latimeria chalumnae", faits: [
    "On le connaissait par des fossiles de plus de 400 millions d'années, et on le croyait disparu… jusqu'en 1938.",
    "Aux Comores, on l'appelle gombessa. Il vit entre 150 et 700 mètres de profondeur, sur des pentes volcaniques très raides.",
    "Il peut mesurer près de 2 mètres et vivre environ 100 ans. Il est protégé : on l'observe sans le déranger.",
  ] },
  stromatolithes: { nom: "Les bâtisseurs du lac Dziani", latin: "micro-organismes et stromatolithes", faits: [
    "Le lac Dziani Dzaha est un lac de cratère de Petite-Terre. Son nom veut dire « lac de cratère » en shimaoré.",
    "Son eau est salée, et il n'y a plus d'oxygène sous 1,5 mètre de profondeur. La vie y est surtout microscopique.",
    "Ces micro-organismes construisent des roches. Les scientifiques étudient le lac pour comprendre les océans d'il y a plus de deux milliards d'années.",
  ] },
  barriere: { nom: "La double barrière de corail", latin: "récif corallien", faits: [
    "Le lagon de Mayotte mesure plus de 1 000 km². Une barrière de corail d'environ 160 km le ferme.",
    "Par endroits, il y a même une deuxième barrière. Les doubles barrières sont très rares : une dizaine dans le monde.",
    "Les passes sont des ouvertures dans la barrière : l'eau et les animaux entrent et sortent du lagon par là.",
  ] },
  baleine: { nom: "Baleine à bosse", latin: "Megaptera novaeangliae", faits: [
    "De juillet à fin octobre, des baleines à bosse arrivent de l'Antarctique pour mettre bas et allaiter leurs petits.",
    "Pendant leur séjour, elles ne mangent presque pas : elles vivent sur leurs réserves.",
    "Les mâles chantent des chants longs et complexes, répétés en boucle.",
  ] },
  tortue: { nom: "Tortue verte", latin: "Chelonia mydas", faits: [
    "Cinq espèces de tortues marines fréquentent Mayotte.",
    "La tortue verte et la tortue imbriquée pondent sur environ deux tiers des plages de l'île.",
    "Adulte, la tortue verte est herbivore : elle broute les herbiers.",
  ] },
  mangrove: { nom: "La mangrove", latin: "palétuviers", faits: [
    "Les palétuviers poussent les pieds dans l'eau salée, sur des racines en forme d'échasses.",
    "La mangrove protège la côte des vagues et sert de nurserie aux jeunes poissons.",
    "À Mayotte, elle couvre environ 700 hectares.",
  ] },
};

// Rangs dans l'équipage (selon l'XP gagnée).
BNL.RANGS = [
  { xp: 0,    nom: "Recrue", emoji: "🫧" },
  { xp: 150,  nom: "Vigie", emoji: "🔭" },
  { xp: 450,  nom: "Pilote", emoji: "🧭" },
  { xp: 900,  nom: "Cartographe", emoji: "🗺️" },
  { xp: 1600, nom: "Second du bord", emoji: "⚓" },
  { xp: 2600, nom: "Légende des abysses", emoji: "🌊" },
  { xp: 3800, nom: "Esprit des profondeurs", emoji: "✨" },
];

// Emblèmes (avatars). cond(s) : condition de déblocage.
BNL.AVATARS = [
  { id: "poisson", emoji: "🐠", nom: "Poisson tropical", aide: "Disponible dès le début" },
  { id: "globe", emoji: "🐡", nom: "Poisson-globe", aide: "Disponible dès le début" },
  { id: "crabe", emoji: "🦀", nom: "Crabe", aide: "Disponible dès le début" },
  { id: "coquillage", emoji: "🐚", nom: "Coquillage", aide: "Disponible dès le début" },
  { id: "crevette", emoji: "🦐", nom: "Crevette", aide: "Allume la balise du hangar", cond: (s) => s.chapitreFini("p0") },
  { id: "poulpe", emoji: "🐙", nom: "Poulpe", aide: "Allume la balise de l'herbier", cond: (s) => s.chapitreFini("p1") },
  { id: "tortue", emoji: "🐢", nom: "Tortue", aide: "Allume la balise du récif", cond: (s) => s.chapitreFini("p2") },
  { id: "dauphin", emoji: "🐬", nom: "Dauphin", aide: "Allume la balise du tombant", cond: (s) => s.chapitreFini("p4") },
  { id: "calmar", emoji: "🦑", nom: "Calmar", aide: "Corrige le scanner en panne", cond: (s) => s.reussie("m08") },
  { id: "requin", emoji: "🦈", nom: "Requin de récif", aide: "Réussis 5 missions sans indice", cond: (s) => s.nbSansIndice() >= 5 },
  { id: "homard", emoji: "🦞", nom: "Langouste", aide: "Teste du code dans le bac à sable", cond: (s) => (s.stats.bacasable || 0) >= 1 },
  { id: "gombessa", emoji: "🐟", nom: "Gombessa", aide: "Rencontre le Gombessa", cond: (s) => s.reussie("m13") },
  { id: "baleine", emoji: "🐋", nom: "Baleine", aide: "Termine « Le chant des baleines »", cond: (s) => s.chapitreFini("e3") },
  { id: "souffle", emoji: "🐳", nom: "Baleine qui souffle", aide: "Atteins le rang Légende des abysses", cond: (s) => s.xp() >= 2600 },
  { id: "etoile", emoji: "🌟", nom: "Étoile", aide: "Termine toutes les missions", cond: (s) => s.toutFini() },
];

// Thèmes de l'interface et de l'éditeur.
BNL.THEMES = [
  { id: "lagon", nom: "Lagon", ace: "tomorrow", sombre: false, aide: "Thème de départ" },
  { id: "herbier", nom: "Herbier", ace: "solarized_light", sombre: false, aide: "Allume la balise de l'herbier", cond: (s) => s.chapitreFini("p1") },
  { id: "abysses", nom: "Abysses", ace: "nord_dark", sombre: true, aide: "Allume la balise du récif", cond: (s) => s.chapitreFini("p2") },
  { id: "nudibranche", nom: "Nudibranche", ace: "dawn", sombre: false, aide: "Allume la balise de la passe", cond: (s) => s.chapitreFini("p3") },
  { id: "lumieres", nom: "Lumières vivantes", ace: "tomorrow_night", sombre: true, aide: "Allume la balise de la zone crépusculaire", cond: (s) => s.chapitreFini("p5") },
  { id: "corail", nom: "Corail", ace: "gruvbox_dark_hard", sombre: true, aide: "Termine une expédition bonus", cond: (s) => s.nbDossiersBonusFinis() >= 1 },
];

BNL.BADGES = [
  { id: "moussaillon", emoji: "⚓", nom: "Moussaillon", aide: "Réussir la première mission", cond: (s) => s.reussie("m01") },
  { id: "premiere_commande", emoji: "⌨️", nom: "Première commande", aide: "Réussir une première mission de console", cond: (s) => s.nbTypeReussies("commande") >= 1 },
  { id: "premier_coup", emoji: "🎯", nom: "Du premier coup", aide: "Réussir une mission de code dès le premier essai, sans indice", cond: (s) => s.unPremierCoup() },
  { id: "perseverance", emoji: "💪", nom: "Persévérance", aide: "Réussir une mission après au moins 5 essais : tu n'as rien lâché", cond: (s) => s.unePerseverance() },
  { id: "reparateur", emoji: "🔧", nom: "Réparation", aide: "Corriger le scanner en panne", cond: (s) => s.reussie("m08") },
  { id: "architecte", emoji: "📐", nom: "Architecte", aide: "Réussir une mission « Concevoir »", cond: (s) => s.nbCompetence("concevoir") >= 1 },
  { id: "sept", emoji: "🌈", nom: "Les 7 compétences", aide: "Réussir au moins une mission de chaque compétence", cond: (s) => s.toutesCompetences() },
  { id: "curiosite", emoji: "📒", nom: "Curiosité", aide: "Ouvrir le mémo 3 fois", cond: (s) => (s.stats.memo || 0) >= 3 },
  { id: "experimentation", emoji: "🧪", nom: "Expérimentation", aide: "Lancer du code dans le bac à sable", cond: (s) => (s.stats.bacasable || 0) >= 1 },
  { id: "autonomie", emoji: "🧭", nom: "Autonomie", aide: "Réussir 5 missions sans indice", cond: (s) => s.nbSansIndice() >= 5 },
  { id: "balise1", emoji: "🔆", nom: "Première balise", aide: "Allumer la balise du hangar", cond: (s) => s.chapitreFini("p0") },
  { id: "balise3", emoji: "🔆", nom: "Trois balises", aide: "Allumer trois balises", cond: (s) => s.nbPaliersFinis() >= 3 },
  { id: "balise7", emoji: "🌊", nom: "Les sept balises", aide: "Allumer les sept balises", cond: (s) => s.nbPaliersFinis() >= 7 },
  { id: "rencontre", emoji: "🐟", nom: "La rencontre", aide: "Rencontrer le Gombessa", cond: (s) => s.reussie("m13") },
  { id: "etoiles", emoji: "⭐", nom: "Plongée parfaite", aide: "3 étoiles sur toutes les missions du parcours principal", cond: (s) => s.principalesParfaites() },
  { id: "carnet", emoji: "📔", nom: "Naturaliste", aide: "Remplir 6 pages du carnet de bord", cond: (s) => s.nbChapitresFinis() >= 6 },
  { id: "dziani", emoji: "🧫", nom: "Explorateur du lac", aide: "Terminer « Le lac Dziani »", cond: (s) => s.chapitreFini("e1") },
  { id: "recensement", emoji: "📊", nom: "Recenseur", aide: "Terminer « Le grand recensement »", cond: (s) => s.chapitreFini("e2") },
  { id: "chant", emoji: "🎶", nom: "Oreille fine", aide: "Terminer « Le chant des baleines »", cond: (s) => s.chapitreFini("e3") },
  { id: "tortues", emoji: "🐢", nom: "Gardien des plages", aide: "Terminer « Les plages des tortues »", cond: (s) => s.chapitreFini("e4") },
  { id: "mangrove", emoji: "🌿", nom: "Expert de la mangrove", aide: "Terminer « Retour à la mangrove »", cond: (s) => s.chapitreFini("e5") },
  { id: "legende", emoji: "🏆", nom: "Légende des profondeurs", aide: "Terminer absolument toutes les missions", cond: (s) => s.toutFini() },
];

// =============================================================================
//  L'HISTOIRE : prologue et épilogue (cases de manga, voir js/ui/manga.js)
// =============================================================================
BNL.PROLOGUE = {
  titre: "Prologue",
  ambiance: "p0",
  cases: [
    { type: "titre", sur: "EXPÉDITION GOMBESSA", texte: "PROLOGUE", sous: "Le port, 23 h" },
    { qui: "narration", decor: "hangar", texte: "Demain matin, le petit sous-marin **Luciole** doit descendre à **250 mètres**. Objectif : filmer le **gombessa**, un poisson dont la famille existait déjà avant les dinosaures." },
    { qui: "cap", expr: "serieux", texte: "Vingt ans que j'attends ça. Je l'ai vu une fois, là-dessous. Personne ne m'a crue." },
    { qui: "nour", expr: "sourire", texte: "Cette fois, on aura des images. Et on le laisse tranquille : on regarde, on ne touche pas." },
    { qui: "bolt", expr: "rire", texte: "Et moi, j'ai prévu trois paquets de gâteaux. 250 mètres, ça creuse." },
    { qui: "narration", decor: "drone", fx: "BZZZT !", texte: "Soudain, un drone noir se colle à la coque. Une lumière rouge clignote… puis plus rien." },
    { qui: "luci", expr: "choc", texte: "ALERTE. Intrusion. Module de langage… dét… détruit." },
    { qui: "vex", expr: "malin", radio: true, texte: "Désolé pour le dérangement. Ici **Vex**, pilote du **Léviathan**. Le gombessa, Abyssal Collection le veut **vivant**, dans un aquarium. Bonne nuit !" },
    { qui: "cap", expr: "colere", type: "cri", texte: "Abyssal… Des collectionneurs. Ils capturent des espèces rares pour les vendre à des milliardaires !" },
    { qui: "luci", expr: "serieux", texte: "Je ne comprends plus le français. Je n'accepte plus qu'**une seule langue : Python**." },
    { qui: "bolt", expr: "choc", texte: "Génial. Et qui parle Python, ici ?" },
    { qui: "cap", expr: "serieux", texte: "La nouvelle recrue. **Toi**. À partir de maintenant, tu es notre voix auprès de LUCI." },
  ],
  replique: {
    q: "La capitaine compte sur toi. Que vas-tu faire ?",
    choix: ["Je vais donner les ordres à LUCI, en Python.", "Je vais réparer le drone.", "Je vais appeler Abyssal pour négocier."],
    bonne: 0,
    retours: {
      1: { qui: "bolt", expr: "sueur", texte: "Le drone ? Il est déjà reparti. C'est LUCI qu'il faut faire parler. En Python." },
      2: { qui: "cap", expr: "colere", texte: "Négocier avec Abyssal ? Jamais. LUCI a besoin de toi." },
    },
    ok: { qui: "luci", expr: "sourire", texte: "Entrée acceptée. Bonjour, Recrue. Ne me déçois pas." },
  },
};

BNL.EPILOGUE = {
  titre: "La rencontre",
  ambiance: "p6",
  cases: [
    { qui: "luci", expr: "sourire", texte: "Leurre envoyé : un faux signal de gombessa, à l'opposé de la grotte." },
    { qui: "narration", decor: "leviathan", fx: "KRAAAK !", texte: "Le Léviathan fonce vers le leurre… et coince sa coque dans un tunnel de lave." },
    { qui: "vex", expr: "choc", radio: true, texte: "On est bloqués ! Orsa… Orsa est partie avec la capsule de secours. Elle m'a laissé seul !" },
    { qui: "bolt", expr: "choc", texte: "Elle l'a lâché ?! Sérieux ?" },
    { qui: "cap", expr: "serieux", texte: "Sur la Luciole, on ne laisse **personne** au fond. Bolt : le bras articulé. Recrue : guide-nous." },
    { qui: "narration", decor: "duo", texte: "Vingt minutes plus tard, Vex est à bord. Trempé. Silencieux." },
    { qui: "narration", decor: "gombessa", texte: "Alors, dans le faisceau de la Luciole, une silhouette bleue tachetée de blanc s'approche. Lentement." },
    { qui: "cap", expr: "triste", texte: "Le revoilà… Vingt ans après." },
    { qui: "nour", expr: "sourire", texte: "Images enregistrées. On ne le suit pas. On le laisse à sa nuit." },
    { qui: "vex", expr: "triste", texte: "…Il est plus beau que dans les catalogues d'Abyssal." },
    { qui: "luci", expr: "sourire", texte: "Recrue. Ton code a protégé un fossile vivant. Bilan : **0 erreur**." },
    { qui: "cap", expr: "sourire", texte: "Abyssal ne lâchera pas. D'autres missions nous attendent. Vex… tu sais coder ?" },
    { qui: "vex", expr: "malin", texte: "Mieux que la Recrue. …Enfin, presque." },
    { type: "titre", sur: "FIN DU PARCOURS PRINCIPAL", texte: "À SUIVRE", sous: "5 expéditions bonus t'attendent" },
  ],
};
