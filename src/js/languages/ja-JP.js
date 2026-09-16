window.LANGUAGE_PACKS = window.LANGUAGE_PACKS || {};
window.VERSION_DATA = window.VERSION_DATA || {};

window.LANGUAGE_PACKS['ja-JP'] = {

    // ===== 基本情報 =====
    gameTitle: 'テトリス',
    footerCopyright: '© 2025 テトリス - マルチモードゲーム',
    version: 'バージョン',
    developedWith: 'HTML5 Canvas と JavaScript で開発',

    // ===== 共通ボタン =====
    close: '閉じる',
    save: '保存',
    cancel: 'キャンセル',
    back: '戻る',
    backToMenu: 'メニューに戻る',
    delete: '削除',

    // ===== 難易度 =====
    easy: 'かんたん',
    medium: 'ふつう',
    hard: 'むずかしい',
    expert: 'エキスパート',
    extreme: '極限',

    // ===== メインメニュー / 共通 =====
    startGame: 'ゲームスタート',
    startChallenge: 'チャレンジ開始',
    selectChallenge: 'チャレンジ選択',
    anonymousPlayer: '匿名プレイヤー',
    failed: '失敗',
    unknownMode: '不明なモード',
    seconds: '秒',
    heightIndicator: '積み上げ高さ：',
    rows: '行',

    // ===== 設定 - ナビ =====
    navDisplay: '表示',
    navAudio: 'オーディオ',
    navLanguage: '言語',
    navAccount: 'アカウント',
    navAssist: 'アシスト',
    navStats: '統計',
    navAchievements: '実績',
    navAbout: '説明',

    // ===== 設定 - パネルタイトル =====
    panelDisplay: '表示設定',
    panelAudio: 'オーディオ設定',
    panelLanguage: '言語設定',
    panelAccount: 'アカウント',
    panelAssist: 'アクセシビリティ',
    panelStats: 'ゲーム統計',
    panelAchievements: '実績',
    panelAbout: '説明',

    // ===== 設定 - オーディオ =====
    musicVolume: 'BGM 音量',
    musicVolumeDesc: 'BGM の音量を調整します',
    soundVolume: '効果音音量',
    soundVolumeDesc: '効果音の音量を調整します',

    // ===== 設定 - 音楽プレイヤー =====
    navMusic: '音楽',
    panelMusic: '音楽プレイヤー',
    musicPlaylist: 'プレイリスト',
    musicImport: 'ローカル音楽をインポート',
    musicNoTrack: '曲がありません',
    musicPlay: '再生',
    musicPause: '一時停止',
    musicDelete: '削除',
    musicNowPlaying: '再生中',
    musicImportSuccess: 'インポート成功',
    musicMaxReached: '曲数の上限に達しました',
    musicImportFailed: 'インポート失敗',
    musicImportSkipped: '重複をスキップしました',
    musicImporting: '音楽をインポート中',
    musicImportingText: 'お待ちください、音声ファイルを処理しています...',
    musicFileTooBig: 'ファイルが大きすぎます（25MB 超）',
    musicConfirmDelete: 'この曲を削除しますか？',
    musicConfirmDeleteTitle: '曲を削除',
    musicConfirmDeleteText: 'この曲を削除してもよろしいですか？この操作は元に戻せません！',
    musicNoSupport: 'ブラウザが IndexedDB に対応していません',
    musicClearAll: 'すべての音楽を削除',
    musicClearAllConfirmTitle: 'すべての音楽を削除',
    musicClearAllConfirmText: 'インポートしたすべての音楽を削除してもよろしいですか？この操作は元に戻せません！',
    musicClearAllSuccess: 'すべての音楽を削除しました',
    bgmTitle: 'BGM',
    bgmNowPlaying: '再生中',

    // ===== 設定 - 言語 =====
    languageSetting: 'インターフェース言語',
    languageDesc: 'ゲームインターフェースの表示言語を選択します',

    // ===== 設定 - アシスト =====
    previewTitle: 'ピースプレビュー',
    previewDesc: '現在のピースの落下位置をプレビュー表示します',
    heightlineTitle: '高さインジケーターライン',
    heightlineDesc: '現在の積み上げ高さの参考ラインを表示します',
    extraPreviewTitle: '追加ピースプレビュー',
    extraPreviewDesc: '次に出現する 2 つのピースを追加表示します',
    nextPiece2: '次の次',
    nextPiece3: '次の次の次',

    // ===== 設定 - 統計 =====
    statsLifetime: '累計統計',
    statsTotalGames: '総ゲーム数',
    statsTotalPlaytime: '総プレイ時間',
    statsTotalLines: '総消去ライン数',
    statsTotalScore: '総累計スコア',
    statsHighestScore: 'ハイスコア',
    statsHighestCombo: '最大コンボ',
    statsPieces: 'ピース使用回数',
    clearStats: '統計をクリア',
    clearStatsConfirmTitle: '統計をクリア',
    clearStatsConfirmText: 'すべての統計をクリアしてもよろしいですか？この操作は元に戻せません！',
    clearStatsSuccess: '統計をクリアしました',

    // ===== 設定 - 実績 =====
    achievements: '実績',
    achTotalProgress: '総進捗',
    achUnlockToast: '実績解除',
    achCategoryAll: 'すべて',
    achCategory_milestone: 'マイルストーン',
    achCategory_cumulative: '累計',
    achCategory_single: 'シングル',
    achCategory_skill: 'スキル',
    achCategory_mode: 'モード',
    clearAchievements: '実績記録をクリア',
    clearAchievementsConfirmTitle: '実績記録をクリア',
    clearAchievementsConfirmText: 'すべての実績記録をクリアしてもよろしいですか？この操作は元に戻せません！',
    clearAchievementsSuccess: '実績記録をクリアしました',

    // ===== 実績名 - マイルストーン =====
    achFirstGame: '初登場',
    achFirstLine: 'ファーストブラッド',
    achFirstTetris: 'テトリス！',
    achGames10: '10 戦目',
    achGames100: 'ベテラン',
    achLevel10: '新星',
    achLevel20: 'スピードスター',

    // ===== 実績名 - 累計 =====
    achLines100: '100 ライン斬り',
    achLines1000: 'ラインマスター',
    achHarddrop100: 'ハードドロップ 100 回',
    achHarddrop1000: 'ハードドロップ 1000 回',
    achRotate1000: '回転 1000 回',

    // ===== 実績名 - シングル =====
    achScore10k: '5 桁達成',
    achScore100k: '6 桁達成',

    // ===== 実績名 - スキル =====
    achClassicNoPause30: 'ノンストップ',
    achSprint300: 'スプリント 300',
    achSprint240: 'スプリント 240',
    achSprint180: 'スプリント 180',
    achSprint150: 'スプリント 150',

    // ===== 実績名 - モード =====
    achClassicLines50: 'クラシック 50',
    achClassicLines100: 'クラシック 100',
    achTimedScore50k: 'タイムド 50K',
    achTimedScore100k: 'タイムド 100K',
    achCountdown60: 'カウントダウン 60',
    achCountdown120: 'カウントダウン 120',
    achTimedLinesFirst: 'タイムド目標達成',
    achInvisible5: 'インビジブル入門',
    achInvisible20: 'インビジブル熟練',
    achInvisible2_5: '着地で消える',
    achInvisible2_20: '記憶の達人',
    achSurvival60: 'サバイバル 60',
    achSurvival180: 'サバイバル 180',
    achSurvival300: 'サバイバル 300',
    achMarathon3: 'マラソン ステージ 3',
    achMarathon5: 'マラソン ステージ 5',
    achEndless50: 'エンドレス 50',
    achEndless100: 'エンドレス 100',
    achEndless300: 'エンドレス 300',
    achEndless30min: '耐久 30 分',

    // ===== 実績名 - 隠し =====
    achMarathonNoFail: '完全無敗',

    // ===== 実績説明 - マイルストーン =====
    achFirstGameDesc: '初めてのゲームを完了する',
    achFirstLineDesc: '初めて 1 ラインを消去する',
    achFirstTetrisDesc: '初めて 4 ラインを同時に消去する',
    achGames10Desc: '累計 10 ゲームをプレイ',
    achGames100Desc: '累計 100 ゲームをプレイ',
    achLevel10Desc: 'レベル 10 に到達',
    achLevel20Desc: 'レベル 20 に到達',

    // ===== 実績説明 - 累計 =====
    achLines100Desc: '累計 100 ラインを消去',
    achLines1000Desc: '累計 1000 ラインを消去',
    achHarddrop100Desc: '累計 100 回ハードドロップ',
    achHarddrop1000Desc: '累計 1000 回ハードドロップ',
    achRotate1000Desc: '累計 1000 回ピースを回転',

    // ===== 実績説明 - シングル =====
    achScore10kDesc: '1 ゲームで 10,000 点を獲得',
    achScore100kDesc: '1 ゲームで 100,000 点を獲得',

    // ===== 実績説明 - スキル =====
    achClassicNoPause30Desc: 'クラシックモードで一時停止せず 30 ライン消去',
    achSprint300Desc: '40 ラインスプリントを 300 秒以内に完了',
    achSprint240Desc: '40 ラインスプリントを 240 秒以内に完了',
    achSprint180Desc: '40 ラインスプリントを 180 秒以内に完了',
    achSprint150Desc: '40 ラインスプリントを 150 秒以内に完了',

    // ===== 実績説明 - モード =====
    achClassicLines50Desc: 'クラシックモード 1 ゲームで 50 ライン消去',
    achClassicLines100Desc: 'クラシックモード 1 ゲームで 100 ライン消去',
    achTimedScore50kDesc: 'タイムドスコア 1 ゲームで 50,000 点',
    achTimedScore100kDesc: 'タイムドスコア 1 ゲームで 100,000 点',
    achCountdown60Desc: 'カウントダウンサバイバルで 60 秒生存',
    achCountdown120Desc: 'カウントダウンサバイバルで 120 秒生存',
    achTimedLinesFirstDesc: '初めてタイムドライン目標を達成',
    achInvisible5Desc: 'クラシックインビジブル 1 ゲームで 5 ライン消去',
    achInvisible20Desc: 'クラシックインビジブル 1 ゲームで 20 ライン消去',
    achInvisible2_5Desc: 'インビジブル 2.0 で 1 ゲーム 5 ライン消去',
    achInvisible2_20Desc: 'インビジブル 2.0 で 1 ゲーム 20 ライン消去',
    achSurvival60Desc: 'サバイバルモードで 60 秒生存',
    achSurvival180Desc: 'サバイバルモードで 180 秒生存',
    achSurvival300Desc: 'サバイバルモードで 300 秒生存',
    achMarathon3Desc: 'マラソンでステージ 3 に到達',
    achMarathon5Desc: 'マラソンでステージ 5 に到達',
    achEndless50Desc: 'エンドレスモード 1 ゲームで 50 ライン消去',
    achEndless100Desc: 'エンドレスモード 1 ゲームで 100 ライン消去',
    achEndless300Desc: 'エンドレスモード 1 ゲームで 300 ライン消去',
    achEndless30minDesc: 'エンドレスモードを 1 ゲーム 30 分プレイ',

    // ===== 実績説明 - 隠し =====
    achMarathonNoFailDesc: 'マラソンで 5 回の目標チェックを失敗せず完了',

    // ===== 設定 - アカウント =====
    accountTitle: 'アカウント',
    accountCurrentName: '現在のニックネーム',
    accountNewName: 'ニックネーム変更',
    accountNamePlaceholder: '新しいニックネームを入力',
    accountNameHint: 'ニックネームはランキング記録に使用されます',
    accountReset: 'アカウントをリセット',
    accountResetConfirmTitle: 'アカウントをリセット',
    accountResetConfirmText: 'アカウントをリセットしてもよろしいですか？現在のニックネームが消去され、再作成が必要になります。ランキングデータには影響しません。',
    accountCreateTitle: 'アカウント作成',
    accountCreateText: 'ランキングスコアを保存するためのニックネームを入力してください：',
    accountCreated: 'アカウントを作成しました',
    accountUpdated: 'ニックネームを更新しました',
    accountReset_done: 'アカウントをリセットしました',
    accountInvalidName: 'ニックネームを入力してください',
    accountDefaultName: 'プレイヤー',

    // ===== レベル =====
    level: 'レベル',
    levelShort: 'Lv.',
    exp: '経験値',
    expGained: '今回獲得した経験値',
    levelUp: 'レベルアップ！',
    levelUpTo: 'レベル {level} に到達',
    expToNext: '次のレベルまで {exp} 経験値',
    expMax: '最大レベル',
    titleNovice: 'ノービス',
    titleApprentice: 'アプレンティス',
    titleSkilled: 'スキルド',
    titleExpert: 'エキスパート',
    titleMaster: 'マスター',
    titleGrandmaster: 'グランドマスター',
    titleLegend: 'レジェンド',
    titleTranscendent: '超越者',
    resetLevel: 'レベルをリセット',
    resetLevelConfirmTitle: 'レベルをリセット',
    resetLevelConfirmText: 'レベルと経験値をリセットしてもよろしいですか？この操作は元に戻せません！',
    resetLevelSuccess: 'レベルをリセットしました',

    // ===== ゲーム状態 / 共通 =====
    gameOver: 'ゲームオーバー！',
    challengeComplete: 'チャレンジクリア',
    saveScore: 'スコアを保存',
    waitingToStart: '開始待ち',
    playing: 'プレイ中...',
    paused: '一時停止中',
    pausedLabel: '一時停止',
    timeup: '時間切れ！',
    getReady: '準備してください',
    pressSpaceToStart: 'スペースキーでゲーム開始',
    pressSpaceToRestart: 'スペースキーでリスタート',
    challengeEnded: 'チャレンジ終了',
    challengeFailed: 'チャレンジ失敗',
    congratulations: 'おめでとう！',
    gameEnded: 'ゲームが終了しました。',
    enterNameToSave: 'ランキングに保存する名前を入力してください：',
    blockExceededLine10: 'ブロックが 10 行目の制限を超えました',
    survivalFailed: 'サバイバル失敗！',
    marathonFailed: 'マラソンチャレンジ失敗！',
    targetNotReached: '目標ライン数に達しませんでした！',

    // ===== ゲーム情報パネル =====
    gameInfo: 'ゲーム情報',
    score: 'スコア',
    lines: '消去ライン数',
    timeElapsed: '経過時間',
    timeLeft: '残り時間',
    nextGarbageLine: '次のおじゃまライン',
    linesRemaining: '残りライン数',
    gameStatus: 'ステータス',
    totalLinesTarget: '総目標ライン数',
    nextTargetIncrease: '次の目標増加',
    nextTargetCheck: '次の目標チェック',

    // ===== ゲームモード =====
    classicMode: 'クラシックモード',
    challengeMode: 'チャレンジモード',
    endlessMode: 'エンドレスモード',
    timedChallenge: 'タイムドチャレンジ',
    invisibleMode: 'インビジブルモード',
    invisible2Mode: 'インビジブル 2.0',
    sprint40: '40 ラインスプリント',
    survivalMode: 'サバイバルモード',
    marathonMode: 'マラソンモード',
    classicTetris: 'クラシックテトリス',

    // ===== モード説明 =====
    gameDescription: 'クラシックパズルゲームの新しい体験！好きなモードを選び、限界に挑戦してハイスコアを目指そう！',
    classicDescription: '伝統的なテトリスの遊び方。ラインを消すほど落下速度が上がります。反射神経の限界に挑戦！',
    challengeDescription: 'タイムド、インビジブル、40 ラインスプリント、サバイバルなど多彩なチャレンジで限界を試そう！',
    endlessDescription: 'ピースの落下速度は一定で加速しません。ゲームは無限に続きます。持久力の限界に挑戦！',
    challengeSelectDesc: 'チャレンジモードを選んで、テトリスの限界に挑戦しよう！',
    timedDescription: '3 分以内にできるだけ高いスコアを獲得！時間が迫る中、素早い判断と正確な操作が求められます。',
    invisibleDescription: '下 10 行が完全に見えません！記憶と勘を頼りにプレイ。注意：ブロックを 10 行目より上に積まないで！',
    invisible2Desc: 'ピースは着地した瞬間に見えなくなります！配置済みのピースはすべて非表示。記憶力と空間認識の真の試練！',
    sprintDescription: '40 ラインを最速で消去！時間こそがすべて。自己最速記録に挑戦しよう！',
    survivalDescription: 'おじゃまラインが一定間隔（10～60 秒、カスタム可）で下から上昇！生存時間が長いほど難易度アップ。持久力が試されます！',
    marathonDescription: '続けて挑戦、どんどん成長！75 秒ごとに目標が 10 ライン増え、消去ラインを累積していく必要があります。60 秒ごとに目標チェックがあり、未達成なら失敗。持久力を試そう！',

    // ===== ピース名 =====
    piece1: 'I 型',
    piece2: 'J 型',
    piece3: 'L 型',
    piece4: 'O 型',
    piece5: 'S 型',
    piece6: 'T 型',
    piece7: 'Z 型',
    nextPiece: '次のピース',

    // ===== 設定 - 説明パネル =====
    controls: '操作方法',
    controlsDesc: 'キーボードでピースの移動と回転を操作します：',
    moveLeftRight: '左右移動',
    rotatePiece: '回転',
    softDrop: 'ソフトドロップ',
    hardDrop: 'ハードドロップ',
    pauseGame: '一時停止',
    restartGame: 'リスタート',
    resume: '再開',
    gameModes: 'ゲームモード',
    modesDescription: 'クラシック：伝統的なテトリス。ラインを消すほど落下速度が上がります。\nチャレンジ：多彩な特殊チャレンジで限界に挑戦。\nエンドレス：落下速度は一定。持久力の限界に挑戦！',
    settings: '設定',
    settingsNoteTitle: '注意：',
    settingsNoteItem1: '• インビジブルモードでは、プレビューと高さライン機能が自動的に無効になります',
    settingsNoteItem2: '• 設定はローカルに保存され、次回起動時に自動で読み込まれます',
    settingsNoteItem3: '• BGM と効果音はオーディオカテゴリで調整できます',

    // ===== ランキング =====
    leaderboard: 'ランキング',
    clearScores: '現在のモードのランキングをクリア',
    noScores: 'スコア記録がありません',
    scoreSaved: 'スコアを保存しました',
    clearSuccess: 'ランキングをクリアしました',
    beTheFirst: '最初の記録を作ろう！',
    clearConfirmTitle: 'ランキングをクリア',
    clearConfirmText: '現在のモードのランキングをクリアしてもよろしいですか？この操作は元に戻せません！',

    // ===== 更新情報 =====
    updates: '更新情報',
    updateHistory: 'テトリス - バージョン更新履歴',
    updateHistoryDesc: '左側のバージョン番号をクリックして詳細な更新内容と機能を確認',
    versionList: 'バージョン一覧',
    versionDetails: 'バージョン詳細',
    selectVersion: '左側のバージョン番号を選択して詳細を表示',
    currentVersionLabel: '現在のバージョン',

    // ===== ポップアップ - スコア保存 =====
    enterPlayerName: 'プレイヤー名を入力',
    saveScorePrompt: 'ランキングに保存する名前を入力してください：',
    playerNamePlaceholder: 'プレイヤー名を入力',
    currentScore: '現在のスコア: ',
    saveScoreConfirm: 'このスコアを保存しますか？',

    // ===== リザルトモーダル =====
    resultTitle: '今回の結果',
    resultAchTitle: '今回解除した実績',
    resultRestart: 'もう一度',
    resultBack: 'メニューに戻る',

    // ===== チャレンジ - スプリント / サバイバル / マラソン =====
    sprintComplete: '40 ラインスプリント完了、おめでとう！',
    survivalComplete: 'サバイバルチャレンジ終了！',
    marathonComplete: 'マラソンチャレンジ完了！',
    timeUsed: 'タイム: ',
    survivalTime: '生存時間: ',
    totalStages: 'クリアステージ: ',
    totalLines: '総消去ライン数: ',
    marathonCleared: '消去済み',
    marathonTargetIncrease: '目標増加！',
    marathonTargetReached: '目標達成！',

    // ===== チャレンジ - インビジブル =====
    invisibleGroupTitle: 'インビジブルモード',
    invisibleGroupDesc: '下 10 行が見えない / 着地で即消える、2 つのバリエーションから選択',
    chooseInvisibleMode: 'インビジブルモードを選択',

    // ===== チャレンジ - タイムド =====
    timedGroupTitle: 'タイムドモード',
    timedGroupDesc: 'タイムドスコア、カウントダウンサバイバル、タイムドラインの 3 種類',
    chooseTimedMode: 'タイムドモードを選択',
    timedScoreMode: 'タイムドスコア',
    timedScoreDesc: '初期時間をカスタム。制限時間内にできるだけ高いスコアを獲得！時間がゼロになるとゲーム終了。最終スコアを競います。',
    countdownSurvivalMode: 'カウントダウンサバイバル',
    countdownSurvivalDesc: '初期時間をカスタム。1 ライン消すごとに時間が増加！時間がゼロになると即死。消去効率が試されます。',
    timedLinesMode: 'タイムドライン',
    timedLinesDesc: '初期時間をカスタム。制限時間内に指定ライン数を消去！達成すれば勝利、時間切れなら失敗。',

    // ===== チャレンジ - カスタム時間ポップアップ =====
    customTimeTitle: '初期時間を設定',
    customTimeText: '初期時間を入力（秒）：',
    customTargetLinesText: '目標ライン数を入力：',
    customTimeHint: '推奨範囲：30 ～ 600 秒',
    customLinesHint: '推奨範囲：10 ～ 200 ライン',
    customTimeInvalid: '有効な秒数を入力してください（10-3600）',
    customLinesInvalid: '有効なライン数を入力してください（1-500）',

    // ===== チャレンジ - サバイバル間隔設定 =====
    survivalIntervalTitle: 'おじゃまライン間隔を設定',
    survivalIntervalText: 'おじゃまラインの上昇間隔を入力（秒）：',
    survivalIntervalHint: '推奨範囲：10 ～ 60 秒',
    survivalIntervalInvalid: '有効な秒数を入力してください（10-60）',

    // ===== チャレンジ - 時間結果 =====
    timeAdded: '時間追加',
    survivalTimeUp: '時間切れ！サバイバル失敗',
    timedScoreEnd: '時間切れ！最終スコア',
    timedLinesWin: 'おめでとう！目標ライン数を達成しました！',
    timedLinesLose: '時間切れ！目標未達成',
    linesTarget: '目標ライン数',
    linesProgress: '進捗',
    addTimePerLine: '1 ラインあたりの加算時間',
    initialTime: '初期時間',
    timePerLine: '1 ラインあたりの加算時間'
};

