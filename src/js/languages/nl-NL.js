window.LANGUAGE_PACKS = window.LANGUAGE_PACKS || {};
window.VERSION_DATA = window.VERSION_DATA || {};

window.LANGUAGE_PACKS['nl-NL'] = {

    // ===== Basisinfo =====
    gameTitle: 'Tetris',
    footerCopyright: '© 2025 Tetris - Multi-modus spel',
    version: 'Versie',
    developedWith: 'Ontwikkeld met HTML5 Canvas en JavaScript',

    // ===== Algemene knoppen =====
    close: 'Sluiten',
    save: 'Opslaan',
    cancel: 'Annuleren',
    back: 'Terug',
    backToMenu: 'Terug naar menu',
    delete: 'Verwijderen',

    // ===== Moeilijkheid =====
    easy: 'Makkelijk',
    medium: 'Gemiddeld',
    hard: 'Moeilijk',
    expert: 'Expert',
    extreme: 'Extreem',

    // ===== Hoofdmenu / Algemeen =====
    startGame: 'Spel starten',
    startChallenge: 'Uitdaging starten',
    selectChallenge: 'Uitdaging kiezen',
    anonymousPlayer: 'Anonieme speler',
    failed: 'Mislukt',
    unknownMode: 'Onbekende modus',
    seconds: 's',
    heightIndicator: 'Stapelhoogte: ',
    rows: 'rijen',

    // ===== Instellingen - Navigatie =====
    navDisplay: 'Weergave',
    navAudio: 'Audio',
    navLanguage: 'Taal',
    navAccount: 'Account',
    navAssist: 'Hulp',
    navStats: 'Statistieken',
    navAchievements: 'Prestaties',
    navAbout: 'Over',

    // ===== Instellingen - Paneeltitels =====
    panelDisplay: 'Weergave-instellingen',
    panelAudio: 'Audio-instellingen',
    panelLanguage: 'Taalinstellingen',
    panelAccount: 'Account',
    panelAssist: 'Toegankelijkheid',
    panelStats: 'Spelstatistieken',
    panelAchievements: 'Prestaties',
    panelAbout: 'Over',

    // ===== Instellingen - Audio =====
    musicVolume: 'Muziekvolume',
    musicVolumeDesc: 'Pas het volume van de achtergrondmuziek aan',
    soundVolume: 'Effectvolume',
    soundVolumeDesc: 'Pas het volume van geluidseffecten aan',

    // ===== Instellingen - Muziekspeler =====
    navMusic: 'Muziek',
    panelMusic: 'Muziekspeler',
    musicPlaylist: 'Afspeellijst',
    musicImport: 'Lokale muziek importeren',
    musicNoTrack: 'Geen nummers',
    musicPlay: 'Afspelen',
    musicPause: 'Pauzeren',
    musicDelete: 'Verwijderen',
    musicNowPlaying: 'Nu aan het afspelen',
    musicImportSuccess: 'Import geslaagd',
    musicImportFailed: 'Import mislukt',
    musicMaxReached: 'Nummerlimiet bereikt',
    musicFileTooBig: 'Bestand te groot (meer dan 25 MB)',
    musicImportSkipped: 'Duplicaten overgeslagen',
    musicImporting: 'Muziek importeren',
    musicImportingText: 'Even geduld, audiobestanden worden verwerkt...',
    musicConfirmDelete: 'Dit nummer verwijderen?',
    musicConfirmDeleteTitle: 'Nummer verwijderen',
    musicConfirmDeleteText: 'Weet je zeker dat je dit nummer wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt!',
    musicNoSupport: 'Browser ondersteunt IndexedDB niet',
    musicClearAll: 'Alle muziek wissen',
    musicClearAllConfirmTitle: 'Alle muziek wissen',
    musicClearAllConfirmText: 'Weet je zeker dat je alle geïmporteerde muziek wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt!',
    musicClearAllSuccess: 'Alle muziek gewist',
    bgmTitle: 'Achtergrondmuziek',
    bgmNowPlaying: 'Nu aan het afspelen',

    // ===== Instellingen - Taal =====
    languageSetting: 'Interfacetaal',
    languageDesc: 'Kies de taal van de spelinterface',

    // ===== Instellingen - Hulp =====
    previewTitle: 'Blokvoorbeeld',
    previewDesc: 'Toon een voorbeeld van waar het huidige blok zal landen',
    heightlineTitle: 'Hoogtelijn',
    heightlineDesc: 'Toon een referentielijn voor de huidige stapelhoogte',
    extraPreviewTitle: 'Extra blokvoorbeeld',
    extraPreviewDesc: 'Toon de volgende 2 blokken',
    nextPiece2: 'Volgende 2',
    nextPiece3: 'Volgende 3',

    // ===== Instellingen - Statistieken =====
    statsLifetime: 'Totale statistieken',
    statsTotalGames: 'Totaal aantal spellen',
    statsTotalPlaytime: 'Totale speeltijd',
    statsTotalLines: 'Totaal verwijderde rijen',
    statsTotalScore: 'Totale score',
    statsHighestScore: 'Hoogste score',
    statsHighestCombo: 'Hoogste combo',
    statsPieces: 'Blokgebruik',
    clearStats: 'Statistieken wissen',
    clearStatsConfirmTitle: 'Statistieken wissen',
    clearStatsConfirmText: 'Weet je zeker dat je alle statistieken wilt wissen? Deze actie kan niet ongedaan worden gemaakt!',
    clearStatsSuccess: 'Statistieken gewist',

    // ===== Instellingen - Prestaties =====
    achievements: 'Prestaties',
    achTotalProgress: 'Totale voortgang',
    achUnlockToast: 'Prestatie ontgrendeld',
    achCategoryAll: 'Alle',
    achCategory_milestone: 'Mijlpalen',
    achCategory_cumulative: 'Cumulatief',
    achCategory_single: 'Eén spel',
    achCategory_skill: 'Vaardigheid',
    achCategory_mode: 'Modus',
    clearAchievements: 'Prestatierecords wissen',
    clearAchievementsConfirmTitle: 'Prestatierecords wissen',
    clearAchievementsConfirmText: 'Weet je zeker dat je alle prestaties wilt wissen? Deze actie kan niet ongedaan worden gemaakt!',
    clearAchievementsSuccess: 'Prestatierecords gewist',

    // ===== Prestatienamen - Mijlpalen =====
    achFirstGame: 'Eerste stappen',
    achFirstLine: 'Eerste bloed',
    achFirstTetris: 'Tetris!',
    achGames10: 'Net begonnen',
    achGames100: 'Veteraan',
    achLevel10: 'Rijzende ster',
    achLevel20: 'Snelheidsduivel',

    // ===== Prestatienamen - Cumulatief =====
    achLines100: 'Honderd rijen',
    achLines1000: 'Rijenmeester',
    achHarddrop100: '100 hard drops',
    achHarddrop1000: '1000 hard drops',
    achRotate1000: '1000 rotaties',

    // ===== Prestatienamen - Eén spel =====
    achScore10k: 'Vijf cijfers',
    achScore100k: 'Zes cijfers',

    // ===== Prestatienamen - Vaardigheid =====
    achClassicNoPause30: 'Zonder pauze',
    achSprint300: 'Sprint 300',
    achSprint240: 'Sprint 240',
    achSprint180: 'Sprint 180',
    achSprint150: 'Sprint 150',

    // ===== Prestatienamen - Modus =====
    achClassicLines50: 'Klassiek 50',
    achClassicLines100: 'Klassiek 100',
    achTimedScore50k: 'Op tijd 50K',
    achTimedScore100k: 'Op tijd 100K',
    achCountdown60: 'Aftellen 60',
    achCountdown120: 'Aftellen 120',
    achTimedLinesFirst: 'Tijddoel',
    achInvisible5: 'Onzichtbaar beginner',
    achInvisible20: 'Onzichtbaar expert',
    achInvisible2_5: 'Verdwenen in een flits',
    achInvisible2_20: 'Geheugenmeester',
    achSurvival60: 'Overleven 60',
    achSurvival180: 'Overleven 180',
    achSurvival300: 'Overleven 300',
    achMarathon3: 'Marathon fase 3',
    achMarathon5: 'Marathon fase 5',
    achEndless50: 'Eindeloos 50',
    achEndless100: 'Eindeloos 100',
    achEndless300: 'Eindeloos 300',
    achEndless30min: 'Uithoudingsvermogen 30',

    // ===== Prestatienamen - Verborgen =====
    achMarathonNoFail: 'Foutloze run',

    // ===== Prestatiebeschrijvingen - Mijlpalen =====
    achFirstGameDesc: 'Voltooi je eerste spel',
    achFirstLineDesc: 'Verwijder je eerste rij',
    achFirstTetrisDesc: 'Verwijder voor het eerst 4 rijen tegelijk',
    achGames10Desc: 'Speel in totaal 10 spellen',
    achGames100Desc: 'Speel in totaal 100 spellen',
    achLevel10Desc: 'Bereik level 10',
    achLevel20Desc: 'Bereik level 20',

    // ===== Prestatiebeschrijvingen - Cumulatief =====
    achLines100Desc: 'Verwijder in totaal 100 rijen',
    achLines1000Desc: 'Verwijder in totaal 1000 rijen',
    achHarddrop100Desc: 'Voer in totaal 100 hard drops uit',
    achHarddrop1000Desc: 'Voer in totaal 1000 hard drops uit',
    achRotate1000Desc: 'Roteer blokken in totaal 1000 keer',

    // ===== Prestatiebeschrijvingen - Eén spel =====
    achScore10kDesc: 'Scoor 10.000 punten in één spel',
    achScore100kDesc: 'Scoor 100.000 punten in één spel',

    // ===== Prestatiebeschrijvingen - Vaardigheid =====
    achClassicNoPause30Desc: 'Verwijder 30 rijen in Klassieke modus zonder pauze',
    achSprint300Desc: 'Voltooi de 40-rijen sprint binnen 300 seconden',
    achSprint240Desc: 'Voltooi de 40-rijen sprint binnen 240 seconden',
    achSprint180Desc: 'Voltooi de 40-rijen sprint binnen 180 seconden',
    achSprint150Desc: 'Voltooi de 40-rijen sprint binnen 150 seconden',

    // ===== Prestatiebeschrijvingen - Modus =====
    achClassicLines50Desc: 'Verwijder 50 rijen in één Klassiek spel',
    achClassicLines100Desc: 'Verwijder 100 rijen in één Klassiek spel',
    achTimedScore50kDesc: 'Scoor 50.000 punten in één Op-tijd-spel',
    achTimedScore100kDesc: 'Scoor 100.000 punten in één Op-tijd-spel',
    achCountdown60Desc: 'Overleef 60 seconden in Aftellen',
    achCountdown120Desc: 'Overleef 120 seconden in Aftellen',
    achTimedLinesFirstDesc: 'Voltooi voor het eerst het tijdrijen-doel',
    achInvisible5Desc: 'Verwijder 5 rijen in één Klassiek onzichtbaar spel',
    achInvisible20Desc: 'Verwijder 20 rijen in één Klassiek onzichtbaar spel',
    achInvisible2_5Desc: 'Verwijder 5 rijen in één Onzichtbaar 2.0 spel',
    achInvisible2_20Desc: 'Verwijder 20 rijen in één Onzichtbaar 2.0 spel',
    achSurvival60Desc: 'Overleef 60 seconden in Overlevingsmodus',
    achSurvival180Desc: 'Overleef 180 seconden in Overlevingsmodus',
    achSurvival300Desc: 'Overleef 300 seconden in Overlevingsmodus',
    achMarathon3Desc: 'Bereik fase 3 in Marathon',
    achMarathon5Desc: 'Bereik fase 5 in Marathon',
    achEndless50Desc: 'Verwijder 50 rijen in één Eindeloos spel',
    achEndless100Desc: 'Verwijder 100 rijen in één Eindeloos spel',
    achEndless300Desc: 'Verwijder 300 rijen in één Eindeloos spel',
    achEndless30minDesc: 'Speel 30 minuten achter elkaar in Eindeloze modus',

    // ===== Prestatiebeschrijvingen - Verborgen =====
    achMarathonNoFailDesc: 'Voltooi 5 doelcontroles in Marathon zonder te falen',

    // ===== Instellingen - Account =====
    accountTitle: 'Account',
    accountCurrentName: 'Huidige nickname',
    accountNewName: 'Nickname wijzigen',
    accountNamePlaceholder: 'Voer nieuwe nickname in',
    accountNameHint: 'Nickname wordt gebruikt voor ranglijstregistraties',
    accountReset: 'Account resetten',
    accountResetConfirmTitle: 'Account resetten',
    accountResetConfirmText: 'Weet je zeker dat je het account wilt resetten? De huidige nickname wordt gewist en moet opnieuw worden aangemaakt. Ranglijstgegevens blijven behouden.',
    accountCreateTitle: 'Account aanmaken',
    accountCreateText: 'Voer je nickname in om scores op te slaan in de ranglijst:',
    accountCreated: 'Account aangemaakt',
    accountUpdated: 'Nickname bijgewerkt',
    accountReset_done: 'Account gereset',
    accountInvalidName: 'Nickname mag niet leeg zijn',
    accountDefaultName: 'Speler',

    // ===== Level =====
    level: 'Level',
    levelShort: 'Lv.',
    exp: 'EXP',
    expGained: 'EXP verdiend in dit spel',
    levelUp: 'Level omhoog!',
    levelUpTo: 'Level {level} bereikt',
    expToNext: 'Nog {exp} EXP tot volgend level',
    expMax: 'Maximaal level',
    titleNovice: 'Beginner',
    titleApprentice: 'Leerling',
    titleSkilled: 'Vaardig',
    titleExpert: 'Expert',
    titleMaster: 'Meester',
    titleGrandmaster: 'Grootmeester',
    titleLegend: 'Legende',
    titleTranscendent: 'Transcendent',
    resetLevel: 'Level resetten',
    resetLevelConfirmTitle: 'Level resetten',
    resetLevelConfirmText: 'Weet je zeker dat je level en EXP wilt resetten? Deze actie kan niet ongedaan worden gemaakt!',
    resetLevelSuccess: 'Level gereset',

    // ===== Spelstatussen / Algemeen =====
    gameOver: 'Spel voorbij!',
    challengeComplete: 'Uitdaging voltooid',
    saveScore: 'Score opslaan',
    waitingToStart: 'Wachten om te starten',
    playing: 'Aan het spelen...',
    paused: 'Spel gepauzeerd',
    pausedLabel: 'Gepauzeerd',
    timeup: 'Tijd is om!',
    getReady: 'Maak je klaar',
    pressSpaceToStart: 'Druk op Spatie om te starten',
    pressSpaceToRestart: 'Druk op Spatie om opnieuw te starten',
    challengeEnded: 'Uitdaging beëindigd',
    challengeFailed: 'Uitdaging mislukt',
    congratulations: 'Gefeliciteerd!',
    gameEnded: 'Je spel is afgelopen, ',
    enterNameToSave: 'Voer je naam in om op te slaan in de ranglijst:',
    blockExceededLine10: 'Blok overschreed de limiet van rij 10',
    survivalFailed: 'Overleven mislukt!',
    marathonFailed: 'Marathon-uitdaging mislukt!',
    targetNotReached: 'Doelrijen niet bereikt!',

    // ===== Infopaneel =====
    gameInfo: 'Informatie',
    score: 'Score',
    lines: 'Verwijderde rijen',
    timeElapsed: 'Tijd',
    timeLeft: 'Resterende tijd',
    nextGarbageLine: 'Volgende afvalrij',
    linesRemaining: 'Resterende rijen',
    gameStatus: 'Status',
    totalLinesTarget: 'Totaal doelrijen',
    nextTargetIncrease: 'Volgende doelverhoging',
    nextTargetCheck: 'Volgende doelcontrole',

    // ===== Spelmodi =====
    classicMode: 'Klassieke modus',
    challengeMode: 'Uitdagingsmodus',
    endlessMode: 'Eindeloze modus',
    timedChallenge: 'Op-tijd-uitdaging',
    invisibleMode: 'Onzichtbare modus',
    invisible2Mode: 'Onzichtbaar 2.0',
    sprint40: '40-rijen sprint',
    survivalMode: 'Overlevingsmodus',
    marathonMode: 'Marathonmodus',
    classicTetris: 'Klassieke Tetris',

    // ===== Modusbeschrijvingen =====
    gameDescription: 'Een nieuwe kijk op de klassieke puzzel! Kies je favoriete modus, verleg je grenzen en zet de hoogste score neer!',
    classicDescription: 'Traditionele Tetris-gameplay. Hoe meer rijen je verwijdert, hoe sneller de blokken vallen. Test je reflexen!',
    challengeDescription: 'Bevat Op-tijd-, Onzichtbare-, 40-rijen sprint- en Overlevingsuitdagingen. Test je grenzen!',
    endlessDescription: 'De valsnelheid blijft constant en neemt niet toe. Het spel gaat eindeloos door — test je uithoudingsvermogen!',
    challengeSelectDesc: 'Kies een uitdagingsmodus en test je Tetris-grenzen!',
    timedDescription: 'Scoor in 3 minuten zo hoog mogelijk! De tijd dringt — snelle beslissingen en precieze bewegingen zijn nodig.',
    invisibleDescription: 'De onderste 10 rijen zijn volledig onzichtbaar! Vertrouw op geheugen en instinct. Let op: laat blokken niet voorbij rij 10 komen!',
    invisible2Desc: 'Blokken worden onzichtbaar zodra ze landen! Alle geplaatste blokken zijn verborgen — een echte test van geheugen en ruimtelijk inzicht!',
    sprintDescription: 'Verwijder 40 rijen zo snel mogelijk! Tijd is alles — verbreek je record!',
    survivalDescription: 'Afvalrijen stijgen van onderen met een aanpasbaar interval (10–60 s). Hoe langer je overleeft, hoe moeilijker het wordt!',
    marathonDescription: 'Een doorlopende uitdaging die blijft groeien! Het doel stijgt elke 75 s met 10 rijen, en verwijderde rijen moeten blijven accumuleren. Elke 60 s is er een controle — haal je het doel niet, dan eindigt de uitdaging. Test je uithoudingsvermogen!',

    // ===== Bloknamen =====
    piece1: 'I-blok',
    piece2: 'J-blok',
    piece3: 'L-blok',
    piece4: 'O-blok',
    piece5: 'S-blok',
    piece6: 'T-blok',
    piece7: 'Z-blok',
    nextPiece: 'Volgend blok',

    // ===== Instellingen - Infopaneel =====
    controls: 'Besturing',
    controlsDesc: 'Gebruik het toetsenbord om blokken te verplaatsen en te roteren:',
    moveLeftRight: 'Links/rechts bewegen',
    rotatePiece: 'Roteren',
    softDrop: 'Soft drop',
    hardDrop: 'Hard drop',
    pauseGame: 'Pauzeren',
    restartGame: 'Opnieuw starten',
    resume: 'Doorgaan',
    gameModes: 'Spelmodi',
    modesDescription: 'Klassiek: traditionele Tetris — hoe meer rijen je verwijdert, hoe sneller de blokken vallen.\nUitdaging: diverse speciale uitdagingen om je grenzen te testen.\nEindeloos: constante valsnelheid — test je uithoudingsvermogen!',
    settings: 'Instellingen',
    settingsNoteTitle: 'Opmerking:',
    settingsNoteItem1: '• In de Onzichtbare modus worden voorbeeld en hoogtelijn automatisch uitgeschakeld',
    settingsNoteItem2: '• Instellingen worden lokaal opgeslagen en automatisch geladen',
    settingsNoteItem3: '• Achtergrondmuziek en geluidseffecten kunnen worden aangepast in de categorie Audio',

    // ===== Ranglijst =====
    leaderboard: 'Ranglijst',
    clearScores: 'Ranglijst van huidige modus wissen',
    noScores: 'Nog geen scores',
    scoreSaved: 'Score opgeslagen',
    clearSuccess: 'Ranglijst gewist',
    beTheFirst: 'Wees de eerste die een record neerzet!',
    clearConfirmTitle: 'Ranglijst wissen',
    clearConfirmText: 'Weet je zeker dat je de ranglijst van de huidige modus wilt wissen? Deze actie kan niet ongedaan worden gemaakt!',

    // ===== Updates =====
    updates: 'Updates',
    updateHistory: 'Tetris - Versiegeschiedenis',
    updateHistoryDesc: 'Klik op een versienummer links om details te bekijken',
    versionList: 'Versielijst',
    versionDetails: 'Versiedetails',
    selectVersion: 'Selecteer links een versie om details te bekijken',
    currentVersionLabel: 'Huidige versie',

    // ===== Popup - Score opslaan =====
    enterPlayerName: 'Voer spelersnaam in',
    saveScorePrompt: 'Voer je naam in om op te slaan in de ranglijst:',
    playerNamePlaceholder: 'Voer spelersnaam in',
    currentScore: 'Huidige score: ',
    saveScoreConfirm: 'Deze score opslaan?',

    // ===== Resultaatvenster =====
    resultTitle: 'Spelresultaten',
    resultAchTitle: 'Ontgrendelde prestaties',
    resultRestart: 'Opnieuw spelen',
    resultBack: 'Terug naar menu',

    // ===== Uitdagingen - Sprint / Overleven / Marathon =====
    sprintComplete: 'Gefeliciteerd met het voltooien van de 40-rijen sprint!',
    survivalComplete: 'Overlevingsuitdaging beëindigd!',
    marathonComplete: 'Marathon-uitdaging voltooid!',
    timeUsed: 'Tijd: ',
    survivalTime: 'Overlevingstijd: ',
    totalStages: 'Voltooide fasen: ',
    totalLines: 'Totaal verwijderde rijen: ',
    marathonCleared: 'Verwijderd',
    marathonTargetIncrease: 'Doel verhoogd!',
    marathonTargetReached: 'Doel bereikt!',

    // ===== Uitdagingen - Onzichtbaar =====
    invisibleGroupTitle: 'Onzichtbare modus',
    invisibleGroupDesc: 'Onderste 10 rijen verborgen / onzichtbaar bij landen — kies je variant',
    chooseInvisibleMode: 'Kies onzichtbare modus',

    // ===== Uitdagingen - Op tijd =====
    timedGroupTitle: 'Op-tijd-modus',
    timedGroupDesc: 'Bevat Op-tijd-score, Aftel-overleven en Tijdrijen — drie varianten',
    chooseTimedMode: 'Kies Op-tijd-modus',
    timedScoreMode: 'Op-tijd-score',
    timedScoreDesc: 'Aanpasbare starttijd. Scoor zo hoog mogelijk voordat de tijd om is! Bij nul eindigt het spel. Vergelijk je eindscore.',
    countdownSurvivalMode: 'Aftel-overleven',
    countdownSurvivalDesc: 'Aanpasbare starttijd. Elke verwijderde rij voegt tijd toe! Bij nul ga je dood. Test je efficiëntie.',
    timedLinesMode: 'Tijdrijen',
    timedLinesDesc: 'Aanpasbare starttijd. Verwijder het doel aantal rijen voordat de tijd om is! Bereikt = winst, tijd om = verlies.',

    // ===== Uitdagingen - Popup eigen tijd =====
    customTimeTitle: 'Starttijd instellen',
    customTimeText: 'Voer starttijd in (seconden):',
    customTargetLinesText: 'Voer doelrijen in:',
    customTimeHint: 'Aanbevolen bereik: 30 ~ 600 seconden',
    customLinesHint: 'Aanbevolen bereik: 10 ~ 200 rijen',
    customTimeInvalid: 'Voer een geldig aantal seconden in (10-3600)',
    customLinesInvalid: 'Voer een geldig aantal rijen in (1-500)',

    // ===== Uitdagingen - Overlevingsinterval =====
    survivalIntervalTitle: 'Interval afvalrijen instellen',
    survivalIntervalText: 'Voer het stijgingsinterval van afvalrijen in (seconden):',
    survivalIntervalHint: 'Aanbevolen bereik: 10 ~ 60 seconden',
    survivalIntervalInvalid: 'Voer een geldig aantal seconden in (10-60)',

    // ===== Uitdagingen - Tijdresultaat =====
    timeAdded: 'Tijd toegevoegd',
    survivalTimeUp: 'Tijd is om! Overleven mislukt',
    timedScoreEnd: 'Tijd is om! Eindscore',
    timedLinesWin: 'Gefeliciteerd! Doelrijen verwijderd!',
    timedLinesLose: 'Tijd is om! Doel niet bereikt',
    linesTarget: 'Doelrijen',
    linesProgress: 'Voortgang',
    addTimePerLine: 'Tijd per rij',
    initialTime: 'Starttijd',
    timePerLine: 'Tijd per rij'
};

