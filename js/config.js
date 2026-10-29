// =============================================================================
//  CONFIGURATION — le seul fichier à modifier pour brancher votre classe.
// =============================================================================
window.BNL_CONFIG = {
  // Adresse du projet Supabase (Project Settings › API › Project URL)
  // Exemple : "https://abcdefghijkl.supabase.co"
  // Laisser vide = mode sans connexion (progression gardée sur l'ordinateur).
  SUPABASE_URL: "https://cukahpyqkljiddmimpyi.supabase.co",

  // Clé publique du projet : « Publishable key » (sb_publishable_...)
  // ou, sur les anciens projets, la clé « anon public ».
  // ⚠️ Ne jamais mettre ici la clé « secret » ou « service_role ».
  SUPABASE_KEY: "sb_publishable_dYwCrwaqiDOm8knczJu3Kw_5InHwyPB",

  // Autoriser un élève à jouer sans compte : sa progression reste 1 jour sur l'appareil
  // (cookies). Le code élève unique (qui ne change jamais) demande Supabase ; sans lui,
  // le profil propose seulement une « sauvegarde » GB-… pour continuer un autre jour.
  AUTORISER_HORS_LIGNE: true,

  // Rafraîchissement de la liste de l'équipage (les camarades), en secondes.
  RAFRAICHIR_EQUIPAGE_S: 20,

  // Temps maximum d'exécution d'un programme élève avant arrêt (millisecondes).
  DELAI_EXECUTION_MS: 7000,

  // Pour tester le jeu soi-même : toutes les missions ouvertes d'emblée.
  // (On peut aussi ajouter ?toutouvert à la fin de l'adresse du site.)
  TOUT_DEBLOQUER: false,

  // Délais (secondes passées sur la mission) avant de pouvoir ouvrir les indices,
  // même sans avoir fait d'essai. [indice 2, indice 3, correction]
  DELAIS_INDICES_S: [90, 180, 300],
};