window.VERSION_DATA['ja-JP'] = [
    {
        version: '5.2.0',
        date: '2025年4月',
        title: 'タイムドモード統合とサブメニュー最適化',
        description: 'タイムドチャレンジ、タイムドスコア、カウントダウンサバイバル、タイムドラインを「タイムドモード」サブメニューに統合し、チャレンジメインメニューを簡素化',
        features: [
            '「タイムドモード」カードを追加。クリックでサブ選択ポップアップを表示',
            'タイムドチャレンジ、タイムドスコア、カウントダウンサバイバル、タイムドラインを統合',
            'タイムドチャレンジは 3 分固定、他の 3 つはカスタム時間に対応',
            'チャレンジメインメニューを 8 枚から 5 枚に削減',
            'インビジブルモードのサブ選択との操作感を統一'
        ],
        current: true
    },
    {
        version: '5.1.0',
        date: '2025年4月',
        title: '3 つの新チャレンジモード追加とタイムドモード最適化',
        description: 'タイムドスコア、カウントダウンサバイバル、タイムドラインの 3 モードを追加。初期時間のカスタムに対応',
        features: [
            '「タイムドスコア」追加：カスタム時間、カウントダウン終了で終了、総スコアを競う',
            '「カウントダウンサバイバル」追加：カスタム時間、1 ラインごとに加算、ゼロで即死',
            '「タイムドライン」追加：カスタム時間、指定ライン数を消せば勝利',
            '3 つの新モードがカスタム初期時間入力ポップアップに対応',
            'ランキングが新モードのデータを記録'
        ]
    },
    {
        version: '5.0.6',
        date: '2025年4月',
        title: 'チャレンジモード簡素化、モーダルマスク修正、多言語改善',
        description: 'インビジブルモードのバリエーションを統合、モーダルマスクでの閉じる操作を統一禁止、時間報酬係数を低減',
        features: [
            'インビジブルとインビジブル 2.0 を 1 枚のカード + サブ選択ポップアップに統合',
            'すべてのモーダルでマスククリックによる閉じる操作を禁止',
            '全モードの時間報酬係数を低減'
        ]
    }
];