package com.drama.config;

import com.drama.enums.ClipTag;
import com.drama.model.Danmaku;
import com.drama.model.Drama;
import com.drama.model.Episode;
import com.drama.model.HighlightClip;
import com.drama.model.InteractionOption;
import com.drama.model.InteractionPoint;
import com.drama.model.User;
import com.drama.repository.DanmakuRepository;
import com.drama.repository.DramaRepository;
import com.drama.repository.EpisodeRepository;
import com.drama.repository.HighlightClipRepository;
import com.drama.repository.InteractionPointRepository;
import com.drama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DramaRepository dramaRepository;
    private final EpisodeRepository episodeRepository;
    private final InteractionPointRepository interactionPointRepository;
    private final DanmakuRepository danmakuRepository;
    private final HighlightClipRepository highlightClipRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername("demo").isEmpty()) {
            User user = new User();
            user.setUsername("demo");
            user.setPassword(passwordEncoder.encode("123456"));
            user.setNickname("演示用户");
            user.setPoints(0);
            userRepository.save(user);
        }

        if (dramaRepository.count() > 0) return;

        initBeipaiXunbao();
        initTianxiaDiyiWanku();
        initShibasuiGrandma();
        initXingdeXiangyu();
        initHuangnian();
        initJialijiaWai();
        initDanmakuData();
        initHighlightClips();
    }

    private void initBeipaiXunbao() {
        Drama d = new Drama();
        d.setTitle("北派寻宝笔记");
        d.setDescription("一本神秘的寻宝笔记，引出了一段跨越百年的传奇故事。主人公循着祖辈留下的线索，踏上了惊险刺激的寻宝之旅。");
        d.setCoverUrl("/covers/clean_beipai.webp");
        d.setCategory("悬疑");
        d.setTotalEpisodes(19);
        d.setRating(0.0);
        d.setViewCount(0L);
        d.setIsHot(true);
        d.setIsNew(false);
        d.setStatus("ongoing");
        d = dramaRepository.save(d);

        Episode first = null;
        for (int i = 1; i <= 19; i++) {
            Episode ep = createEpisode(d, i, "第" + i + "集", 90);
            if (i == 1) first = ep;
        }
        if (first != null) {
            createInteraction(first, 30000L, InteractionPoint.InteractionType.VOTE,
                    "这个线索你觉得指向哪里？",
                    List.of(opt("古墓"), opt("密室"), opt("地下河")));
            createInteraction(first, 60000L, InteractionPoint.InteractionType.QUIZ,
                    "笔记中提到的朝代是？",
                    List.of(opt("明朝"), optCorrect("清朝"), opt("唐朝")),
                    "仔细看笔记中的年号记载", 30);
            createInteraction(first, 45000L, InteractionPoint.InteractionType.EGG,
                    "隐藏彩蛋：寻宝笔记作者亲笔签名照",
                    List.of(opt("领取")));
            createInteraction(first, 15000L, InteractionPoint.InteractionType.INFO,
                    "寻宝笔记背景知识",
                    List.of(),
                    "{\"title\":\"寻宝笔记背景\",\"content\":\"这本笔记源自清朝一位隐士的手记，记录了多处古墓的线索。\",\"imageUrl\":\"https://picsum.photos/seed/info1/400/225\"}", null);
            createInteraction(first, 80000L, InteractionPoint.InteractionType.LINK,
                    "了解更多古墓知识",
                    List.of(),
                    "{\"title\":\"古墓探秘\",\"url\":\"https://example.com/tomb\",\"description\":\"点击了解古墓探秘的精彩内容\"}", null);
            createInteraction(first, 5000L, InteractionPoint.InteractionType.EMOJI,
                    "🔥,😂,❤️,😱,👏",
                    List.of());
        }
        List<Episode> episodes = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(d.getId());
        if (episodes.size() > 1) {
            Episode ep2 = episodes.get(1);
            buildChoiceWithBranches(ep2, "寻宝方向选择", 30000L,
                    new BranchOption("古墓", "💪 你选择了正面硬刚！石门轰然倒塌，但惊动了守墓人...",
                            "QUIZ", 50000L, "守墓人出现了！他的弱点是什么？",
                            List.of(opt("他左眼的伤疤"), optCorrect("他手中的法器"), opt("他的影子"))),
                    new BranchOption("密室", "🤫 你选择了智取！发现了一条隐蔽的裂缝，成功潜入...",
                            "QUIZ", 50000L, "暗道中出现了三扇门，哪扇门是正确的？",
                            List.of(opt("左边刻着龙纹的门"), optCorrect("中间没有花纹的门"), opt("右边刻着蛇纹的门"))),
                    new BranchOption("地下河", "👀 你选择了谨慎行事！在外围发现了重要线索...",
                            "VOTE", 50000L, "你发现有人在监视古墓，你打算？",
                            List.of(opt("跟踪监视者"), opt("回去告诉队友"), opt("设下陷阱等他来")))
            );
            createInteraction(ep2, 60000L, InteractionPoint.InteractionType.QUIZ,
                    "这个暗号代表什么？",
                    List.of(opt("日月"), optCorrect("山川"), opt("星辰")));
            createInteraction(ep2, 45000L, InteractionPoint.InteractionType.EGG,
                    "隐藏地图碎片1",
                    List.of(opt("领取")));
            createInteraction(ep2, 10000L, InteractionPoint.InteractionType.EMOJI,
                    "🔥,😱,👀,💀,🤔",
                    List.of());
        }
        if (episodes.size() > 2) {
            Episode ep3 = episodes.get(2);
            createInteraction(ep3, 25000L, InteractionPoint.InteractionType.VOTE,
                    "你觉得内鬼是谁？",
                    List.of(opt("老张"), opt("小李"), opt("王教授")));

            // 3级分支链路：分头行动 → 遇到危险 → 最终选择
            buildChoiceWithBranches(ep3, "分头行动还是一起走？", 50000L,
                    new BranchOption("分头行动", "🏃 你选择了分头行动，效率翻倍但风险也翻倍...",
                            "CHOICE", 65000L, "你独自行动时遇到了危险！",
                            List.of(optWithFeedback("战斗", "⚔️ 你选择了战斗！虽然危险但可能获得宝藏..."),
                                    optWithFeedback("逃跑", "🏃 你选择了逃跑！安全第一，下次再来..."))),
                    new BranchOption("一起走", "👥 你选择了团队协作，安全第一...",
                            "VOTE", 65000L, "团队发现了两条路，走哪条？",
                            List.of(opt("左边的密道"), opt("右边的暗门"), opt("原路返回")))
            );

            createInteraction(ep3, 70000L, InteractionPoint.InteractionType.EGG,
                    "隐藏地图碎片2",
                    List.of(opt("领取")));
            createInteraction(ep3, 10000L, InteractionPoint.InteractionType.EMOJI,
                    "🔥,😱,👀,💀,🤔",
                    List.of());
        }
        if (episodes.size() > 3) {
            Episode ep4 = episodes.get(3);
            createInteraction(ep4, 35000L, InteractionPoint.InteractionType.QUIZ,
                    "这把钥匙能打开什么？",
                    List.of(opt("宝箱"), optCorrect("密室大门"), opt("地窖")));
            createInteraction(ep4, 60000L, InteractionPoint.InteractionType.CHOICE,
                    "遇到岔路口，你选哪条？",
                    List.of(optWithFeedback("左边亮光", "💡 你选择了光明的道路，前方似乎安全..."),
                            optWithFeedback("右边暗道", "🌑 你选择了黑暗的暗道，充满了未知...")));
            createInteraction(ep4, 45000L, InteractionPoint.InteractionType.EGG,
                    "隐藏地图碎片3",
                    List.of(opt("领取")));
            createInteraction(ep4, 10000L, InteractionPoint.InteractionType.EMOJI,
                    "🔥,😱,👀,💀,🤔",
                    List.of());
        }
        if (episodes.size() > 4) {
            Episode ep5 = episodes.get(4);
            createInteraction(ep5, 30000L, InteractionPoint.InteractionType.VOTE,
                    "最终BOSS你猜是谁？",
                    List.of(opt("黑衣人"), opt("叛徒同伴"), opt("幕后大老板")));
            createInteraction(ep5, 60000L, InteractionPoint.InteractionType.EGG,
                    "完整地图解锁",
                    List.of(opt("领取")));
            createInteraction(ep5, 10000L, InteractionPoint.InteractionType.EMOJI,
                    "🔥,😱,👀,💀,🤔",
                    List.of());
        }
    }

    private void initTianxiaDiyiWanku() {
        Drama d = new Drama();
        d.setTitle("天下第一纨绔");
        d.setDescription("一个被所有人看不起的纨绔子弟，却有着不为人知的惊人才华。当他不再隐藏自己，整个天下都为之震动。");
        d.setCoverUrl("/covers/clean_wanku.webp");
        d.setCategory("古装");
        d.setTotalEpisodes(24);
        d.setRating(0.0);
        d.setViewCount(0L);
        d.setIsHot(true);
        d.setIsNew(true);
        d.setStatus("completed");
        d = dramaRepository.save(d);

        for (int i = 1; i <= 24; i++) {
            createEpisode(d, i, "第" + i + "集", 90);
        }
        Episode first = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(d.getId()).get(0);
        createInteraction(first, 25000L, InteractionPoint.InteractionType.VOTE,
                "男主这波操作你打几分？",
                List.of(opt("满分"), opt("及格"), opt("不及格")));
        buildChoiceWithBranches(first, "如果你是男主，你会怎么应对？", 55000L,
                new BranchOption("正面硬刚", "⚔️ 你选择了正面硬刚！气势如虹，敌人被你的霸气震慑...",
                        "QUIZ", 70000L, "敌人露出了破绽，你抓住了吗？",
                        List.of(optCorrect("抓住了，一击制敌"), opt("犹豫了一下，错失良机"))),
                new BranchOption("智取", "🧠 你选择了智取！以巧破力，四两拨千斤...",
                        "VOTE", 70000L, "你的计策成功了，下一步？",
                        List.of(opt("乘胜追击"), opt("见好就收"), opt("留条后路"))),
                new BranchOption("假装认怂", "😏 你选择了韬光养晦！暗中积蓄力量...",
                        "QUIZ", 70000L, "敌人放松警惕了，你准备？",
                        List.of(opt("突然反击"), opt("继续潜伏"), opt("找帮手")))
        );
        createInteraction(first, 70000L, InteractionPoint.InteractionType.EGG,
                "隐藏彩蛋：纨绔少爷的秘密武器",
                List.of(opt("领取")));
        createInteraction(first, 20000L, InteractionPoint.InteractionType.INFO,
                "纨绔少爷身世揭秘",
                List.of(),
                "{\"title\":\"纨绔少爷身世\",\"content\":\"他并非真正的纨绔子弟，而是隐藏身份的绝世高手。\",\"imageUrl\":\"https://picsum.photos/seed/info2/400/225\"}", null);
        createInteraction(first, 85000L, InteractionPoint.InteractionType.LINK,
                "推荐：同类型古装剧",
                List.of(),
                "{\"title\":\"更多古装剧\",\"url\":\"https://example.com/ancient\",\"description\":\"喜欢纨绔题材？点击发现更多精彩古装剧\"}", null);
        createInteraction(first, 5000L, InteractionPoint.InteractionType.EMOJI,
                "🔥,😂,❤️,😱,👏",
                List.of());
        List<Episode> episodes = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(d.getId());
        if (episodes.size() > 1) {
            Episode ep2 = episodes.get(1);
            createInteraction(ep2, 30000L, InteractionPoint.InteractionType.QUIZ,
                    "男主的真实身份是？",
                    List.of(opt("富二代"), optCorrect("隐藏高手"), opt("穿越者")),
                    "注意男主手上的老茧", 50);
            createInteraction(ep2, 55000L, InteractionPoint.InteractionType.CHOICE,
                    "面对挑衅你怎么做？",
                    List.of(optWithFeedback("正面回击", "👊 你选择了正面回击！寸步不让，气势逼人..."),
                            optWithFeedback("以退为进", "🔄 你选择了以退为进！以柔克刚，后发制人...")));
            createInteraction(ep2, 45000L, InteractionPoint.InteractionType.EGG,
                    "纨绔少爷的隐藏技能",
                    List.of(opt("领取")));
            createInteraction(ep2, 10000L, InteractionPoint.InteractionType.EMOJI,
                    "🔥,😂,❤️,👏,🤣",
                    List.of());
        }
        if (episodes.size() > 2) {
            Episode ep3 = episodes.get(2);
            createInteraction(ep3, 25000L, InteractionPoint.InteractionType.VOTE,
                    "这集最精彩的是？",
                    List.of(opt("打脸反派"), opt("英雄救美"), opt("装逼成功")));
            createInteraction(ep3, 60000L, InteractionPoint.InteractionType.CHOICE,
                    "下一步你选什么策略？",
                    List.of(optWithFeedback("主动出击", "🗡️ 你选择了主动出击！先发制人..."),
                            optWithFeedback("静观其变", "👁️ 你选择了静观其变！知己知彼...")));
            createInteraction(ep3, 45000L, InteractionPoint.InteractionType.EGG,
                    "纨绔语录收藏",
                    List.of(opt("领取")));
            createInteraction(ep3, 10000L, InteractionPoint.InteractionType.EMOJI,
                    "🔥,😂,❤️,👏,🤣",
                    List.of());
        }
    }

    private void initShibasuiGrandma() {
        Drama d = new Drama();
        d.setTitle("十八岁太奶奶驾到重整家族荣耀第三部");
        d.setDescription("太奶奶穿越回现代，凭借过人的智慧和胆识，带领家族走向新的辉煌。这一部，更大的挑战等着她...");
        d.setCoverUrl("/covers/clean_grandma.webp");
        d.setCategory("都市");
        d.setTotalEpisodes(20);
        d.setRating(0.0);
        d.setViewCount(0L);
        d.setIsHot(true);
        d.setIsNew(true);
        d.setStatus("ongoing");
        d = dramaRepository.save(d);

        for (int i = 1; i <= 20; i++) {
            createEpisode(d, i, "第" + i + "集", 90);
        }
        Episode first = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(d.getId()).get(0);
        createInteraction(first, 20000L, InteractionPoint.InteractionType.VOTE,
                "太奶奶这招高不高？",
                List.of(opt("太高了"), opt("一般般"), opt("看不懂")));
        createInteraction(first, 50000L, InteractionPoint.InteractionType.EGG,
                "发现隐藏彩蛋：太奶奶的独家秘方",
                List.of(opt("查看")));
        createInteraction(first, 15000L, InteractionPoint.InteractionType.INFO,
                "太奶奶的传奇经历",
                List.of(),
                "{\"title\":\"太奶奶传奇\",\"content\":\"十八岁穿越回现代，凭借前世智慧重振家族。\",\"imageUrl\":\"https://picsum.photos/seed/info3/400/225\"}", null);
        createInteraction(first, 75000L, InteractionPoint.InteractionType.LINK,
                "推荐：同类型都市剧",
                List.of(),
                "{\"title\":\"更多都市剧\",\"url\":\"https://example.com/urban\",\"description\":\"喜欢太奶奶题材？点击发现更多精彩都市剧\"}", null);
        createInteraction(first, 5000L, InteractionPoint.InteractionType.EMOJI,
                "🔥,😂,❤️,😱,👏",
                List.of());
        List<Episode> episodes = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(d.getId());
        if (episodes.size() > 1) {
            Episode ep2 = episodes.get(1);
            createInteraction(ep2, 25000L, InteractionPoint.InteractionType.QUIZ,
                    "太奶奶用了什么计策？",
                    List.of(opt("美人计"), optCorrect("反间计"), opt("空城计")));
            createInteraction(ep2, 55000L, InteractionPoint.InteractionType.VOTE,
                    "家族里谁最不靠谱？",
                    List.of(opt("二叔"), opt("三姑"), opt("表弟")));
            createInteraction(ep2, 40000L, InteractionPoint.InteractionType.EGG,
                    "太奶奶的暗器收藏",
                    List.of(opt("领取")));
            createInteraction(ep2, 10000L, InteractionPoint.InteractionType.EMOJI,
                    "❤️,😂,😍,🥺,😭",
                    List.of());
        }
        if (episodes.size() > 2) {
            Episode ep3 = episodes.get(2);
            buildChoiceWithBranches(ep3, "太奶奶该不该原谅二叔？", 30000L,
                    new BranchOption("原谅", "💕 你选择了原谅！以德服人，化敌为友...",
                            "VOTE", 50000L, "二叔会改过自新吗？",
                            List.of(opt("会的"), opt("难说"), opt("走着瞧"))),
                    new BranchOption("不原谅", "❌ 你选择了不原谅！有些底线不能破...",
                            "QUIZ", 50000L, "不原谅的后果是什么？",
                            List.of(opt("二叔离开家族"), optCorrect("二叔暗中使坏"), opt("家族分裂"))),
                    new BranchOption("看表现", "👀 你选择了观察！先看他怎么做...",
                            "VOTE", 50000L, "二叔的表现如何？",
                            List.of(opt("还不错"), opt("老样子"), opt("变本加厉")))
            );
            createInteraction(ep3, 60000L, InteractionPoint.InteractionType.EGG,
                    "家族秘史揭秘",
                    List.of(opt("查看")));
            createInteraction(ep3, 10000L, InteractionPoint.InteractionType.EMOJI,
                    "❤️,😂,😍,🥺,😭",
                    List.of());
        }
    }

    private void initXingdeXiangyu() {
        Drama d = new Drama();
        d.setTitle("幸得相遇离婚时");
        d.setDescription("一场离婚，让两个人重新认识了彼此。当爱情褪去激情，真正的生活才刚刚开始。他们能否在分开后找到真正的幸福？");
        d.setCoverUrl("/covers/clean_xingde.webp");
        d.setCategory("甜宠");
        d.setTotalEpisodes(20);
        d.setRating(0.0);
        d.setViewCount(0L);
        d.setIsHot(false);
        d.setIsNew(true);
        d.setStatus("completed");
        d = dramaRepository.save(d);

        for (int i = 1; i <= 20; i++) {
            createEpisode(d, i, "第" + i + "集", 90);
        }
        Episode first = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(d.getId()).get(0);
        createInteraction(first, 35000L, InteractionPoint.InteractionType.VOTE,
                "你觉得他们应该离婚吗？",
                List.of(opt("应该"), opt("不应该"), opt("再看看")));
        createInteraction(first, 55000L, InteractionPoint.InteractionType.EGG,
                "隐藏彩蛋：离婚协议书背面的秘密",
                List.of(opt("查看")));
        createInteraction(first, 10000L, InteractionPoint.InteractionType.EMOJI,
                "❤️,😍,🥰,💕,😭",
                List.of());
        List<Episode> episodes = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(d.getId());
        if (episodes.size() > 1) {
            Episode ep2 = episodes.get(1);
            createInteraction(ep2, 30000L, InteractionPoint.InteractionType.VOTE,
                    "男主是不是在装冷漠？",
                    List.of(opt("是"), opt("不是"), opt("不好说")));
            createInteraction(ep2, 60000L, InteractionPoint.InteractionType.EGG,
                    "男主的秘密日记",
                    List.of(opt("查看")));
            createInteraction(ep2, 10000L, InteractionPoint.InteractionType.EMOJI,
                    "❤️,😍,🥰,💕,😭",
                    List.of());
        }
    }

    private void initHuangnian() {
        Drama d = new Drama();
        d.setTitle("荒年全村啃树皮我有系统满仓肉");
        d.setDescription("穿越到饥荒年代，获得囤货系统的她，凭借一己之力带领全村人度过荒年。从被嘲笑到被仰望，她的逆袭之路开始了。");
        d.setCoverUrl("/covers/clean_huangnian_v2.webp");
        d.setCategory("古装");
        d.setTotalEpisodes(20);
        d.setRating(0.0);
        d.setViewCount(0L);
        d.setIsHot(true);
        d.setIsNew(false);
        d.setStatus("ongoing");
        d = dramaRepository.save(d);

        for (int i = 1; i <= 20; i++) {
            createEpisode(d, i, "第" + i + "集", 90);
        }
        Episode first = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(d.getId()).get(0);
        createInteraction(first, 28000L, InteractionPoint.InteractionType.QUIZ,
                "系统给了主角什么能力？",
                List.of(optCorrect("空间储存"), opt("预知未来"), opt("点石成金")));
        createInteraction(first, 60000L, InteractionPoint.InteractionType.VOTE,
                "如果你穿越到荒年，第一件事做什么？",
                List.of(opt("囤粮食"), opt("找水源"), opt("建庇护所")));
        createInteraction(first, 45000L, InteractionPoint.InteractionType.EGG,
                "隐藏彩蛋：系统空间里的神秘礼物",
                List.of(opt("领取")));
        createInteraction(first, 10000L, InteractionPoint.InteractionType.EMOJI,
                "🔥,😂,❤️,👏,🤣",
                List.of());
        List<Episode> episodes = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(d.getId());
        if (episodes.size() > 1) {
            Episode ep2 = episodes.get(1);
            buildChoiceWithBranches(ep2, "粮食不够了，先给谁吃？", 30000L,
                    new BranchOption("老人孩子", "👶 你选择了优先照顾老弱！善心可鉴...",
                            "VOTE", 50000L, "壮劳力有意见了，怎么办？",
                            List.of(opt("安抚他们"), opt("解释原因"), opt("找其他办法"))),
                    new BranchOption("壮劳力", "💪 你选择了壮劳力优先！保证劳动力...",
                            "QUIZ", 50000L, "壮劳力吃饱了，下一步？",
                            List.of(optCorrect("组织开荒种地"), opt("继续找粮食"), opt("外出打猎"))),
                    new BranchOption("平均分配", "⚖️ 你选择了公平分配！一碗水端平...",
                            "VOTE", 50000L, "分配方案大家满意吗？",
                            List.of(opt("满意"), opt("不太满意"), opt("勉强接受")))
            );
            createInteraction(ep2, 60000L, InteractionPoint.InteractionType.EGG,
                    "系统升级奖励",
                    List.of(opt("领取")));
            createInteraction(ep2, 10000L, InteractionPoint.InteractionType.EMOJI,
                    "🔥,😂,❤️,👏,🤣",
                    List.of());
        }
        if (episodes.size() > 2) {
            Episode ep3 = episodes.get(2);
            createInteraction(ep3, 25000L, InteractionPoint.InteractionType.VOTE,
                    "村里人开始怀疑主角了，怎么办？",
                    List.of(opt("坦白系统"), opt("继续隐瞒"), opt("找借口")));
            createInteraction(ep3, 55000L, InteractionPoint.InteractionType.EGG,
                    "隐藏食谱",
                    List.of(opt("领取")));
            createInteraction(ep3, 10000L, InteractionPoint.InteractionType.EMOJI,
                    "🔥,😂,❤️,👏,🤣",
                    List.of());
        }
    }

    private void initJialijiaWai() {
        Drama d = new Drama();
        d.setTitle("家里家外");
        d.setDescription("一个普通家庭的喜怒哀乐，婆媳关系、夫妻相处、子女教育，每个话题都能引起你的共鸣。");
        d.setCoverUrl("/covers/clean_jiali.webp");
        d.setCategory("都市");
        d.setTotalEpisodes(20);
        d.setRating(0.0);
        d.setViewCount(0L);
        d.setIsHot(false);
        d.setIsNew(true);
        d.setStatus("completed");
        d = dramaRepository.save(d);

        for (int i = 1; i <= 20; i++) {
            createEpisode(d, i, "第" + i + "集", 90);
        }
        Episode first = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(d.getId()).get(0);
        createInteraction(first, 30000L, InteractionPoint.InteractionType.VOTE,
                "婆媳矛盾谁对谁错？",
                List.of(opt("婆婆对"), opt("媳妇对"), opt("都有问题")));
        createInteraction(first, 50000L, InteractionPoint.InteractionType.EGG,
                "隐藏彩蛋：奶奶传下来的金手镯",
                List.of(opt("领取")));
        createInteraction(first, 10000L, InteractionPoint.InteractionType.EMOJI,
                "❤️,😂,😍,🥺,😭",
                List.of());
        List<Episode> episodes = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(d.getId());
        if (episodes.size() > 1) {
            Episode ep2 = episodes.get(1);
            createInteraction(ep2, 25000L, InteractionPoint.InteractionType.VOTE,
                    "老公该站谁那边？",
                    List.of(opt("站老婆"), opt("站老妈"), opt("两头哄")));
            createInteraction(ep2, 55000L, InteractionPoint.InteractionType.EGG,
                    "家庭和睦秘籍",
                    List.of(opt("领取")));
            createInteraction(ep2, 10000L, InteractionPoint.InteractionType.EMOJI,
                    "❤️,😂,😍,🥺,😭",
                    List.of());
        }
    }

    private Episode createEpisode(Drama drama, int number, String title, int duration) {
        Episode ep = new Episode();
        ep.setDrama(drama);
        ep.setEpisodeNumber(number);
        ep.setTitle(title);

        // Check for actual video file: videos/{dramaTitle}/第N集.mp4
        String videoPath = "/videos/" + drama.getTitle() + "/第" + number + "集.mp4";
        String userDir = System.getProperty("user.dir");
        String[] candidates = {
            userDir + File.separator + "videos",
            userDir + File.separator + ".." + File.separator + "videos",
            userDir + File.separator + "short-drama-player" + File.separator + "videos"
        };

        boolean videoExists = false;
        for (String basePath : candidates) {
            File file = new File(basePath, drama.getTitle() + "/第" + number + "集.mp4");
            if (file.exists()) {
                videoExists = true;
                break;
            }
        }

        // If exact episode file not found, try to find the Nth mp4 file sorted by name
        if (!videoExists) {
            for (String basePath : candidates) {
                File dramaDir = new File(basePath, drama.getTitle());
                if (dramaDir.isDirectory()) {
                    File[] files = dramaDir.listFiles((dir, name) -> name.endsWith(".mp4"));
                    if (files != null && files.length > 0) {
                        java.util.Arrays.sort(files);
                        // Use the Nth file (1-indexed), or the last file if N exceeds count
                        int idx = Math.min(number - 1, files.length - 1);
                        if (idx >= 0) {
                            videoPath = "/videos/" + drama.getTitle() + "/" + files[idx].getName();
                            videoExists = true;
                        }
                        break;
                    }
                }
            }
        }

        // If still no video found, use episode-specific placeholder
        if (!videoExists) {
            videoPath = "/api/video/placeholder/" + number;
        }

        ep.setVideoUrl(videoPath);
        ep.setDurationSeconds(duration);
        ep.setStreams("[{\"quality\":\"720p\",\"url\":\"" + videoPath + "\"},{\"quality\":\"1080p\",\"url\":\"" + videoPath + "\"}]");
        return episodeRepository.save(ep);
    }

    private void createInteraction(Episode episode, Long timestampMs,
                                   InteractionPoint.InteractionType type,
                                   String question, List<OptionDef> optionDefs) {
        createInteraction(episode, timestampMs, type, question, optionDefs, null, null);
    }

    private void createInteraction(Episode episode, Long timestampMs,
                                   InteractionPoint.InteractionType type,
                                   String question, List<OptionDef> optionDefs,
                                   String hint, Integer hintCost) {
        InteractionPoint point = new InteractionPoint();
        point.setEpisode(episode);
        point.setTimestampMs(timestampMs);
        point.setInteractionType(type);
        point.setQuestionText(question);
        if (hint != null) point.setHint(hint);
        if (hintCost != null) point.setHintCost(hintCost);

        for (int i = 0; i < optionDefs.size(); i++) {
            InteractionOption option = new InteractionOption();
            option.setInteractionPoint(point);
            option.setOptionIndex(i + 1);
            option.setOptionText(optionDefs.get(i).text);
            option.setIsCorrect(optionDefs.get(i).isCorrect);
            option.setFeedbackText(optionDefs.get(i).feedbackText);
            point.getOptions().add(option);
        }
        interactionPointRepository.save(point);
    }

    private void buildChoiceWithBranches(Episode episode, String question, Long timestampMs,
                                         BranchOption... branchOptions) {
        InteractionPoint choicePoint = new InteractionPoint();
        choicePoint.setEpisode(episode);
        choicePoint.setTimestampMs(timestampMs);
        choicePoint.setInteractionType(InteractionPoint.InteractionType.CHOICE);
        choicePoint.setQuestionText(question);

        List<InteractionOption> options = new ArrayList<>();
        for (int i = 0; i < branchOptions.length; i++) {
            BranchOption bo = branchOptions[i];
            InteractionOption opt = new InteractionOption();
            opt.setInteractionPoint(choicePoint);
            opt.setOptionIndex(i + 1);
            opt.setOptionText(bo.optionText);
            opt.setIsCorrect(false);
            opt.setFeedbackText(bo.feedbackText);
            options.add(opt);
        }
        choicePoint.setOptions(options);
        interactionPointRepository.save(choicePoint);

        for (int i = 0; i < branchOptions.length; i++) {
            BranchOption bo = branchOptions[i];
            InteractionOption savedOpt = options.get(i);

            InteractionPoint branch = new InteractionPoint();
            branch.setEpisode(episode);
            branch.setTimestampMs(bo.branchTimestampMs);
            branch.setInteractionType(InteractionPoint.InteractionType.valueOf(bo.branchType));
            branch.setQuestionText(bo.branchQuestion);
            branch.setPrerequisite(choicePoint);
            branch.setPrerequisiteChoiceOptionId(savedOpt.getId());

            List<InteractionOption> branchOpts = new ArrayList<>();
            for (int j = 0; j < bo.branchOptionDefs.size(); j++) {
                InteractionOption bOpt = new InteractionOption();
                bOpt.setInteractionPoint(branch);
                bOpt.setOptionIndex(j + 1);
                bOpt.setOptionText(bo.branchOptionDefs.get(j).text);
                bOpt.setIsCorrect(bo.branchOptionDefs.get(j).isCorrect);
                bOpt.setFeedbackText(bo.branchOptionDefs.get(j).feedbackText);
                branchOpts.add(bOpt);
            }
            branch.setOptions(branchOpts);
            branch = interactionPointRepository.save(branch);

            branch.setBranchGroupId(branch.getId());
            interactionPointRepository.save(branch);

            savedOpt.setNextInteraction(branch);
            interactionPointRepository.flush();
        }
    }

    private static OptionDef opt(String text) {
        return new OptionDef(text, false, null);
    }

    private static OptionDef optCorrect(String text) {
        return new OptionDef(text, true, null);
    }

    private static OptionDef optWithFeedback(String text, String feedback) {
        return new OptionDef(text, false, feedback);
    }

    private record OptionDef(String text, boolean isCorrect, String feedbackText) {}

    private static class BranchOption {
        String optionText;
        String feedbackText;
        String branchType;
        Long branchTimestampMs;
        String branchQuestion;
        List<OptionDef> branchOptionDefs;

        BranchOption(String optionText, String feedbackText, String branchType,
                     Long branchTimestampMs, String branchQuestion,
                     List<OptionDef> branchOptionDefs) {
            this.optionText = optionText;
            this.feedbackText = feedbackText;
            this.branchType = branchType;
            this.branchTimestampMs = branchTimestampMs;
            this.branchQuestion = branchQuestion;
            this.branchOptionDefs = branchOptionDefs;
        }
    }

    private void initDanmakuData() {
        if (danmakuRepository.count() > 0) return;

        // Get demo user id
        Long userId = userRepository.findByUsername("demo")
                .map(User::getId)
                .orElse(1L);

        // Danmaku for 北派寻宝笔记 (drama 1) — episodes 1-5
        // Each danmaku has content that maps to sentiment emojis
        List<Danmaku> danmakus = new ArrayList<>();

        // Episode 1 — 悬疑/惊险
        danmakus.add(createDanmaku(1L, userId, 3000L, "卧槽太刺激了"));
        danmakus.add(createDanmaku(1L, userId, 8000L, "这剧情绝了"));
        danmakus.add(createDanmaku(1L, userId, 12000L, "吓死我了"));
        danmakus.add(createDanmaku(1L, userId, 18000L, "厉害啊主角"));
        danmakus.add(createDanmaku(1L, userId, 25000L, "不敢相信"));
        danmakus.add(createDanmaku(1L, userId, 32000L, "666太强了"));
        danmakus.add(createDanmaku(1L, userId, 40000L, "笑死这个配角"));
        danmakus.add(createDanmaku(1L, userId, 48000L, "好紧张啊"));
        danmakus.add(createDanmaku(1L, userId, 55000L, "太离谱了"));
        danmakus.add(createDanmaku(1L, userId, 62000L, "心疼主角"));

        // Episode 2 — 分支选择
        danmakus.add(createDanmaku(2L, userId, 5000L, "选古墓！"));
        danmakus.add(createDanmaku(2L, userId, 10000L, "哈哈笑死"));
        danmakus.add(createDanmaku(2L, userId, 15000L, "太棒了这剧情"));
        danmakus.add(createDanmaku(2L, userId, 22000L, "害怕不敢看"));
        danmakus.add(createDanmaku(2L, userId, 30000L, "牛啊牛啊"));
        danmakus.add(createDanmaku(2L, userId, 38000L, "爱了爱了"));
        danmakus.add(createDanmaku(2L, userId, 45000L, "惊了没想到"));
        danmakus.add(createDanmaku(2L, userId, 55000L, "哭了好感动"));

        // Episode 3 — 投票
        danmakus.add(createDanmaku(3L, userId, 5000L, "老张是内鬼"));
        danmakus.add(createDanmaku(3L, userId, 12000L, "搞笑哈哈哈"));
        danmakus.add(createDanmaku(3L, userId, 20000L, "好帅啊"));
        danmakus.add(createDanmaku(3L, userId, 28000L, "太突然了"));
        danmakus.add(createDanmaku(3L, userId, 35000L, "佩服佩服"));
        danmakus.add(createDanmaku(3L, userId, 42000L, "细思极恐"));
        danmakus.add(createDanmaku(3L, userId, 50000L, "绝美画面"));

        // Episode 4
        danmakus.add(createDanmaku(4L, userId, 5000L, "好看好看"));
        danmakus.add(createDanmaku(4L, userId, 15000L, "太逗了"));
        danmakus.add(createDanmaku(4L, userId, 25000L, "紧张紧张"));
        danmakus.add(createDanmaku(4L, userId, 35000L, "破防了哭了"));
        danmakus.add(createDanmaku(4L, userId, 45000L, "精彩！"));

        // Episode 5
        danmakus.add(createDanmaku(5L, userId, 5000L, "宝藏剧！"));
        danmakus.add(createDanmaku(5L, userId, 15000L, "哈哈哈笑喷"));
        danmakus.add(createDanmaku(5L, userId, 25000L, "太甜了"));
        danmakus.add(createDanmaku(5L, userId, 35000L, "意难平啊"));
        danmakus.add(createDanmaku(5L, userId, 45000L, "瑞思拜"));

        // 天下第一纨绔 (drama 2) — episodes 1-3
        danmakus.add(createDanmaku(6L, userId, 5000L, "好帅啊男主"));
        danmakus.add(createDanmaku(6L, userId, 12000L, "笑死我了"));
        danmakus.add(createDanmaku(6L, userId, 20000L, "太甜了吧"));
        danmakus.add(createDanmaku(6L, userId, 30000L, "666牛逼"));
        danmakus.add(createDanmaku(6L, userId, 40000L, "爱了爱了"));
        danmakus.add(createDanmaku(7L, userId, 5000L, "哈哈哈太逗了"));
        danmakus.add(createDanmaku(7L, userId, 15000L, "好美啊"));
        danmakus.add(createDanmaku(7L, userId, 25000L, "神仙剧情"));
        danmakus.add(createDanmaku(7L, userId, 35000L, "哭了太感动"));
        danmakus.add(createDanmaku(8L, userId, 5000L, "绝了绝了"));
        danmakus.add(createDanmaku(8L, userId, 15000L, "太棒了"));
        danmakus.add(createDanmaku(8L, userId, 25000L, "可爱死了"));
        danmakus.add(createDanmaku(8L, userId, 35000L, "佩服佩服"));

        // 十八岁太奶奶 (drama 3) — 都市/甜宠
        danmakus.add(createDanmaku(9L, userId, 5000L, "太甜了！"));
        danmakus.add(createDanmaku(9L, userId, 12000L, "嗑到了嗑到了"));
        danmakus.add(createDanmaku(9L, userId, 20000L, "好甜好甜"));
        danmakus.add(createDanmaku(9L, userId, 30000L, "哈哈笑死"));
        danmakus.add(createDanmaku(9L, userId, 40000L, "心疼女主"));
        danmakus.add(createDanmaku(10L, userId, 5000L, "好看！"));
        danmakus.add(createDanmaku(10L, userId, 15000L, "太好了终于"));
        danmakus.add(createDanmaku(10L, userId, 25000L, "爱了"));
        danmakus.add(createDanmaku(11L, userId, 5000L, "甜到我了"));
        danmakus.add(createDanmaku(11L, userId, 15000L, "绝美！"));
        danmakus.add(createDanmaku(11L, userId, 25000L, "感动哭了"));

        danmakuRepository.saveAll(danmakus);
    }

    private Danmaku createDanmaku(Long episodeId, Long userId, Long positionMs, String content) {
        Danmaku dm = new Danmaku();
        dm.setEpisodeId(episodeId);
        dm.setUserId(userId);
        dm.setPositionMs(positionMs);
        dm.setContent(content);
        return dm;
    }

    private void initHighlightClips() {
        if (highlightClipRepository.count() > 0) return;

        List<Drama> dramas = dramaRepository.findAll();
        if (dramas.isEmpty()) return;

        List<Episode> episodes1 = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(dramas.get(0).getId());
        List<Episode> episodes2 = dramas.size() > 1 ? episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(dramas.get(1).getId()) : List.of();
        List<Episode> episodes3 = dramas.size() > 2 ? episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(dramas.get(2).getId()) : List.of();

        List<HighlightClip> clips = new ArrayList<>();

        // 北派寻宝笔记 - 悬疑刺激片段
        if (!episodes1.isEmpty()) {
            clips.add(createClip(dramas.get(0), episodes1.get(0), "古墓惊现神秘机关", 120, 150, ClipTag.THRILL, 1500, 800));
            clips.add(createClip(dramas.get(0), episodes1.get(0), "寻宝笔记首次揭秘", 30, 60, ClipTag.SHOCK, 1200, 600));
            clips.add(createClip(dramas.get(0), episodes1.get(1), "密室逃脱惊险一刻", 200, 230, ClipTag.THRILL, 1800, 950));
        }
        if (episodes1.size() > 2) {
            clips.add(createClip(dramas.get(0), episodes1.get(2), "内鬼身份大揭秘", 180, 210, ClipTag.SHOCK, 2000, 1100));
        }

        // 天下第一纨绔 - 爽感/搞笑片段
        if (!episodes2.isEmpty()) {
            clips.add(createClip(dramas.get(1), episodes2.get(0), "纨绔少爷霸气反击", 45, 75, ClipTag.ANGRY, 2200, 1200));
            clips.add(createClip(dramas.get(1), episodes2.get(0), "装逼打脸名场面", 100, 130, ClipTag.FUNNY, 1900, 1000));
        }
        if (episodes2.size() > 1) {
            clips.add(createClip(dramas.get(1), episodes2.get(1), "隐藏高手真实身份暴露", 150, 180, ClipTag.SHOCK, 2500, 1400));
        }
        if (episodes2.size() > 2) {
            clips.add(createClip(dramas.get(1), episodes2.get(2), "打脸反派超爽瞬间", 80, 110, ClipTag.FUNNY, 2100, 1150));
        }

        // 十八岁太奶奶 - 甜/虐片段
        if (!episodes3.isEmpty()) {
            clips.add(createClip(dramas.get(2), episodes3.get(0), "太奶奶驾到名场面", 30, 60, ClipTag.FUNNY, 1700, 900));
            clips.add(createClip(dramas.get(2), episodes3.get(0), "家族荣耀初现", 120, 150, ClipTag.SWEET, 1400, 750));
        }
        if (episodes3.size() > 1) {
            clips.add(createClip(dramas.get(2), episodes3.get(1), "太奶奶的反间计", 200, 230, ClipTag.THRILL, 1600, 850));
        }
        if (episodes3.size() > 2) {
            clips.add(createClip(dramas.get(2), episodes3.get(2), "原谅还是不原谅？催泪名场面", 150, 180, ClipTag.SAD, 2300, 1300));
        }

        // 幸得相遇离婚时 - 甜宠片段
        if (dramas.size() > 3) {
            List<Episode> episodes4 = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(dramas.get(3).getId());
            if (!episodes4.isEmpty()) {
                clips.add(createClip(dramas.get(3), episodes4.get(0), "离婚时的意外重逢", 60, 90, ClipTag.SAD, 1300, 700));
                clips.add(createClip(dramas.get(3), episodes4.get(0), "假装冷漠的真相", 150, 180, ClipTag.SWEET, 1500, 800));
            }
            if (episodes4.size() > 1) {
                clips.add(createClip(dramas.get(3), episodes4.get(1), "男主的秘密日记曝光", 100, 130, ClipTag.SWEET, 1800, 950));
            }
        }

        // 荒年 - 爽感片段
        if (dramas.size() > 4) {
            List<Episode> episodes5 = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(dramas.get(4).getId());
            if (!episodes5.isEmpty()) {
                clips.add(createClip(dramas.get(4), episodes5.get(0), "系统满仓肉初登场", 30, 60, ClipTag.SHOCK, 2400, 1300));
                clips.add(createClip(dramas.get(4), episodes5.get(0), "全村震惊名场面", 120, 150, ClipTag.FUNNY, 1600, 850));
            }
            if (episodes5.size() > 1) {
                clips.add(createClip(dramas.get(4), episodes5.get(1), "粮食危机大反转", 180, 210, ClipTag.THRILL, 1900, 1050));
            }
        }

        highlightClipRepository.saveAll(clips);
    }

    private HighlightClip createClip(Drama drama, Episode episode, String title,
                                      int startTime, int endTime, ClipTag tag,
                                      int heatScore, int playCount) {
        HighlightClip clip = new HighlightClip();
        clip.setDramaId(drama.getId());
        clip.setEpisodeId(episode.getId());
        clip.setTitle(title);
        clip.setStartTime(startTime);
        clip.setEndTime(endTime);
        clip.setTag(tag);
        clip.setHeatScore(heatScore);
        clip.setPlayCount(playCount);
        clip.setClickCount((int) (playCount * 0.4));
        clip.setClipUrl(episode.getVideoUrl());
        clip.setCoverUrl(drama.getCoverUrl());
        return clip;
    }
}
