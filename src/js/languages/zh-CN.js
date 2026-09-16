window.LANGUAGE_PACKS = window.LANGUAGE_PACKS || {};
window.VERSION_DATA = window.VERSION_DATA || {};

window.LANGUAGE_PACKS['zh-CN'] = {

    // ===== 基础信息 =====
    gameTitle: '俄罗斯方块',
    footerCopyright: '© 2025 俄罗斯方块 - 多模式游戏',
    version: '版本',
    developedWith: '使用HTML5 Canvas和JavaScript开发',

    // ===== 通用按钮 =====
    close: '关闭',
    save: '保存',
    cancel: '取消',
    back: '返回',
    backToMenu: '返回主菜单',
    delete: '删除',

    // ===== 难度 =====
    easy: '简单',
    medium: '中等',
    hard: '困难',
    expert: '专家',
    extreme: '极限',

    // ===== 主菜单 / 通用提示 =====
    startGame: '开始游戏',
    startChallenge: '开始挑战',
    selectChallenge: '选择挑战',
    anonymousPlayer: '匿名玩家',
    failed: '失败',
    unknownMode: '未知模式',
    seconds: 's',
    heightIndicator: '堆积高度：',
    rows: '行',

    // ===== 设置 - 导航 =====
    navDisplay: '显示',
    navAudio: '音频',
    navLanguage: '语言',
    navAccount: '账号',
    navAssist: '辅助',
    navStats: '统计',
    navAchievements: '成就',
    navAbout: '说明',

    // ===== 设置 - 面板标题 =====
    panelDisplay: '显示设置',
    panelAudio: '音频设置',
    panelLanguage: '语言设置',
    panelAccount: '账号',
    panelAssist: '辅助功能',
    panelStats: '游戏统计',
    panelAchievements: '成就',
    panelAbout: '说明',

    // ===== 设置 - 音频 =====
    musicVolume: '背景音乐音量',
    musicVolumeDesc: '调整背景音乐的音量大小',
    soundVolume: '音效音量',
    soundVolumeDesc: '调整游戏音效的音量大小',

    // ===== 设置 - 音乐播放器 =====
    navMusic: '音乐',
    panelMusic: '音乐播放器',
    musicPlaylist: '播放列表',
    musicImport: '导入本地音乐',
    musicNoTrack: '暂无曲目',
    musicPlay: '播放',
    musicPause: '暂停',
    musicDelete: '删除',
    musicNowPlaying: '正在播放',
    musicImportSuccess: '导入成功',
    musicImportFailed: '导入失败',
    musicMaxReached: '已达到曲目上限',
    musicImportSkipped: '已跳过重复',
    musicImporting: '正在导入音乐',
    musicImportingText: '请稍候，正在处理音频文件...',
    musicFileTooBig: '文件过大（超过 25MB）',
    musicConfirmDelete: '确定删除这首曲目？',
    musicConfirmDeleteTitle: '删除曲目',
    musicConfirmDeleteText: '确定要删除这首曲目吗？此操作不可恢复！',
    musicNoSupport: '浏览器不支持 IndexedDB',
    musicClearAll: '清空所有音乐',
    musicClearAllConfirmTitle: '清空所有音乐',
    musicClearAllConfirmText: '确定要删除所有已导入的音乐吗？此操作不可恢复！',
    musicClearAllSuccess: '已清空所有音乐',
    bgmTitle: '背景音乐',
    bgmNowPlaying: '正在播放',
    musicLocateCurrent: '定位当前歌曲',
    musicSearchPlaceholder: '🔍 搜索...',
    musicNoResults: '没有匹配的曲目',

    // ===== 设置 - 语言 =====
    languageSetting: '界面语言',
    languageDesc: '选择游戏界面显示的语言',

    // ===== 设置 - 辅助 =====
    previewTitle: '方块预览显示',
    previewDesc: '显示当前方块下落位置的预览',
    heightlineTitle: '高度指示线',
    heightlineDesc: '显示当前方块堆积高度的参考线',
    extraPreviewTitle: '额外方块预览',
    extraPreviewDesc: '额外显示接下来 2 个即将出现的方块',
    nextPiece2: '下下个',
    nextPiece3: '下下下个',

    // ===== 设置 - 统计 =====
    statsLifetime: '累计统计',
    statsTotalGames: '总局数',
    statsTotalPlaytime: '总游戏时长',
    statsTotalLines: '总消除行数',
    statsTotalScore: '总累计得分',
    statsHighestScore: '最高分',
    statsHighestCombo: '最高连消',
    statsPieces: '方块使用次数',
    clearStats: '清空统计数据',
    clearStatsConfirmTitle: '清空统计数据',
    clearStatsConfirmText: '确定要清空所有统计数据吗？此操作不可恢复！',
    clearStatsSuccess: '已清空统计数据',

    // ===== 设置 - 成就 =====
    achievements: '成就',
    achTotalProgress: '总进度',
    achUnlockToast: '成就解锁',
    achCategoryAll: '全部',
    achCategory_milestone: '里程碑',
    achCategory_cumulative: '累计',
    achCategory_single: '单局',
    achCategory_skill: '技巧',
    achCategory_mode: '模式',
    clearAchievements: '清空成就记录',
    clearAchievementsConfirmTitle: '清空成就记录',
    clearAchievementsConfirmText: '确定要清空所有成就记录吗？此操作不可恢复！',
    clearAchievementsSuccess: '已清空成就记录',

    // ===== 成就名称 - 里程碑 =====
    achFirstGame: '初次登场',
    achFirstLine: '第一滴血',
    achFirstTetris: '四连消！',
    achGames10: '十局起步',
    achGames100: '百局老手',
    achLevel10: '十级新秀',
    achLevel20: '二十级飞驰',

    // ===== 成就名称 - 累计 =====
    achLines100: '百行斩',
    achLines1000: '千行大师',
    achHarddrop100: '百次硬降',
    achHarddrop1000: '千次硬降',
    achRotate1000: '千次旋转',

    // ===== 成就名称 - 单局 =====
    achScore10k: '万分户',
    achScore100k: '十万分殿堂',

    // ===== 成就名称 - 技巧 =====
    achClassicNoPause30: '一气呵成',
    achSprint300: '冲刺三百',
    achSprint240: '冲刺二百四',
    achSprint180: '冲刺一百八',
    achSprint150: '冲刺一百五',

    // ===== 成就名称 - 模式 =====
    achClassicLines50: '经典五十',
    achClassicLines100: '经典百行',
    achTimedScore50k: '冲分五万',
    achTimedScore100k: '冲分十万',
    achCountdown60: '倒计时一分钟',
    achCountdown120: '倒计时两分钟',
    achTimedLinesFirst: '限时达标',
    achInvisible5: '隐形入门',
    achInvisible20: '隐形精通',
    achInvisible2_5: '落地即隐',
    achInvisible2_20: '记忆大师',
    achSurvival60: '生存一分钟',
    achSurvival180: '生存三分钟',
    achSurvival300: '生存五分钟',
    achMarathon3: '马拉松三阶',
    achMarathon5: '马拉松五阶',
    achEndless50: '无尽五十行',
    achEndless100: '无尽一百',
    achEndless300: '无尽三百',
    achEndless30min: '半小时耐力',

    // ===== 成就名称 - 隐藏 =====
    achMarathonNoFail: '全程无败',

    // ===== 成就描述 - 里程碑 =====
    achFirstGameDesc: '完成你的第一局游戏',
    achFirstLineDesc: '首次消除一行方块',
    achFirstTetrisDesc: '首次单次消除 4 行',
    achGames10Desc: '累计游玩 10 局',
    achGames100Desc: '累计游玩 100 局',
    achLevel10Desc: '达到 10 级',
    achLevel20Desc: '达到 20 级',

    // ===== 成就描述 - 累计 =====
    achLines100Desc: '累计消除 100 行',
    achLines1000Desc: '累计消除 1000 行',
    achHarddrop100Desc: '累计硬降 100 次',
    achHarddrop1000Desc: '累计硬降 1000 次',
    achRotate1000Desc: '累计旋转方块 1000 次',

    // ===== 成就描述 - 单局 =====
    achScore10kDesc: '单局得分达到 10,000',
    achScore100kDesc: '单局得分达到 100,000',

    // ===== 成就描述 - 技巧 =====
    achClassicNoPause30Desc: '经典模式单局不暂停，消除 30 行',
    achSprint300Desc: '40 行冲刺 300 秒内完成',
    achSprint240Desc: '40 行冲刺 240 秒内完成',
    achSprint180Desc: '40 行冲刺 180 秒内完成',
    achSprint150Desc: '40 行冲刺 150 秒内完成',

    // ===== 成就描述 - 模式 =====
    achClassicLines50Desc: '经典模式单局消除 50 行',
    achClassicLines100Desc: '经典模式单局消除 100 行',
    achTimedScore50kDesc: '固定时间冲分单局达到 50,000 分',
    achTimedScore100kDesc: '固定时间冲分单局达到 100,000 分',
    achCountdown60Desc: '倒计时生存存活 60 秒',
    achCountdown120Desc: '倒计时生存存活 120 秒',
    achTimedLinesFirstDesc: '首次完成限时消行目标',
    achInvisible5Desc: '经典隐形模式单局消除 5 行',
    achInvisible20Desc: '经典隐形模式单局消除 20 行',
    achInvisible2_5Desc: '隐形 2.0 单局消除 5 行',
    achInvisible2_20Desc: '隐形 2.0 单局消除 20 行',
    achSurvival60Desc: '生存模式存活 60 秒',
    achSurvival180Desc: '生存模式存活 180 秒',
    achSurvival300Desc: '生存模式存活 300 秒',
    achMarathon3Desc: '马拉松达到第 3 阶段',
    achMarathon5Desc: '马拉松达到第 5 阶段',
    achEndless50Desc: '无尽模式单局消除 50 行',
    achEndless100Desc: '无尽模式单局消除 100 行',
    achEndless300Desc: '无尽模式单局消除 300 行',
    achEndless30minDesc: '无尽模式单局游玩 30 分钟',

    // ===== 成就描述 - 隐藏 =====
    achMarathonNoFailDesc: '马拉松完成 5 次目标检测且未失败',

    // ===== 设置 - 账号 =====
    accountTitle: '账号',
    accountCurrentName: '当前昵称',
    accountNewName: '修改昵称',
    accountNamePlaceholder: '输入新昵称',
    accountNameHint: '昵称将用于排行榜记录',
    accountReset: '重置账号',
    accountResetConfirmTitle: '重置账号',
    accountResetConfirmText: '确定要重置账号吗？将清除当前昵称，需要重新创建。此操作不影响排行榜数据。',
    accountCreateTitle: '创建账号',
    accountCreateText: '请输入你的昵称，用于保存排行榜成绩：',
    accountCreated: '账号已创建',
    accountUpdated: '昵称已更新',
    accountReset_done: '账号已重置',
    accountInvalidName: '昵称不能为空',
    accountDefaultName: '玩家',

    // ===== 等级 =====
    level: '等级',
    levelShort: 'Lv.',
    exp: '经验',
    expGained: '本局获得经验',
    levelUp: '升级！',
    levelUpTo: '升级到 {level} 级',
    expToNext: '距离下一级还需 {exp} 经验',
    expMax: '已满级',
    titleNovice: '新手',
    titleApprentice: '学徒',
    titleSkilled: '熟练',
    titleExpert: '高手',
    titleMaster: '大师',
    titleGrandmaster: '宗师',
    titleLegend: '传奇',
    titleTranscendent: '超凡',
    resetLevel: '重置等级',
    resetLevelConfirmTitle: '重置等级',
    resetLevelConfirmText: '确定要重置等级和经验吗？此操作不可恢复！',
    resetLevelSuccess: '等级已重置',

    // ===== 游戏状态 / 通用提示 =====
    gameOver: '游戏结束!',
    challengeComplete: '挑战完成',
    saveScore: '保存分数',
    waitingToStart: '等待开始',
    playing: '游戏中...',
    paused: '游戏暂停',
    pausedLabel: '已暂停',
    timeup: '时间到!',
    getReady: '准备开始',
    pressSpaceToStart: '按空格键以开始游戏',
    pressSpaceToRestart: '按空格键重新开始',
    challengeEnded: '挑战结束',
    challengeFailed: '挑战失败',
    congratulations: '恭喜！',
    gameEnded: '您的游戏已结束，',
    enterNameToSave: '请输入名字保存分数到排行榜：',
    blockExceededLine10: '方块超过了第10行限制',
    survivalFailed: '生存失败！',
    marathonFailed: '马拉松挑战失败！',
    targetNotReached: '未达到目标行数！',

    // ===== 游戏信息面板 =====
    gameInfo: '游戏信息',
    score: '分数',
    lines: '已消除行数',
    timeElapsed: '用时',
    timeLeft: '剩余时间',
    nextGarbageLine: '下一波垃圾行',
    linesRemaining: '剩余行数',
    gameStatus: '游戏状态',
    totalLinesTarget: '总目标行数',
    nextTargetIncrease: '下一个目标增加',
    nextTargetCheck: '下一个目标检测',

    // ===== 游戏模式 =====
    classicMode: '经典模式',
    challengeMode: '挑战模式',
    endlessMode: '无尽模式',
    timedChallenge: '限时挑战',
    invisibleMode: '隐形模式',
    invisible2Mode: '隐形2.0模式',
    sprint40: '40行冲刺',
    survivalMode: '生存模式',
    marathonMode: '马拉松模式',
    classicTetris: '经典俄罗斯方块',

    // ===== 模式描述 =====
    gameDescription: '经典益智游戏的全新体验！选择你喜欢的游戏模式，挑战自己的极限，创造最高分数！',
    classicDescription: '传统俄罗斯方块玩法，消除行数越多，下落速度越快。挑战你的反应极限！',
    challengeDescription: '包含限时模式、隐形模式、40行冲刺和生存模式等多种挑战，测试你的极限能力！',
    endlessDescription: '方块下落速度保持恒定，不会加速。游戏会无限继续，挑战你的耐力极限！',
    challengeSelectDesc: '选择一种挑战模式，测试你的俄罗斯方块极限能力！',
    timedDescription: '在3分钟内获得尽可能高的分数！时间紧迫，需要快速决策和精准操作。',
    invisibleDescription: '底部10行方块完全不可见！依靠记忆和预感来玩俄罗斯方块。注意：不要让方块超过第10行！',
    invisible2Desc: '方块落地后立即隐形！所有已放置的方块都不可见，真正考验你的记忆力和空间感知！',
    sprintDescription: '以最快速度消除40行方块！时间就是一切，挑战你的最快记录！',
    survivalDescription: '垃圾行定期从底部上升，间隔可自定义（10~60秒）！生存时间越长，难度越大，考验你的持久作战能力！',
    marathonDescription: '持续挑战，不断增长！每75s目标增加10行，消除行数需要持续累加。每60s检测目标完成情况，未达成则挑战失败。测试你的持久力！',

    // ===== 方块名称 =====
    piece1: 'I型',
    piece2: 'J型',
    piece3: 'L型',
    piece4: 'O型',
    piece5: 'S型',
    piece6: 'T型',
    piece7: 'Z型',
    nextPiece: '下一个方块',

    // ===== 设置 - 说明面板 =====
    controls: '游戏控制说明',
    controlsDesc: '使用键盘控制方块移动和旋转：',
    moveLeftRight: '左右移动',
    rotatePiece: '旋转方块',
    softDrop: '加速下落',
    hardDrop: '硬降落',
    pauseGame: '暂停游戏',
    restartGame: '重新开始游戏',
    resume: '继续',
    gameModes: '游戏模式',
    modesDescription: '经典模式：传统俄罗斯方块玩法，消除行数越多，下落速度越快。\n挑战模式：包含多种特殊挑战，测试你的极限能力。\n无尽模式：方块下落速度保持恒定，挑战你的耐力极限！',
    settings: '游戏设置',
    settingsNoteTitle: '注意：',
    settingsNoteItem1: '• 在隐形模式下，预览和高度线功能将被自动禁用',
    settingsNoteItem2: '• 设置会保存到本地，下次游戏时自动加载',
    settingsNoteItem3: '• 背景音乐和音效可在音频分类中调整',

    // ===== 排行榜 =====
    leaderboard: '排行榜',
    clearScores: '清空当前模式排行榜',
    noScores: '暂无分数记录',
    scoreSaved: '当前分数已保存',
    clearSuccess: '已清空当前排行榜',
    beTheFirst: '成为第一个创造记录的人！',
    clearConfirmTitle: '清空排行榜',
    clearConfirmText: '确定要清空当前模式的排行榜吗？此操作不可恢复！',

    // ===== 更新公告 =====
    updates: '更新公告',
    updateHistory: '俄罗斯方块 - 版本更新历史',
    updateHistoryDesc: '点击左侧版本号查看详细的更新内容和功能特性',
    versionList: '版本列表',
    versionDetails: '版本详情',
    selectVersion: '选择左侧版本号查看详细信息',
    currentVersionLabel: '当前版本',

    // ===== 弹窗 - 保存分数 =====
    enterPlayerName: '请输入玩家名称',
    saveScorePrompt: '请输入您的名字保存到排行榜：',
    playerNamePlaceholder: '请输入玩家名称',
    currentScore: '当前分数: ',
    saveScoreConfirm: '确定要保存分数吗？',

    // ===== 结算弹窗 =====
    resultTitle: '本局结算',
    resultAchTitle: '本局解锁成就',
    resultRestart: '再来一局',
    resultBack: '返回菜单',

    // ===== 挑战 - 冲刺 / 生存 / 马拉松 =====
    sprintComplete: '恭喜完成40行冲刺！',
    survivalComplete: '生存模式挑战结束！',
    marathonComplete: '马拉松挑战完成！',
    timeUsed: '用时: ',
    survivalTime: '生存时间: ',
    totalStages: '完成阶段: ',
    totalLines: '总消除行数: ',
    marathonCleared: '已消除',
    marathonTargetIncrease: '目标增加!',
    marathonTargetReached: '目标达成!',

    // ===== 挑战 - 隐形模式 =====
    invisibleGroupTitle: '隐形模式',
    invisibleGroupDesc: '底部10行不可见 / 落地后立即隐形，两种变体任你选择',
    chooseInvisibleMode: '选择隐形模式',

    // ===== 挑战 - 限时模式 =====
    timedGroupTitle: '限时模式',
    timedGroupDesc: '包含固定时间冲分、倒计时生存、限时消行数3种玩法',
    chooseTimedMode: '选择限时模式',
    timedScoreMode: '固定时间冲分',
    timedScoreDesc: '自定义初始时间，在限定时间内获得尽可能高的总分！时间归零游戏结束，比拼最终分数。',
    countdownSurvivalMode: '倒计时生存',
    countdownSurvivalDesc: '自定义初始时间，每消除一行增加时间！时间归零即死，考验你的消行效率。',
    timedLinesMode: '限时消行数',
    timedLinesDesc: '自定义初始时间，在限定时间内消除指定行数！消够即胜利，时间归零则失败。',

    // 极速挑战模式
    speedChallengeMode: '极速挑战',
    speedChallengeDesc: '方块速度恒定，每个方块必须在限定时间内落地，超时次数达到上限即失败！',
    speedSetupTitle: '设置极速挑战',
    speedTimeLimitText: '每个方块限时（秒）：',
    speedTimeLimitHint: '建议范围：1 ~ 30 秒',
    speedMaxTimeoutsText: '允许超时次数：',
    speedMaxTimeoutsHint: '建议范围：1 ~ 10 次',
    speedTimeLimitInvalid: '请输入有效的秒数（1-30）',
    speedMaxTimeoutsInvalid: '请输入有效的次数（1-10）',
    speedTimeoutLabel: '超时',
    speedBlockTimerLabel: '当前方块限时',
    speedFailed: '超时次数已达上限！',

    // ===== 挑战 - 自定义时间弹窗 =====
    customTimeTitle: '设置初始时间',
    customTimeText: '请输入初始时间（秒）：',
    customTargetLinesText: '请输入目标行数：',
    customTimeHint: '建议范围：30 ~ 600 秒',
    customLinesHint: '建议范围：10 ~ 200 行',
    customTimeInvalid: '请输入有效的秒数（10-3600）',
    customLinesInvalid: '请输入有效的行数（1-500）',

    // ===== 挑战 - 生存模式间隔设置 =====
    survivalIntervalTitle: '设置垃圾行间隔',
    survivalIntervalText: '请输入垃圾行上升间隔（秒）：',
    survivalIntervalHint: '建议范围：10 ~ 60 秒',
    survivalIntervalInvalid: '请输入有效的秒数（10-60）',

    // ===== 挑战 - 时间结果提示 =====
    timeAdded: '加时',
    survivalTimeUp: '时间到！生存失败',
    timedScoreEnd: '时间到！最终得分',
    timedLinesWin: '恭喜！成功消除目标行数！',
    timedLinesLose: '时间到！未能完成目标',
    linesTarget: '目标行数',
    linesProgress: '进度',
    addTimePerLine: '每行加时',
    initialTime: '初始时间',
    timePerLine: '每行加时',

    // ===== 每日任务 =====
    dailyTaskTitle: '每日任务',
    dailyTaskRefreshIn: '距刷新还有',
    dailyTaskAllBonus: '全部完成奖励',
    dailyTaskClaim: '领取',
    dailyTaskClaimed: '已领取',

    // 单局任务
    dailyTaskSingleLines10: '单局消除 10 行',
    dailyTaskSingleLines20: '单局消除 20 行',
    dailyTaskSingleLines40: '单局消除 40 行',
    dailyTaskSingleLines60: '单局消除 60 行',
    dailyTaskSingleScore10k: '单局得分 10,000',
    dailyTaskSingleScore30k: '单局得分 30,000',
    dailyTaskSingleScore60k: '单局得分 60,000',
    dailyTaskSingleScore100k: '单局得分 100,000',
    dailyTaskCombo3: '单局 3 连消',
    dailyTaskCombo5: '单局 5 连消',
    dailyTaskCombo8: '单局 8 连消',
    dailyTaskSingleTetris1: '单局 1 次四连消',
    dailyTaskSingleTetris2: '单局 2 次四连消',
    dailyTaskSingleTetris5: '单局 5 次四连消',
    dailyTaskSingleNoPause: '单局不暂停完成',
    dailyTaskSingleHarddrop30: '单局硬降 30 次',

    // 累计任务
    dailyTaskGames3: '今天玩 3 局',
    dailyTaskGames5: '今天玩 5 局',
    dailyTaskGames10: '今天玩 10 局',
    dailyTaskLines50: '今天消除 50 行',
    dailyTaskLines100: '今天消除 100 行',
    dailyTaskLines200: '今天消除 200 行',
    dailyTaskLines400: '今天消除 400 行',
    dailyTaskScore50k: '今天得分 50,000',
    dailyTaskScore100k: '今天得分 100,000',
    dailyTaskScore300k: '今天得分 300,000',
    dailyTaskScore500k: '今天得分 500,000',
    dailyTaskTetris1: '今天 1 次四连消',
    dailyTaskTetris3: '今天 3 次四连消',
    dailyTaskTetris8: '今天 8 次四连消',
    dailyTaskNoPause1: '今天 1 局不暂停完成',
    dailyTaskNoPause3: '今天 3 局不暂停完成',
    dailyTaskNoPause5: '今天 5 局不暂停完成',
    dailyTaskPlay5min: '今天游玩 5 分钟',
    dailyTaskPlay15min: '今天游玩 15 分钟',
    dailyTaskPlay30min: '今天游玩 30 分钟',
    dailyTaskPlay60min: '今天游玩 60 分钟',
    dailyTaskHarddrop100: '今天硬降 100 次',
    dailyTaskHarddrop300: '今天硬降 300 次',
    dailyTaskRotate500: '今天旋转 500 次'
};

