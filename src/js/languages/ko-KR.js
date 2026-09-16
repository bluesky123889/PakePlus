window.LANGUAGE_PACKS = window.LANGUAGE_PACKS || {};
window.VERSION_DATA = window.VERSION_DATA || {};

window.LANGUAGE_PACKS['ko-KR'] = {

    // ===== 기본 정보 =====
    gameTitle: '테트리스',
    footerCopyright: '© 2025 테트리스 - 멀티 모드 게임',
    version: '버전',
    developedWith: 'HTML5 Canvas와 JavaScript로 개발',

    // ===== 공통 버튼 =====
    close: '닫기',
    save: '저장',
    cancel: '취소',
    back: '뒤로',
    backToMenu: '메뉴로 돌아가기',
    delete: '삭제',

    // ===== 난이도 =====
    easy: '쉬움',
    medium: '보통',
    hard: '어려움',
    expert: '전문가',
    extreme: '극한',

    // ===== 메인 메뉴 / 공통 =====
    startGame: '게임 시작',
    startChallenge: '챌린지 시작',
    selectChallenge: '챌린지 선택',
    anonymousPlayer: '익명 플레이어',
    failed: '실패',
    unknownMode: '알 수 없는 모드',
    seconds: '초',
    heightIndicator: '쌓인 높이: ',
    rows: '줄',

    // ===== 설정 - 내비게이션 =====
    navDisplay: '디스플레이',
    navAudio: '오디오',
    navLanguage: '언어',
    navAccount: '계정',
    navAssist: '보조',
    navStats: '통계',
    navAchievements: '업적',
    navAbout: '설명',

    // ===== 설정 - 패널 제목 =====
    panelDisplay: '디스플레이 설정',
    panelAudio: '오디오 설정',
    panelLanguage: '언어 설정',
    panelAccount: '계정',
    panelAssist: '접근성',
    panelStats: '게임 통계',
    panelAchievements: '업적',
    panelAbout: '설명',

    // ===== 설정 - 오디오 =====
    musicVolume: '배경 음악 볼륨',
    musicVolumeDesc: '배경 음악 볼륨을 조절합니다',
    soundVolume: '효과음 볼륨',
    soundVolumeDesc: '효과음 볼륨을 조절합니다',

    // ===== 설정 - 음악 플레이어 =====
    navMusic: '음악',
    panelMusic: '음악 플레이어',
    musicPlaylist: '재생 목록',
    musicImport: '로컬 음악 가져오기',
    musicNoTrack: '곡 없음',
    musicPlay: '재생',
    musicPause: '일시정지',
    musicDelete: '삭제',
    musicNowPlaying: '재생 중',
    musicImportSuccess: '가져오기 성공',
    musicImportFailed: '가져오기 실패',
    musicMaxReached: '곡 수 한도에 도달했습니다',
    musicImportSkipped: '중복 건너뜀',
    musicImporting: '음악 가져오는 중',
    musicImportingText: '잠시만 기다려 주세요, 오디오 파일을 처리하는 중...',
    musicFileTooBig: '파일이 너무 큽니다 (25MB 초과)',
    musicConfirmDelete: '이 곡을 삭제하시겠습니까?',
    musicConfirmDeleteTitle: '곡 삭제',
    musicConfirmDeleteText: '이 곡을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다!',
    musicNoSupport: '브라우저가 IndexedDB를 지원하지 않습니다',
    musicClearAll: '모든 음악 삭제',
    musicClearAllConfirmTitle: '모든 음악 삭제',
    musicClearAllConfirmText: '가져온 모든 음악을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다!',
    musicClearAllSuccess: '모든 음악을 삭제했습니다',
    bgmTitle: '배경 음악',
    bgmNowPlaying: '재생 중',

    // ===== 설정 - 언어 =====
    languageSetting: '인터페이스 언어',
    languageDesc: '게임 인터페이스에 표시할 언어를 선택합니다',

    // ===== 설정 - 보조 =====
    previewTitle: '블록 미리보기',
    previewDesc: '현재 블록이 떨어질 위치를 미리 보여줍니다',
    heightlineTitle: '높이 표시선',
    heightlineDesc: '현재 쌓인 높이의 기준선을 표시합니다',
    extraPreviewTitle: '추가 블록 미리보기',
    extraPreviewDesc: '다음에 나타날 블록 2개를 추가로 표시합니다',
    nextPiece2: '다음다음',
    nextPiece3: '다음다음다음',

    // ===== 설정 - 통계 =====
    statsLifetime: '누적 통계',
    statsTotalGames: '총 게임 수',
    statsTotalPlaytime: '총 플레이 시간',
    statsTotalLines: '총 제거 줄 수',
    statsTotalScore: '총 누적 점수',
    statsHighestScore: '최고 점수',
    statsHighestCombo: '최고 콤보',
    statsPieces: '블록 사용 횟수',
    clearStats: '통계 초기화',
    clearStatsConfirmTitle: '통계 초기화',
    clearStatsConfirmText: '모든 통계를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다!',
    clearStatsSuccess: '통계를 초기화했습니다',

    // ===== 설정 - 업적 =====
    achievements: '업적',
    achTotalProgress: '전체 진행도',
    achUnlockToast: '업적 달성',
    achCategoryAll: '전체',
    achCategory_milestone: '마일스톤',
    achCategory_cumulative: '누적',
    achCategory_single: '단일 게임',
    achCategory_skill: '기술',
    achCategory_mode: '모드',
    clearAchievements: '업적 기록 초기화',
    clearAchievementsConfirmTitle: '업적 기록 초기화',
    clearAchievementsConfirmText: '모든 업적 기록을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다!',
    clearAchievementsSuccess: '업적 기록을 초기화했습니다',

    // ===== 업적 이름 - 마일스톤 =====
    achFirstGame: '첫 등장',
    achFirstLine: '첫 번째 피',
    achFirstTetris: '테트리스!',
    achGames10: '10판 시작',
    achGames100: '백전 노장',
    achLevel10: '신예',
    achLevel20: '스피드스터',

    // ===== 업적 이름 - 누적 =====
    achLines100: '100줄 베기',
    achLines1000: '줄 마스터',
    achHarddrop100: '하드 드롭 100회',
    achHarddrop1000: '하드 드롭 1000회',
    achRotate1000: '회전 1000회',

    // ===== 업적 이름 - 단일 게임 =====
    achScore10k: '다섯 자리',
    achScore100k: '여섯 자리',

    // ===== 업적 이름 - 기술 =====
    achClassicNoPause30: '논스톱',
    achSprint300: '스프린트 300',
    achSprint240: '스프린트 240',
    achSprint180: '스프린트 180',
    achSprint150: '스프린트 150',

    // ===== 업적 이름 - 모드 =====
    achClassicLines50: '클래식 50',
    achClassicLines100: '클래식 100',
    achTimedScore50k: '타임드 50K',
    achTimedScore100k: '타임드 100K',
    achCountdown60: '카운트다운 60',
    achCountdown120: '카운트다운 120',
    achTimedLinesFirst: '타임드 목표',
    achInvisible5: '인비저블 입문',
    achInvisible20: '인비저블 숙련',
    achInvisible2_5: '착지 즉시 사라짐',
    achInvisible2_20: '기억의 달인',
    achSurvival60: '서바이벌 60',
    achSurvival180: '서바이벌 180',
    achSurvival300: '서바이벌 300',
    achMarathon3: '마라톤 스테이지 3',
    achMarathon5: '마라톤 스테이지 5',
    achEndless50: '엔드리스 50',
    achEndless100: '엔드리스 100',
    achEndless300: '엔드리스 300',
    achEndless30min: '30분 지구력',

    // ===== 업적 이름 - 숨김 =====
    achMarathonNoFail: '완전 무패',

    // ===== 업적 설명 - 마일스톤 =====
    achFirstGameDesc: '첫 게임을 완료하세요',
    achFirstLineDesc: '첫 줄을 제거하세요',
    achFirstTetrisDesc: '처음으로 한 번에 4줄을 제거하세요',
    achGames10Desc: '누적 10판 플레이',
    achGames100Desc: '누적 100판 플레이',
    achLevel10Desc: '레벨 10 달성',
    achLevel20Desc: '레벨 20 달성',

    // ===== 업적 설명 - 누적 =====
    achLines100Desc: '누적 100줄 제거',
    achLines1000Desc: '누적 1000줄 제거',
    achHarddrop100Desc: '누적 100회 하드 드롭',
    achHarddrop1000Desc: '누적 1000회 하드 드롭',
    achRotate1000Desc: '누적 1000회 블록 회전',

    // ===== 업적 설명 - 단일 게임 =====
    achScore10kDesc: '단일 게임에서 10,000점 달성',
    achScore100kDesc: '단일 게임에서 100,000점 달성',

    // ===== 업적 설명 - 기술 =====
    achClassicNoPause30Desc: '클래식 모드에서 일시정지 없이 30줄 제거',
    achSprint300Desc: '40줄 스프린트를 300초 이내 완료',
    achSprint240Desc: '40줄 스프린트를 240초 이내 완료',
    achSprint180Desc: '40줄 스프린트를 180초 이내 완료',
    achSprint150Desc: '40줄 스프린트를 150초 이내 완료',

    // ===== 업적 설명 - 모드 =====
    achClassicLines50Desc: '클래식 모드 단일 게임에서 50줄 제거',
    achClassicLines100Desc: '클래식 모드 단일 게임에서 100줄 제거',
    achTimedScore50kDesc: '타임드 스코어 단일 게임에서 50,000점',
    achTimedScore100kDesc: '타임드 스코어 단일 게임에서 100,000점',
    achCountdown60Desc: '카운트다운 서바이벌에서 60초 생존',
    achCountdown120Desc: '카운트다운 서바이벌에서 120초 생존',
    achTimedLinesFirstDesc: '처음으로 타임드 줄 목표 달성',
    achInvisible5Desc: '클래식 인비저블 단일 게임에서 5줄 제거',
    achInvisible20Desc: '클래식 인비저블 단일 게임에서 20줄 제거',
    achInvisible2_5Desc: '인비저블 2.0 단일 게임에서 5줄 제거',
    achInvisible2_20Desc: '인비저블 2.0 단일 게임에서 20줄 제거',
    achSurvival60Desc: '서바이벌 모드에서 60초 생존',
    achSurvival180Desc: '서바이벌 모드에서 180초 생존',
    achSurvival300Desc: '서바이벌 모드에서 300초 생존',
    achMarathon3Desc: '마라톤 스테이지 3 도달',
    achMarathon5Desc: '마라톤 스테이지 5 도달',
    achEndless50Desc: '엔드리스 모드 단일 게임에서 50줄 제거',
    achEndless100Desc: '엔드리스 모드 단일 게임에서 100줄 제거',
    achEndless300Desc: '엔드리스 모드 단일 게임에서 300줄 제거',
    achEndless30minDesc: '엔드리스 모드 단일 게임 30분 플레이',

    // ===== 업적 설명 - 숨김 =====
    achMarathonNoFailDesc: '마라톤에서 5회 목표 검사를 실패 없이 완료',

    // ===== 설정 - 계정 =====
    accountTitle: '계정',
    accountCurrentName: '현재 닉네임',
    accountNewName: '닉네임 변경',
    accountNamePlaceholder: '새 닉네임 입력',
    accountNameHint: '닉네임은 리더보드 기록에 사용됩니다',
    accountReset: '계정 초기화',
    accountResetConfirmTitle: '계정 초기화',
    accountResetConfirmText: '계정을 초기화하시겠습니까? 현재 닉네임이 삭제되고 다시 생성해야 합니다. 리더보드 데이터에는 영향을 주지 않습니다.',
    accountCreateTitle: '계정 생성',
    accountCreateText: '리더보드 점수를 저장할 닉네임을 입력하세요:',
    accountCreated: '계정이 생성되었습니다',
    accountUpdated: '닉네임이 업데이트되었습니다',
    accountReset_done: '계정이 초기화되었습니다',
    accountInvalidName: '닉네임을 입력해야 합니다',
    accountDefaultName: '플레이어',

    // ===== 레벨 =====
    level: '레벨',
    levelShort: 'Lv.',
    exp: '경험치',
    expGained: '이번 게임 획득 경험치',
    levelUp: '레벨 업!',
    levelUpTo: '레벨 {level} 달성',
    expToNext: '다음 레벨까지 {exp} 경험치',
    expMax: '최대 레벨',
    titleNovice: '노비스',
    titleApprentice: '어프렌티스',
    titleSkilled: '숙련',
    titleExpert: '전문가',
    titleMaster: '마스터',
    titleGrandmaster: '그랜드마스터',
    titleLegend: '레전드',
    titleTranscendent: '초월자',
    resetLevel: '레벨 초기화',
    resetLevelConfirmTitle: '레벨 초기화',
    resetLevelConfirmText: '레벨과 경험치를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다!',
    resetLevelSuccess: '레벨을 초기화했습니다',

    // ===== 게임 상태 / 공통 =====
    gameOver: '게임 오버!',
    challengeComplete: '챌린지 완료',
    saveScore: '점수 저장',
    waitingToStart: '시작 대기',
    playing: '플레이 중...',
    paused: '일시정지',
    pausedLabel: '일시정지됨',
    timeup: '시간 종료!',
    getReady: '준비하세요',
    pressSpaceToStart: '스페이스 키로 게임 시작',
    pressSpaceToRestart: '스페이스 키로 다시 시작',
    challengeEnded: '챌린지 종료',
    challengeFailed: '챌린지 실패',
    congratulations: '축하합니다!',
    gameEnded: '게임이 종료되었습니다. ',
    enterNameToSave: '리더보드에 저장할 이름을 입력하세요:',
    blockExceededLine10: '블록이 10번째 줄 제한을 초과했습니다',
    survivalFailed: '서바이벌 실패!',
    marathonFailed: '마라톤 챌린지 실패!',
    targetNotReached: '목표 줄 수에 도달하지 못했습니다!',

    // ===== 게임 정보 패널 =====
    gameInfo: '게임 정보',
    score: '점수',
    lines: '제거한 줄 수',
    timeElapsed: '경과 시간',
    timeLeft: '남은 시간',
    nextGarbageLine: '다음 방해 줄',
    linesRemaining: '남은 줄 수',
    gameStatus: '상태',
    totalLinesTarget: '총 목표 줄 수',
    nextTargetIncrease: '다음 목표 증가',
    nextTargetCheck: '다음 목표 검사',

    // ===== 게임 모드 =====
    classicMode: '클래식 모드',
    challengeMode: '챌린지 모드',
    endlessMode: '엔드리스 모드',
    timedChallenge: '타임드 챌린지',
    invisibleMode: '인비저블 모드',
    invisible2Mode: '인비저블 2.0',
    sprint40: '40줄 스프린트',
    survivalMode: '서바이벌 모드',
    marathonMode: '마라톤 모드',
    classicTetris: '클래식 테트리스',

    // ===== 모드 설명 =====
    gameDescription: '클래식 퍼즐 게임의 새로운 경험! 원하는 모드를 선택하고 한계에 도전해 최고 점수를 세워보세요!',
    classicDescription: '전통적인 테트리스 플레이. 줄을 많이 제거할수록 블록이 빨리 떨어집니다. 반사신경의 한계에 도전하세요!',
    challengeDescription: '타임드, 인비저블, 40줄 스프린트, 서바이벌 등 다양한 챌린지로 한계를 시험해보세요!',
    endlessDescription: '블록 낙하 속도가 일정하게 유지되며 빨라지지 않습니다. 게임은 무한히 계속됩니다. 지구력의 한계에 도전하세요!',
    challengeSelectDesc: '챌린지 모드를 선택해 테트리스의 한계에 도전하세요!',
    timedDescription: '3분 안에 최대한 높은 점수를 획득하세요! 시간이 촉박하니 빠른 판단과 정확한 조작이 필요합니다.',
    invisibleDescription: '하단 10줄이 완전히 보이지 않습니다! 기억과 감에 의존해 플레이하세요. 주의: 블록이 10번째 줄을 넘지 않도록 하세요!',
    invisible2Desc: '블록이 착지하는 순간 사라집니다! 배치된 모든 블록이 보이지 않습니다. 기억력과 공간 지각력의 진정한 시험!',
    sprintDescription: '40줄을 최대한 빠르게 제거하세요! 시간이 전부입니다. 최고 기록에 도전하세요!',
    survivalDescription: '방해 줄이 일정 간격(10~60초, 사용자 설정 가능)으로 아래에서 올라옵니다! 오래 버틸수록 어려워집니다. 지구력이 시험됩니다!',
    marathonDescription: '계속 도전하고 계속 성장하세요! 75초마다 목표가 10줄 증가하며, 제거한 줄이 계속 누적되어야 합니다. 60초마다 목표 검사가 있으며 미달성 시 실패합니다. 지구력을 시험해보세요!',

    // ===== 블록 이름 =====
    piece1: 'I형',
    piece2: 'J형',
    piece3: 'L형',
    piece4: 'O형',
    piece5: 'S형',
    piece6: 'T형',
    piece7: 'Z형',
    nextPiece: '다음 블록',

    // ===== 설정 - 설명 패널 =====
    controls: '조작 방법',
    controlsDesc: '키보드로 블록을 이동하고 회전합니다:',
    moveLeftRight: '좌우 이동',
    rotatePiece: '회전',
    softDrop: '소프트 드롭',
    hardDrop: '하드 드롭',
    pauseGame: '일시정지',
    restartGame: '다시 시작',
    resume: '계속',
    gameModes: '게임 모드',
    modesDescription: '클래식: 전통적인 테트리스. 줄을 많이 제거할수록 빨라집니다.\n챌린지: 다양한 특수 챌린지로 한계에 도전.\n엔드리스: 낙하 속도가 일정합니다. 지구력의 한계에 도전!',
    settings: '설정',
    settingsNoteTitle: '참고:',
    settingsNoteItem1: '• 인비저블 모드에서는 미리보기와 높이 표시선 기능이 자동으로 비활성화됩니다',
    settingsNoteItem2: '• 설정은 로컬에 저장되며 다음 게임 시작 시 자동으로 불러옵니다',
    settingsNoteItem3: '• 배경 음악과 효과음은 오디오 카테고리에서 조절할 수 있습니다',

    // ===== 리더보드 =====
    leaderboard: '리더보드',
    clearScores: '현재 모드 리더보드 초기화',
    noScores: '점수 기록 없음',
    scoreSaved: '점수를 저장했습니다',
    clearSuccess: '리더보드를 초기화했습니다',
    beTheFirst: '첫 기록을 세워보세요!',
    clearConfirmTitle: '리더보드 초기화',
    clearConfirmText: '현재 모드의 리더보드를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다!',

    // ===== 업데이트 공지 =====
    updates: '업데이트 공지',
    updateHistory: '테트리스 - 버전 업데이트 기록',
    updateHistoryDesc: '왼쪽 버전 번호를 클릭해 자세한 업데이트 내용과 기능을 확인하세요',
    versionList: '버전 목록',
    versionDetails: '버전 상세',
    selectVersion: '왼쪽 버전 번호를 선택해 상세 정보를 확인하세요',
    currentVersionLabel: '현재 버전',

    // ===== 팝업 - 점수 저장 =====
    enterPlayerName: '플레이어 이름 입력',
    saveScorePrompt: '리더보드에 저장할 이름을 입력하세요:',
    playerNamePlaceholder: '플레이어 이름 입력',
    currentScore: '현재 점수: ',
    saveScoreConfirm: '이 점수를 저장하시겠습니까?',

    // ===== 결과 모달 =====
    resultTitle: '게임 결과',
    resultAchTitle: '이번 게임 달성 업적',
    resultRestart: '다시 하기',
    resultBack: '메뉴로 돌아가기',

    // ===== 챌린지 - 스프린트 / 서바이벌 / 마라톤 =====
    sprintComplete: '40줄 스프린트 완료, 축하합니다!',
    survivalComplete: '서바이벌 챌린지 종료!',
    marathonComplete: '마라톤 챌린지 완료!',
    timeUsed: '소요 시간: ',
    survivalTime: '생존 시간: ',
    totalStages: '완료 스테이지: ',
    totalLines: '총 제거 줄 수: ',
    marathonCleared: '제거됨',
    marathonTargetIncrease: '목표 증가!',
    marathonTargetReached: '목표 달성!',

    // ===== 챌린지 - 인비저블 =====
    invisibleGroupTitle: '인비저블 모드',
    invisibleGroupDesc: '하단 10줄 안 보임 / 착지 즉시 사라짐, 두 가지 변형 중 선택',
    chooseInvisibleMode: '인비저블 모드 선택',

    // ===== 챌린지 - 타임드 =====
    timedGroupTitle: '타임드 모드',
    timedGroupDesc: '타임드 스코어, 카운트다운 서바이벌, 타임드 줄 3가지 방식',
    chooseTimedMode: '타임드 모드 선택',
    timedScoreMode: '타임드 스코어',
    timedScoreDesc: '초기 시간을 사용자 설정. 제한 시간 안에 최대한 높은 점수를 획득하세요! 시간이 0이 되면 게임 종료. 최종 점수를 겨룹니다.',
    countdownSurvivalMode: '카운트다운 서바이벌',
    countdownSurvivalDesc: '초기 시간을 사용자 설정. 한 줄 제거할 때마다 시간이 증가합니다! 시간이 0이 되면 즉시 사망. 제거 효율이 시험됩니다.',
    timedLinesMode: '타임드 줄',
    timedLinesDesc: '초기 시간을 사용자 설정. 제한 시간 안에 지정된 줄 수를 제거하세요! 달성하면 승리, 시간 초과하면 실패.',

    // ===== 챌린지 - 사용자 시간 팝업 =====
    customTimeTitle: '초기 시간 설정',
    customTimeText: '초기 시간을 입력하세요 (초):',
    customTargetLinesText: '목표 줄 수를 입력하세요:',
    customTimeHint: '권장 범위: 30 ~ 600초',
    customLinesHint: '권장 범위: 10 ~ 200줄',
    customTimeInvalid: '유효한 초를 입력하세요 (10-3600)',
    customLinesInvalid: '유효한 줄 수를 입력하세요 (1-500)',

    // ===== 챌린지 - 서바이벌 간격 설정 =====
    survivalIntervalTitle: '방해 줄 간격 설정',
    survivalIntervalText: '방해 줄 상승 간격을 입력하세요 (초):',
    survivalIntervalHint: '권장 범위: 10 ~ 60초',
    survivalIntervalInvalid: '유효한 초를 입력하세요 (10-60)',

    // ===== 챌린지 - 시간 결과 =====
    timeAdded: '시간 추가',
    survivalTimeUp: '시간 종료! 서바이벌 실패',
    timedScoreEnd: '시간 종료! 최종 점수',
    timedLinesWin: '축하합니다! 목표 줄 수를 달성했습니다!',
    timedLinesLose: '시간 종료! 목표 미달성',
    linesTarget: '목표 줄 수',
    linesProgress: '진행도',
    addTimePerLine: '줄당 추가 시간',
    initialTime: '초기 시간',
    timePerLine: '줄당 추가 시간'
};

