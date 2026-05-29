package com.drama.config;

import com.drama.model.Drama;
import com.drama.model.Episode;
import com.drama.model.InteractionOption;
import com.drama.model.InteractionPoint;
import com.drama.model.User;
import com.drama.repository.DramaRepository;
import com.drama.repository.EpisodeRepository;
import com.drama.repository.InteractionPointRepository;
import com.drama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DramaRepository dramaRepository;
    private final EpisodeRepository episodeRepository;
    private final InteractionPointRepository interactionPointRepository;
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
    }

    private void initBeipaiXunbao() {
        Drama d = new Drama();
        d.setTitle("北派寻宝笔记");
        d.setDescription("一本神秘的寻宝笔记，引出了一段跨越百年的传奇故事。主人公循着祖辈留下的线索，踏上了惊险刺激的寻宝之旅。");
        d.setCoverUrl("https://picsum.photos/seed/beipai/400/225");
        d.setCategory("悬疑");
        d.setTotalEpisodes(19);
        d.setRating(0.0);
        d.setViewCount(0L);
        d.setIsHot(true);
        d.setIsNew(false);
        d = dramaRepository.save(d);

        int[] eps = {63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81};
        Episode first = null;
        for (int i = 0; i < eps.length; i++) {
            Episode ep = createEpisode(d, eps[i], "第" + eps[i] + "集", 90);
            if (i == 0) first = ep;
        }
        if (first != null) {
            createInteraction(first, 30000L, InteractionPoint.InteractionType.VOTE,
                    "这个线索你觉得指向哪里？",
                    List.of(opt("古墓"), opt("密室"), opt("地下河")));
            createInteraction(first, 60000L, InteractionPoint.InteractionType.QUIZ,
                    "笔记中提到的朝代是？",
                    List.of(opt("明朝"), optCorrect("清朝"), opt("唐朝")));
            createInteraction(first, 45000L, InteractionPoint.InteractionType.EGG,
                    "隐藏彩蛋：寻宝笔记作者亲笔签名照",
                    List.of(opt("领取")));
        }
        List<Episode> episodes = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(d.getId());
        if (episodes.size() > 1) {
            Episode ep2 = episodes.get(1);
            createInteraction(ep2, 30000L, InteractionPoint.InteractionType.CHOICE,
                    "寻宝方向选择",
                    List.of(opt("古墓"), opt("密室"), opt("地下河")));
            createInteraction(ep2, 60000L, InteractionPoint.InteractionType.QUIZ,
                    "这个暗号代表什么？",
                    List.of(opt("日月"), optCorrect("山川"), opt("星辰")));
            createInteraction(ep2, 45000L, InteractionPoint.InteractionType.EGG,
                    "隐藏地图碎片1",
                    List.of(opt("领取")));
        }
        if (episodes.size() > 2) {
            Episode ep3 = episodes.get(2);
            createInteraction(ep3, 25000L, InteractionPoint.InteractionType.VOTE,
                    "你觉得内鬼是谁？",
                    List.of(opt("老张"), opt("小李"), opt("王教授")));
            createInteraction(ep3, 50000L, InteractionPoint.InteractionType.CHOICE,
                    "分头行动还是一起走？",
                    List.of(opt("分头行动"), opt("一起走")));
            createInteraction(ep3, 70000L, InteractionPoint.InteractionType.EGG,
                    "隐藏地图碎片2",
                    List.of(opt("领取")));
        }
        if (episodes.size() > 3) {
            Episode ep4 = episodes.get(3);
            createInteraction(ep4, 35000L, InteractionPoint.InteractionType.QUIZ,
                    "这把钥匙能打开什么？",
                    List.of(opt("宝箱"), optCorrect("密室大门"), opt("地窖")));
            createInteraction(ep4, 60000L, InteractionPoint.InteractionType.CHOICE,
                    "遇到岔路口，你选哪条？",
                    List.of(opt("左边亮光"), opt("右边暗道")));
            createInteraction(ep4, 45000L, InteractionPoint.InteractionType.EGG,
                    "隐藏地图碎片3",
                    List.of(opt("领取")));
        }
        if (episodes.size() > 4) {
            Episode ep5 = episodes.get(4);
            createInteraction(ep5, 30000L, InteractionPoint.InteractionType.VOTE,
                    "最终BOSS你猜是谁？",
                    List.of(opt("黑衣人"), opt("叛徒同伴"), opt("幕后大老板")));
            createInteraction(ep5, 60000L, InteractionPoint.InteractionType.EGG,
                    "完整地图解锁",
                    List.of(opt("领取")));
        }
    }

    private void initTianxiaDiyiWanku() {
        Drama d = new Drama();
        d.setTitle("天下第一纨绔");
        d.setDescription("一个被所有人看不起的纨绔子弟，却有着不为人知的惊人才华。当他不再隐藏自己，整个天下都为之震动。");
        d.setCoverUrl("https://picsum.photos/seed/tianxia/400/225");
        d.setCategory("古装");
        d.setTotalEpisodes(24);
        d.setRating(0.0);
        d.setViewCount(0L);
        d.setIsHot(true);
        d.setIsNew(true);
        d = dramaRepository.save(d);

        for (int i = 1; i <= 24; i++) {
            if (i == 18) continue;
            createEpisode(d, i, "第" + i + "集", 90);
        }
        Episode first = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(d.getId()).get(0);
        createInteraction(first, 25000L, InteractionPoint.InteractionType.VOTE,
                "男主这波操作你打几分？",
                List.of(opt("满分"), opt("及格"), opt("不及格")));
        createInteraction(first, 55000L, InteractionPoint.InteractionType.CHOICE,
                "如果你是男主，你会怎么应对？",
                List.of(opt("正面硬刚"), opt("智取"), opt("假装认怂")));
        createInteraction(first, 70000L, InteractionPoint.InteractionType.EGG,
                "隐藏彩蛋：纨绔少爷的秘密武器",
                List.of(opt("领取")));
        List<Episode> episodes = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(d.getId());
        if (episodes.size() > 1) {
            Episode ep2 = episodes.get(1);
            createInteraction(ep2, 30000L, InteractionPoint.InteractionType.QUIZ,
                    "男主的真实身份是？",
                    List.of(opt("富二代"), optCorrect("隐藏高手"), opt("穿越者")));
            createInteraction(ep2, 55000L, InteractionPoint.InteractionType.CHOICE,
                    "面对挑衅你怎么做？",
                    List.of(opt("正面回击"), opt("以退为进")));
            createInteraction(ep2, 45000L, InteractionPoint.InteractionType.EGG,
                    "纨绔少爷的隐藏技能",
                    List.of(opt("领取")));
        }
        if (episodes.size() > 2) {
            Episode ep3 = episodes.get(2);
            createInteraction(ep3, 25000L, InteractionPoint.InteractionType.VOTE,
                    "这集最精彩的是？",
                    List.of(opt("打脸反派"), opt("英雄救美"), opt("装逼成功")));
            createInteraction(ep3, 60000L, InteractionPoint.InteractionType.CHOICE,
                    "下一步你选什么策略？",
                    List.of(opt("主动出击"), opt("静观其变")));
            createInteraction(ep3, 45000L, InteractionPoint.InteractionType.EGG,
                    "纨绔语录收藏",
                    List.of(opt("领取")));
        }
    }

    private void initShibasuiGrandma() {
        Drama d = new Drama();
        d.setTitle("十八岁太奶奶驾到，重整家族荣耀第三部");
        d.setDescription("太奶奶穿越回现代，凭借过人的智慧和胆识，带领家族走向新的辉煌。这一部，更大的挑战等着她...");
        d.setCoverUrl("https://picsum.photos/seed/shibasui/400/225");
        d.setCategory("都市");
        d.setTotalEpisodes(20);
        d.setRating(0.0);
        d.setViewCount(0L);
        d.setIsHot(true);
        d.setIsNew(true);
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
        }
        if (episodes.size() > 2) {
            Episode ep3 = episodes.get(2);
            createInteraction(ep3, 30000L, InteractionPoint.InteractionType.CHOICE,
                    "太奶奶该不该原谅二叔？",
                    List.of(opt("原谅"), opt("不原谅"), opt("看表现")));
            createInteraction(ep3, 60000L, InteractionPoint.InteractionType.EGG,
                    "家族秘史揭秘",
                    List.of(opt("查看")));
        }
    }

    private void initXingdeXiangyu() {
        Drama d = new Drama();
        d.setTitle("幸得相遇离婚时");
        d.setDescription("一场离婚，让两个人重新认识了彼此。当爱情褪去激情，真正的生活才刚刚开始。他们能否在分开后找到真正的幸福？");
        d.setCoverUrl("https://picsum.photos/seed/xingde/400/225");
        d.setCategory("甜宠");
        d.setTotalEpisodes(20);
        d.setRating(0.0);
        d.setViewCount(0L);
        d.setIsHot(false);
        d.setIsNew(true);
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
        List<Episode> episodes = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(d.getId());
        if (episodes.size() > 1) {
            Episode ep2 = episodes.get(1);
            createInteraction(ep2, 30000L, InteractionPoint.InteractionType.VOTE,
                    "男主是不是在装冷漠？",
                    List.of(opt("是"), opt("不是"), opt("不好说")));
            createInteraction(ep2, 60000L, InteractionPoint.InteractionType.EGG,
                    "男主的秘密日记",
                    List.of(opt("查看")));
        }
    }

    private void initHuangnian() {
        Drama d = new Drama();
        d.setTitle("荒年全村啃树皮，我有系统满仓肉");
        d.setDescription("穿越到饥荒年代，获得囤货系统的她，凭借一己之力带领全村人度过荒年。从被嘲笑到被仰望，她的逆袭之路开始了。");
        d.setCoverUrl("https://picsum.photos/seed/huangnian/400/225");
        d.setCategory("古装");
        d.setTotalEpisodes(20);
        d.setRating(0.0);
        d.setViewCount(0L);
        d.setIsHot(true);
        d.setIsNew(false);
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
        List<Episode> episodes = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(d.getId());
        if (episodes.size() > 1) {
            Episode ep2 = episodes.get(1);
            createInteraction(ep2, 30000L, InteractionPoint.InteractionType.CHOICE,
                    "粮食不够了，先给谁吃？",
                    List.of(opt("老人孩子"), opt("壮劳力"), opt("平均分配")));
            createInteraction(ep2, 60000L, InteractionPoint.InteractionType.EGG,
                    "系统升级奖励",
                    List.of(opt("领取")));
        }
        if (episodes.size() > 2) {
            Episode ep3 = episodes.get(2);
            createInteraction(ep3, 25000L, InteractionPoint.InteractionType.VOTE,
                    "村里人开始怀疑主角了，怎么办？",
                    List.of(opt("坦白系统"), opt("继续隐瞒"), opt("找借口")));
            createInteraction(ep3, 55000L, InteractionPoint.InteractionType.EGG,
                    "隐藏食谱",
                    List.of(opt("领取")));
        }
    }

    private void initJialijiaWai() {
        Drama d = new Drama();
        d.setTitle("家里家外");
        d.setDescription("一个普通家庭的喜怒哀乐，婆媳关系、夫妻相处、子女教育，每个话题都能引起你的共鸣。");
        d.setCoverUrl("https://picsum.photos/seed/jiali/400/225");
        d.setCategory("都市");
        d.setTotalEpisodes(20);
        d.setRating(0.0);
        d.setViewCount(0L);
        d.setIsHot(false);
        d.setIsNew(true);
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
        List<Episode> episodes = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(d.getId());
        if (episodes.size() > 1) {
            Episode ep2 = episodes.get(1);
            createInteraction(ep2, 25000L, InteractionPoint.InteractionType.VOTE,
                    "老公该站谁那边？",
                    List.of(opt("站老婆"), opt("站老妈"), opt("两头哄")));
            createInteraction(ep2, 55000L, InteractionPoint.InteractionType.EGG,
                    "家庭和睦秘籍",
                    List.of(opt("领取")));
        }
    }

    private Episode createEpisode(Drama drama, int number, String title, int duration) {
        Episode ep = new Episode();
        ep.setDrama(drama);
        ep.setEpisodeNumber(number);
        ep.setTitle(title);
        ep.setVideoUrl("/videos/" + drama.getTitle() + "/第" + number + "集.mp4");
        ep.setDurationSeconds(duration);
        return episodeRepository.save(ep);
    }

    private void createInteraction(Episode episode, Long timestampMs,
                                   InteractionPoint.InteractionType type,
                                   String question, List<OptionDef> optionDefs) {
        InteractionPoint point = new InteractionPoint();
        point.setEpisode(episode);
        point.setTimestampMs(timestampMs);
        point.setInteractionType(type);
        point.setQuestionText(question);
        point = interactionPointRepository.save(point);

        for (int i = 0; i < optionDefs.size(); i++) {
            InteractionOption option = new InteractionOption();
            option.setInteractionPoint(point);
            option.setOptionIndex(i + 1);
            option.setOptionText(optionDefs.get(i).text);
            option.setIsCorrect(optionDefs.get(i).isCorrect);
            point.getOptions().add(option);
        }
        interactionPointRepository.save(point);
    }

    private static OptionDef opt(String text) {
        return new OptionDef(text, false);
    }

    private static OptionDef optCorrect(String text) {
        return new OptionDef(text, true);
    }

    private record OptionDef(String text, boolean isCorrect) {}
}