window.VERSION_DATA['zh-CN'] = [
    {
        version: '5.2.0',
        date: '2025年4月',
        title: '限时模式整合与二级菜单优化',
        description: '将限时挑战、固定时间冲分、倒计时生存、限时消行数整合进"限时模式"二级菜单，简化挑战模式主菜单',
        features: [
            '新增"限时模式"卡片，点击进入二级选择弹窗',
            '限时挑战、固定时间冲分、倒计时生存、限时消行数统一收纳',
            '限时挑战固定3分钟，其他三个模式支持自定义时间',
            '挑战模式主菜单从8个卡片精简至5个',
            '与隐形模式的二级选择交互保持一致'
        ],
        current: true
    },
    {
        version: '5.1.0',
        date: '2025年4月',
        title: '新增三大挑战模式与限时模式优化',
        description: '新增固定时间冲分、倒计时生存、限时消行数三个模式，支持自定义初始时间',
        features: [
            '新增「固定时间冲分」：自定义时间，倒计时归零结束，比拼总分',
            '新增「倒计时生存」：自定义时间，每消一行加时，归零即死',
            '新增「限时消行数」：自定义时间，消够指定行数胜利',
            '三个新模式支持自定义初始时间输入弹窗',
            '排行榜记录新模式数据'
        ]
    },
    {
        version: '5.0.6',
        date: '2025年4月',
        title: '挑战模式精简、弹窗遮罩修复与多语言完善',
        description: '合并隐形模式变体、统一禁止弹窗遮罩关闭、降低时间奖励系数',
        features: [
            '隐形模式与隐形2.0合并为一个卡片 + 二级选择弹窗',
            '所有弹窗均不允许点击遮罩关闭',
            '降低各模式时间奖励系数'
        ]
    }
];