window.VERSION_DATA['ko-KR'] = [
    {
        version: '5.2.0',
        date: '2025년 4월',
        title: '타임드 모드 통합 및 하위 메뉴 최적화',
        description: '타임드 챌린지, 타임드 스코어, 카운트다운 서바이벌, 타임드 줄을 "타임드 모드" 하위 메뉴로 통합하여 챌린지 메인 메뉴를 간소화',
        features: [
            '"타임드 모드" 카드 추가, 클릭 시 하위 선택 팝업 표시',
            '타임드 챌린지, 타임드 스코어, 카운트다운 서바이벌, 타임드 줄 통합',
            '타임드 챌린지는 3분 고정, 나머지 세 가지는 사용자 시간 지원',
            '챌린지 메인 메뉴를 8개 카드에서 5개로 축소',
            '인비저블 모드 하위 선택과 동일한 인터랙션'
        ],
        current: true
    },
    {
        version: '5.1.0',
        date: '2025년 4월',
        title: '세 가지 신규 챌린지 모드 추가 및 타임드 모드 최적화',
        description: '타임드 스코어, 카운트다운 서바이벌, 타임드 줄 세 모드 추가, 초기 시간 사용자 설정 지원',
        features: [
            '"타임드 스코어" 추가: 사용자 시간, 카운트다운 0 종료, 총점 겨루기',
            '"카운트다운 서바이벌" 추가: 사용자 시간, 한 줄 제거 시 시간 추가, 0이면 사망',
            '"타임드 줄" 추가: 사용자 시간, 지정 줄 수 제거 시 승리',
            '세 신규 모드 모두 사용자 초기 시간 입력 팝업 지원',
            '리더보드가 신규 모드 데이터 기록'
        ]
    },
    {
        version: '5.0.6',
        date: '2025년 4월',
        title: '챌린지 모드 간소화, 모달 마스크 수정 및 다국어 개선',
        description: '인비저블 모드 변형 통합, 모달 마스크 닫기 통합 금지, 시간 보상 계수 감소',
        features: [
            '인비저블과 인비저블 2.0을 하나의 카드 + 하위 선택 팝업으로 통합',
            '모든 모달에서 마스크 클릭으로 닫기 금지',
            '모든 모드의 시간 보상 계수 감소'
        ]
    }
];