// 本地音乐配置
// 请按照以下格式添加你的本地音乐
var localMusic = [
    // 示例音乐配置（请根据实际情况修改路径）
    {
        name: 'Starlight',
        artist: 'ウルトラ超特急',
        url: './music/starlight.mp3',        // 音乐文件路径
        cover: './cover/starlight.jpg',       // 封面图片路径
        lrc: './lrc/starlight.lrc'          // 歌词文件路径（可选）
    },
    {
        name: '一句话形容不了终极笔记',
        artist: '应有棠、叶落梦中、御A桑、灬阿楚灬、绯言、小山xl、霄镁、烫不直的自然卷、堇墨安歌、天罗',
        url: './music/一句话形容不了终极笔记.mp3',
        cover: './cover/一句话形容不了终极笔记.jpg',
        lrc: './lrc/一句话形容不了终极笔记.lrc'
    },
];

// 远程音乐列表配置（可选）
// 如果配置了 remoteMusic，会从指定 URL 获取音乐列表
// var remoteMusic = "./musiclist.json";