window.VERSION_DATA['nl-NL'] = [
    {
        version: '5.2.0',
        date: 'April 2025',
        title: 'Consolidatie Op-tijd-modus en submenu-optimalisatie',
        description: 'Op-tijd-uitdaging, Op-tijd-score, Aftel-overleven en Tijdrijen zijn samengevoegd in een submenu "Op-tijd-modus", waardoor het hoofdmenu van uitdagingen is vereenvoudigd',
        features: [
            'Kaart "Op-tijd-modus" toegevoegd die een subselectie-popup opent',
            'Op-tijd-uitdaging, Op-tijd-score, Aftel-overleven en Tijdrijen samengevoegd',
            'Op-tijd-uitdaging is vastgesteld op 3 minuten; de andere drie ondersteunen eigen tijd',
            'Hoofdmenu van uitdagingen teruggebracht van 8 naar 5 kaarten',
            'Interactie consistent met de subselectie van de Onzichtbare modus'
        ],
        current: true
    },
    {
        version: '5.1.0',
        date: 'April 2025',
        title: 'Drie nieuwe uitdagingsmodi en optimalisatie Op-tijd-modus',
        description: 'De modi Op-tijd-score, Aftel-overleven en Tijdrijen toegevoegd met aanpasbare starttijd',
        features: [
            '"Op-tijd-score" toegevoegd: eigen tijd, aftellen tot nul, vergelijk totaalscore',
            '"Aftel-overleven" toegevoegd: eigen tijd, elke rij voegt tijd toe, nul betekent dood',
            '"Tijdrijen" toegevoegd: eigen tijd, verwijder het doel aantal rijen om te winnen',
            'Alle drie nieuwe modi ondersteunen een popup voor eigen starttijd',
            'Ranglijst registreert gegevens van nieuwe modi'
        ]
    },
    {
        version: '5.0.6',
        date: 'April 2025',
        title: 'Vereenvoudiging uitdagingsmodus, maskerfix en meertalige verbeteringen',
        description: 'Onzichtbaar-varianten samengevoegd, sluiten via masker uniform verboden, tijdbeloningscoëfficiënt verlaagd',
        features: [
            'Onzichtbaar en Onzichtbaar 2.0 samengevoegd tot één kaart + subselectie-popup',
            'Geen enkele modal sluit bij klikken op het masker',
            'Tijdbeloningscoëfficiënt verlaagd in alle modi'
        ]
    }
];