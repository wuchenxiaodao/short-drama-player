# 短剧互动播放器全栈重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 对短剧互动播放器进行渐进式全栈重构，以测试覆盖为优先，逐步提升代码质量、性能和用户体验。

**Architecture:** 采用渐进式重构策略，保持现有功能可用。先建立测试基础，再优化后端架构，最后重构前端代码。

**Tech Stack:** Java 17, Spring Boot 3.2, JUnit 5, Mockito, H2, JavaScript, HTML5, CSS3

---

## 文件结构映射

### 后端测试文件
- Create: `backend/src/test/java/com/drama/service/DramaServiceTest.java`
- Create: `backend/src/test/java/com/drama/service/EpisodeServiceTest.java`
- Create: `backend/src/test/java/com/drama/service/InteractionServiceTest.java`
- Create: `backend/src/test/java/com/drama/service/ProgressServiceTest.java`
- Create: `backend/src/test/java/com/drama/service/AuthServiceTest.java`
- Create: `backend/src/test/java/com/drama/service/CommentServiceTest.java`
- Create: `backend/src/test/java/com/drama/service/RatingServiceTest.java`
- Create: `backend/src/test/java/com/drama/service/UserProfileServiceTest.java`
- Create: `backend/src/test/java/com/drama/controller/DramaControllerIntegrationTest.java`
- Create: `backend/src/test/java/com/drama/controller/EpisodeControllerIntegrationTest.java`
- Create: `backend/src/test/java/com/drama/factory/TestDataFactory.java`

### 后端重构文件
- Modify: `backend/src/main/java/com/drama/service/*.java`
- Create: `backend/src/main/java/com/drama/common/ApiResponse.java`
- Create: `backend/src/main/java/com/drama/exception/GlobalExceptionHandler.java`
- Modify: `backend/src/main/java/com/drama/controller/*.java`
- Modify: `backend/src/main/java/com/drama/repository/*.java`

### 前端重构文件
- Create: `frontend/index.html`
- Create: `frontend/css/styles.css`
- Create: `frontend/css/player.css`
- Create: `frontend/css/interaction.css`
- Create: `frontend/js/app.js`
- Create: `frontend/js/player.js`
- Create: `frontend/js/interaction.js`
- Create: `frontend/js/api.js`
- Create: `frontend/js/utils.js`
- Create: `frontend/js/state.js`

---

## Task 1: 添加测试依赖和配置

**Files:**
- Modify: `backend/pom.xml`

- [ ] **Step 1: 添加测试依赖**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
</dependency>
```

- [ ] **Step 2: 创建测试配置文件**

Create: `backend/src/test/resources/application-test.properties`
```properties
spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
```

- [ ] **Step 3: 验证依赖配置**

Run: `cd backend && ./mvnw clean compile -DskipTests`
Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add backend/pom.xml backend/src/test/resources/application-test.properties
git commit -m "feat: 添加测试依赖和配置"
```

---

## Task 2: 创建测试数据工厂

**Files:**
- Create: `backend/src/test/java/com/drama/factory/TestDataFactory.java`

- [ ] **Step 1: 创建测试数据工厂类**

```java
package com.drama.factory;

import com.drama.model.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class TestDataFactory {

    public static Drama createDrama(Long id, String title) {
        Drama drama = new Drama();
        drama.setId(id);
        drama.setTitle(title);
        drama.setDescription("测试短剧描述");
        drama.setCoverUrl("/images/test.jpg");
        drama.setTotalEpisodes(10);
        drama.setStatus("ONGOING");
        drama.setCreatedAt(LocalDateTime.now());
        return drama;
    }

    public static Episode createEpisode(Long id, Drama drama, int episodeNumber) {
        Episode episode = new Episode();
        episode.setId(id);
        episode.setDrama(drama);
        episode.setEpisodeNumber(episodeNumber);
        episode.setTitle("第" + episodeNumber + "集");
        episode.setVideoUrl("/videos/test.mp4");
        episode.setDuration(180);
        return episode;
    }

    public static User createUser(Long id, String username) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setPassword("password123");
        user.setEmail(username + "@test.com");
        user.setCreatedAt(LocalDateTime.now());
        return user;
    }

    public static InteractionPoint createInteractionPoint(Long id, Episode episode, int timestamp) {
        InteractionPoint point = new InteractionPoint();
        point.setId(id);
        point.setEpisode(episode);
        point.setTimestamp(timestamp);
        point.setType("VOTE");
        point.setQuestion("测试问题？");
        point.setOptions(List.of("选项A", "选项B", "选项C"));
        point.setCorrectAnswer("选项A");
        point.setPoints(10);
        return point;
    }

    public static Comment createComment(Long id, User user, InteractionPoint point) {
        Comment comment = new Comment();
        comment.setId(id);
        comment.setUser(user);
        comment.setInteractionPoint(point);
        comment.setContent("测试评论内容");
        comment.setCreatedAt(LocalDateTime.now());
        comment.setLikeCount(0);
        return comment;
    }

    public static Rating createRating(Long id, User user, Drama drama) {
        Rating rating = new Rating();
        rating.setId(id);
        rating.setUser(user);
        rating.setDrama(drama);
        rating.setScore(8);
        rating.setCreatedAt(LocalDateTime.now());
        return rating;
    }
}
```

- [ ] **Step 2: 验证编译**

Run: `cd backend && ./mvnw clean compile -DskipTests`
Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add backend/src/test/java/com/drama/factory/TestDataFactory.java
git commit -m "feat: 创建测试数据工厂"
```

---

## Task 3: DramaService 单元测试

**Files:**
- Create: `backend/src/test/java/com/drama/service/DramaServiceTest.java`
- Modify: `backend/src/main/java/com/drama/service/DramaService.java`

- [ ] **Step 1: 创建 DramaService 测试类**

```java
package com.drama.service;

import com.drama.factory.TestDataFactory;
import com.drama.model.Drama;
import com.drama.repository.DramaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DramaServiceTest {

    @Mock
    private DramaRepository dramaRepository;

    @InjectMocks
    private DramaService dramaService;

    private Drama testDrama;

    @BeforeEach
    void setUp() {
        testDrama = TestDataFactory.createDrama(1L, "测试短剧");
    }

    @Test
    void getRecommendDramas_ShouldReturnDramas() {
        // Arrange
        List<Drama> expectedDramas = Arrays.asList(testDrama);
        when(dramaRepository.findByStatusOrderByCreatedAtDesc(any(), any())).thenReturn(expectedDramas);

        // Act
        List<Drama> result = dramaService.getRecommendDramas(0, 10);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("测试短剧", result.get(0).getTitle());
        verify(dramaRepository).findByStatusOrderByCreatedAtDesc(any(), any());
    }

    @Test
    void getHotDramas_ShouldReturnDramas() {
        // Arrange
        List<Drama> expectedDramas = Arrays.asList(testDrama);
        when(dramaRepository.findHotDramas(any())).thenReturn(expectedDramas);

        // Act
        List<Drama> result = dramaService.getHotDramas(0, 10);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(dramaRepository).findHotDramas(any());
    }

    @Test
    void getDramaDetail_WhenExists_ShouldReturnDrama() {
        // Arrange
        when(dramaRepository.findById(1L)).thenReturn(Optional.of(testDrama));

        // Act
        Optional<Drama> result = dramaService.getDramaDetail(1L);

        // Assert
        assertTrue(result.isPresent());
        assertEquals("测试短剧", result.get().getTitle());
        verify(dramaRepository).findById(1L);
    }

    @Test
    void getDramaDetail_WhenNotExists_ShouldReturnEmpty() {
        // Arrange
        when(dramaRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        Optional<Drama> result = dramaService.getDramaDetail(999L);

        // Assert
        assertFalse(result.isPresent());
        verify(dramaRepository).findById(999L);
    }

    @Test
    void searchDramas_ShouldReturnMatchingDramas() {
        // Arrange
        List<Drama> expectedDramas = Arrays.asList(testDrama);
        when(dramaRepository.findByTitleContainingOrDescriptionContaining(any(), any(), any())).thenReturn(expectedDramas);

        // Act
        List<Drama> result = dramaService.searchDramas("测试");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(dramaRepository).findByTitleContainingOrDescriptionContaining(any(), any(), any());
    }

    @Test
    void getNewDramas_ShouldReturnDramas() {
        // Arrange
        List<Drama> expectedDramas = Arrays.asList(testDrama);
        when(dramaRepository.findByStatusOrderByCreatedAtDesc(any(), any())).thenReturn(expectedDramas);

        // Act
        List<Drama> result = dramaService.getNewDramas(0, 10);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(dramaRepository).findByStatusOrderByCreatedAtDesc(any(), any());
    }
}
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd backend && ./mvnw test -Dtest=DramaServiceTest`
Expected: FAIL (DramaService 方法可能不存在)

- [ ] **Step 3: 实现 DramaService 方法**

确保 DramaService 包含以下方法：
```java
@Service
public class DramaService {

    @Autowired
    private DramaRepository dramaRepository;

    public List<Drama> getRecommendDramas(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return dramaRepository.findByStatusOrderByCreatedAtDesc("ONGOING", pageable);
    }

    public List<Drama> getHotDramas(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return dramaRepository.findHotDramas(pageable);
    }

    public Optional<Drama> getDramaDetail(Long id) {
        return dramaRepository.findById(id);
    }

    public List<Drama> searchDramas(String keyword) {
        return dramaRepository.findByTitleContainingOrDescriptionContaining(keyword, keyword, PageRequest.of(0, 20));
    }

    public List<Drama> getNewDramas(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return dramaRepository.findByStatusOrderByCreatedAtDesc("ONGOING", pageable);
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `cd backend && ./mvnw test -Dtest=DramaServiceTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/test/java/com/drama/service/DramaServiceTest.java
git commit -m "feat: 添加 DramaService 单元测试"
```

---

## Task 4: EpisodeService 单元测试

**Files:**
- Create: `backend/src/test/java/com/drama/service/EpisodeServiceTest.java`
- Modify: `backend/src/main/java/com/drama/service/EpisodeService.java`

- [ ] **Step 1: 创建 EpisodeService 测试类**

```java
package com.drama.service;

import com.drama.factory.TestDataFactory;
import com.drama.model.Drama;
import com.drama.model.Episode;
import com.drama.model.InteractionPoint;
import com.drama.repository.EpisodeRepository;
import com.drama.repository.InteractionPointRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EpisodeServiceTest {

    @Mock
    private EpisodeRepository episodeRepository;

    @Mock
    private InteractionPointRepository interactionPointRepository;

    @InjectMocks
    private EpisodeService episodeService;

    private Drama testDrama;
    private Episode testEpisode;
    private InteractionPoint testInteractionPoint;

    @BeforeEach
    void setUp() {
        testDrama = TestDataFactory.createDrama(1L, "测试短剧");
        testEpisode = TestDataFactory.createEpisode(1L, testDrama, 1);
        testInteractionPoint = TestDataFactory.createInteractionPoint(1L, testEpisode, 30);
    }

    @Test
    void getEpisodePlayInfo_WhenExists_ShouldReturnEpisodeWithInteractions() {
        // Arrange
        when(episodeRepository.findById(1L)).thenReturn(Optional.of(testEpisode));
        when(interactionPointRepository.findByEpisodeIdOrderByTimestamp(1L)).thenReturn(Arrays.asList(testInteractionPoint));

        // Act
        Optional<Episode> result = episodeService.getEpisodePlayInfo(1L);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(1, result.get().getEpisodeNumber());
        verify(episodeRepository).findById(1L);
        verify(interactionPointRepository).findByEpisodeIdOrderByTimestamp(1L);
    }

    @Test
    void getEpisodePlayInfo_WhenNotExists_ShouldReturnEmpty() {
        // Arrange
        when(episodeRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        Optional<Episode> result = episodeService.getEpisodePlayInfo(999L);

        // Assert
        assertFalse(result.isPresent());
        verify(episodeRepository).findById(999L);
        verifyNoInteractions(interactionPointRepository);
    }

    @Test
    void getEpisodesByDramaId_ShouldReturnEpisodes() {
        // Arrange
        List<Episode> expectedEpisodes = Arrays.asList(testEpisode);
        when(episodeRepository.findByDramaIdOrderByEpisodeNumber(1L)).thenReturn(expectedEpisodes);

        // Act
        List<Episode> result = episodeService.getEpisodesByDramaId(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1, result.get(0).getEpisodeNumber());
        verify(episodeRepository).findByDramaIdOrderByEpisodeNumber(1L);
    }
}
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd backend && ./mvnw test -Dtest=EpisodeServiceTest`
Expected: FAIL (EpisodeService 方法可能不存在)

- [ ] **Step 3: 实现 EpisodeService 方法**

确保 EpisodeService 包含以下方法：
```java
@Service
public class EpisodeService {

    @Autowired
    private EpisodeRepository episodeRepository;

    @Autowired
    private InteractionPointRepository interactionPointRepository;

    public Optional<Episode> getEpisodePlayInfo(Long episodeId) {
        Optional<Episode> episodeOpt = episodeRepository.findById(episodeId);
        if (episodeOpt.isPresent()) {
            Episode episode = episodeOpt.get();
            List<InteractionPoint> interactions = interactionPointRepository.findByEpisodeIdOrderByTimestamp(episodeId);
            episode.setInteractionPoints(interactions);
            return Optional.of(episode);
        }
        return Optional.empty();
    }

    public List<Episode> getEpisodesByDramaId(Long dramaId) {
        return episodeRepository.findByDramaIdOrderByEpisodeNumber(dramaId);
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `cd backend && ./mvnw test -Dtest=EpisodeServiceTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/test/java/com/drama/service/EpisodeServiceTest.java
git commit -m "feat: 添加 EpisodeService 单元测试"
```

---

## Task 5: InteractionService 单元测试

**Files:**
- Create: `backend/src/test/java/com/drama/service/InteractionServiceTest.java`
- Modify: `backend/src/main/java/com/drama/service/InteractionService.java`

- [ ] **Step 1: 创建 InteractionService 测试类**

```java
package com.drama.service;

import com.drama.factory.TestDataFactory;
import com.drama.model.*;
import com.drama.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InteractionServiceTest {

    @Mock
    private InteractionAnswerRepository answerRepository;

    @Mock
    private InteractionPointRepository pointRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private InteractionService interactionService;

    private User testUser;
    private InteractionPoint testPoint;
    private InteractionAnswer testAnswer;

    @BeforeEach
    void setUp() {
        testUser = TestDataFactory.createUser(1L, "testuser");
        testPoint = TestDataFactory.createInteractionPoint(1L, TestDataFactory.createEpisode(1L, TestDataFactory.createDrama(1L, "测试"), 1), 30);
        testAnswer = new InteractionAnswer();
        testAnswer.setId(1L);
        testAnswer.setUser(testUser);
        testAnswer.setInteractionPoint(testPoint);
        testAnswer.setSelectedOption("选项A");
        testAnswer.setCorrect(true);
        testAnswer.setPointsEarned(10);
    }

    @Test
    void submitAnswer_WhenCorrect_ShouldSaveWithPoints() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(pointRepository.findById(1L)).thenReturn(Optional.of(testPoint));
        when(answerRepository.save(any())).thenReturn(testAnswer);

        // Act
        InteractionAnswer result = interactionService.submitAnswer(1L, 1L, "选项A");

        // Assert
        assertNotNull(result);
        assertTrue(result.isCorrect());
        assertEquals(10, result.getPointsEarned());
        verify(answerRepository).save(any());
    }

    @Test
    void submitAnswer_WhenIncorrect_ShouldSaveWithZeroPoints() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(pointRepository.findById(1L)).thenReturn(Optional.of(testPoint));
        InteractionAnswer wrongAnswer = new InteractionAnswer();
        wrongAnswer.setSelectedOption("选项B");
        wrongAnswer.setCorrect(false);
        wrongAnswer.setPointsEarned(0);
        when(answerRepository.save(any())).thenReturn(wrongAnswer);

        // Act
        InteractionAnswer result = interactionService.submitAnswer(1L, 1L, "选项B");

        // Assert
        assertNotNull(result);
        assertFalse(result.isCorrect());
        assertEquals(0, result.getPointsEarned());
        verify(answerRepository).save(any());
    }

    @Test
    void getInteractionStats_ShouldReturnStats() {
        // Arrange
        when(pointRepository.findById(1L)).thenReturn(Optional.of(testPoint));
        when(answerRepository.countByInteractionPointId(1L)).thenReturn(100L);
        when(answerRepository.countByInteractionPointIdAndSelectedOption(1L, "选项A")).thenReturn(60L);
        when(answerRepository.countByInteractionPointIdAndSelectedOption(1L, "选项B")).thenReturn(30L);
        when(answerRepository.countByInteractionPointIdAndSelectedOption(1L, "选项C")).thenReturn(10L);

        // Act
        var result = interactionService.getInteractionStats(1L);

        // Assert
        assertNotNull(result);
        assertEquals(100L, result.getTotalAnswers());
        verify(answerRepository).countByInteractionPointId(1L);
    }
}
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd backend && ./mvnw test -Dtest=InteractionServiceTest`
Expected: FAIL

- [ ] **Step 3: 实现 InteractionService 方法**

```java
@Service
public class InteractionService {

    @Autowired
    private InteractionAnswerRepository answerRepository;

    @Autowired
    private InteractionPointRepository pointRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public InteractionAnswer submitAnswer(Long userId, Long interactionPointId, String selectedOption) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("用户不存在"));
        InteractionPoint point = pointRepository.findById(interactionPointId)
            .orElseThrow(() -> new RuntimeException("互动点不存在"));

        InteractionAnswer answer = new InteractionAnswer();
        answer.setUser(user);
        answer.setInteractionPoint(point);
        answer.setSelectedOption(selectedOption);
        answer.setCorrect(point.getCorrectAnswer().equals(selectedOption));
        answer.setPointsEarned(answer.isCorrect() ? point.getPoints() : 0);

        return answerRepository.save(answer);
    }

    public InteractionStats getInteractionStats(Long interactionPointId) {
        InteractionPoint point = pointRepository.findById(interactionPointId)
            .orElseThrow(() -> new RuntimeException("互动点不存在"));

        long totalAnswers = answerRepository.countByInteractionPointId(interactionPointId);
        Map<String, Long> optionCounts = new HashMap<>();
        for (String option : point.getOptions()) {
            long count = answerRepository.countByInteractionPointIdAndSelectedOption(interactionPointId, option);
            optionCounts.put(option, count);
        }

        InteractionStats stats = new InteractionStats();
        stats.setTotalAnswers(totalAnswers);
        stats.setOptionCounts(optionCounts);
        return stats;
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `cd backend && ./mvnw test -Dtest=InteractionServiceTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/test/java/com/drama/service/InteractionServiceTest.java
git commit -m "feat: 添加 InteractionService 单元测试"
```

---

## Task 6: AuthService 单元测试

**Files:**
- Create: `backend/src/test/java/com/drama/service/AuthServiceTest.java`
- Modify: `backend/src/main/java/com/drama/service/AuthService.java`

- [ ] **Step 1: 创建 AuthService 测试类**

```java
package com.drama.service;

import com.drama.factory.TestDataFactory;
import com.drama.model.User;
import com.drama.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = TestDataFactory.createUser(1L, "testuser");
    }

    @Test
    void register_WhenUsernameAvailable_ShouldCreateUser() {
        // Arrange
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.save(any())).thenReturn(testUser);

        // Act
        User result = authService.register("newuser", "password123", "newuser@test.com");

        // Assert
        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        verify(userRepository).existsByUsername("newuser");
        verify(userRepository).save(any());
    }

    @Test
    void register_WhenUsernameExists_ShouldThrowException() {
        // Arrange
        when(userRepository.existsByUsername("existinguser")).thenReturn(true);

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            authService.register("existinguser", "password123", "existing@test.com");
        });
        verify(userRepository).existsByUsername("existinguser");
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_WhenValidCredentials_ShouldReturnUser() {
        // Arrange
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        // Act
        Optional<User> result = authService.login("testuser", "password123");

        // Assert
        assertTrue(result.isPresent());
        assertEquals("testuser", result.get().getUsername());
        verify(userRepository).findByUsername("testuser");
    }

    @Test
    void login_WhenInvalidPassword_ShouldReturnEmpty() {
        // Arrange
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        // Act
        Optional<User> result = authService.login("testuser", "wrongpassword");

        // Assert
        assertFalse(result.isPresent());
        verify(userRepository).findByUsername("testuser");
    }

    @Test
    void login_WhenUserNotFound_ShouldReturnEmpty() {
        // Arrange
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // Act
        Optional<User> result = authService.login("nonexistent", "password123");

        // Assert
        assertFalse(result.isPresent());
        verify(userRepository).findByUsername("nonexistent");
    }

    @Test
    void getUserById_WhenExists_ShouldReturnUser() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // Act
        Optional<User> result = authService.getUserById(1L);

        // Assert
        assertTrue(result.isPresent());
        assertEquals("testuser", result.get().getUsername());
        verify(userRepository).findById(1L);
    }

    @Test
    void getUserById_WhenNotExists_ShouldReturnEmpty() {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        Optional<User> result = authService.getUserById(999L);

        // Assert
        assertFalse(result.isPresent());
        verify(userRepository).findById(999L);
    }
}
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd backend && ./mvnw test -Dtest=AuthServiceTest`
Expected: FAIL

- [ ] **Step 3: 实现 AuthService 方法**

```java
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public User register(String username, String password, String email) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("用户名已存在");
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(password); // 实际应用中需要加密
        user.setEmail(email);
        return userRepository.save(user);
    }

    public Optional<User> login(String username, String password) {
        return userRepository.findByUsername(username)
            .filter(user -> user.getPassword().equals(password));
    }

    public Optional<User> getUserById(Long userId) {
        return userRepository.findById(userId);
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `cd backend && ./mvnw test -Dtest=AuthServiceTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/test/java/com/drama/service/AuthServiceTest.java
git commit -m "feat: 添加 AuthService 单元测试"
```

---

## Task 7: 创建统一响应格式

**Files:**
- Create: `backend/src/main/java/com/drama/common/ApiResponse.java`
- Create: `backend/src/main/java/com/drama/exception/GlobalExceptionHandler.java`

- [ ] **Step 1: 创建 ApiResponse 类**

```java
package com.drama.common;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T> {
    private int code;
    private String message;
    private T data;

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "success", data);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(200, message, data);
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(500, message, null);
    }
}
```

- [ ] **Step 2: 创建全局异常处理器**

```java
package com.drama.exception;

import com.drama.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Void>> handleRuntimeException(RuntimeException e) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(500, "服务器内部错误"));
    }
}
```

- [ ] **Step 3: 验证编译**

Run: `cd backend && ./mvnw clean compile -DskipTests`
Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/drama/common/ApiResponse.java backend/src/main/java/com/drama/exception/GlobalExceptionHandler.java
git commit -m "feat: 添加统一响应格式和全局异常处理"
```

---

## Task 8: 重构 Controller 层使用统一响应格式

**Files:**
- Modify: `backend/src/main/java/com/drama/controller/DramaController.java`
- Modify: `backend/src/main/java/com/drama/controller/EpisodeController.java`
- Modify: `backend/src/main/java/com/drama/controller/InteractionController.java`
- Modify: `backend/src/main/java/com/drama/controller/AuthController.java`

- [ ] **Step 1: 重构 DramaController**

```java
@RestController
@RequestMapping("/api/drama")
public class DramaController {

    @Autowired
    private DramaService dramaService;

    @GetMapping("/recommend")
    public ApiResponse<List<Drama>> getRecommendDramas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(dramaService.getRecommendDramas(page, size));
    }

    @GetMapping("/hot")
    public ApiResponse<List<Drama>> getHotDramas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(dramaService.getHotDramas(page, size));
    }

    @GetMapping("/{id}/detail")
    public ApiResponse<Drama> getDramaDetail(@PathVariable Long id) {
        return dramaService.getDramaDetail(id)
            .map(ApiResponse::success)
            .orElse(ApiResponse.error(404, "短剧不存在"));
    }

    @GetMapping("/search")
    public ApiResponse<List<Drama>> searchDramas(@RequestParam String keyword) {
        return ApiResponse.success(dramaService.searchDramas(keyword));
    }

    @GetMapping("/new")
    public ApiResponse<List<Drama>> getNewDramas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(dramaService.getNewDramas(page, size));
    }
}
```

- [ ] **Step 2: 重构 EpisodeController**

```java
@RestController
@RequestMapping("/api/episode")
public class EpisodeController {

    @Autowired
    private EpisodeService episodeService;

    @GetMapping("/{id}/playinfo")
    public ApiResponse<Episode> getEpisodePlayInfo(@PathVariable Long id) {
        return episodeService.getEpisodePlayInfo(id)
            .map(ApiResponse::success)
            .orElse(ApiResponse.error(404, "剧集不存在"));
    }
}
```

- [ ] **Step 3: 重构 InteractionController**

```java
@RestController
@RequestMapping("/api/interaction")
public class InteractionController {

    @Autowired
    private InteractionService interactionService;

    @PostMapping("/answer")
    public ApiResponse<InteractionAnswer> submitAnswer(@RequestBody @Valid AnswerRequest request) {
        return ApiResponse.success(interactionService.submitAnswer(
            request.getUserId(), request.getInteractionPointId(), request.getSelectedOption()));
    }

    @GetMapping("/{id}/stats")
    public ApiResponse<InteractionStats> getInteractionStats(@PathVariable Long id) {
        return ApiResponse.success(interactionService.getInteractionStats(id));
    }
}
```

- [ ] **Step 4: 重构 AuthController**

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ApiResponse<User> register(@RequestBody @Valid RegisterRequest request) {
        return ApiResponse.success(authService.register(request.getUsername(), request.getPassword(), request.getEmail()));
    }

    @PostMapping("/login")
    public ApiResponse<User> login(@RequestBody @Valid LoginRequest request) {
        return authService.login(request.getUsername(), request.getPassword())
            .map(ApiResponse::success)
            .orElse(ApiResponse.error(401, "用户名或密码错误"));
    }

    @GetMapping("/{userId}")
    public ApiResponse<User> getUserInfo(@PathVariable Long userId) {
        return authService.getUserById(userId)
            .map(ApiResponse::success)
            .orElse(ApiResponse.error(404, "用户不存在"));
    }
}
```

- [ ] **Step 5: 验证编译**

Run: `cd backend && ./mvnw clean compile -DskipTests`
Expected: BUILD SUCCESS

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/drama/controller/*.java
git commit -m "refactor: 重构 Controller 层使用统一响应格式"
```

---

## Task 9: 创建前端模块化结构

**Files:**
- Create: `frontend/index.html`
- Create: `frontend/css/styles.css`
- Create: `frontend/css/player.css`
- Create: `frontend/css/interaction.css`
- Create: `frontend/js/app.js`
- Create: `frontend/js/player.js`
- Create: `frontend/js/interaction.js`
- Create: `frontend/js/api.js`
- Create: `frontend/js/utils.js`
- Create: `frontend/js/state.js`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p frontend/css frontend/js frontend/assets/images
```

- [ ] **Step 2: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>短剧播放器</title>
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/player.css">
    <link rel="stylesheet" href="css/interaction.css">
</head>
<body>
    <div id="app">
        <!-- 主页 -->
        <div id="home-page" class="page active">
            <div class="top-bar">
                <h1>短剧播放器</h1>
                <div class="search-icon" onclick="app.showSearch()">🔍</div>
            </div>
            <div class="banner-container">
                <div id="banner-carousel" class="banner-carousel"></div>
            </div>
            <div class="section">
                <h2 class="section-title">推荐短剧</h2>
                <div id="recommend-list" class="drama-grid"></div>
            </div>
            <div class="section">
                <h2 class="section-title">热播短剧</h2>
                <div id="hot-list" class="drama-grid"></div>
            </div>
        </div>

        <!-- 详情页 -->
        <div id="detail-page" class="page">
            <div class="detail-header">
                <button class="back-btn" onclick="app.goBack()">←</button>
                <h2 id="detail-title"></h2>
            </div>
            <div class="detail-content">
                <div class="detail-cover">
                    <img id="detail-cover-img" src="" alt="">
                </div>
                <div class="detail-info">
                    <p id="detail-description"></p>
                    <div class="detail-meta">
                        <span id="detail-episodes"></span>
                        <span id="detail-status"></span>
                    </div>
                </div>
                <div class="episode-list">
                    <h3>选集</h3>
                    <div id="episode-grid" class="episode-grid"></div>
                </div>
            </div>
        </div>

        <!-- 播放页 -->
        <div id="player-page" class="page">
            <div class="player-container">
                <video id="video-player" controls></video>
                <div id="interaction-overlay" class="interaction-overlay hidden"></div>
            </div>
            <div class="player-controls">
                <button class="back-btn" onclick="app.goBack()">←</button>
                <span id="player-title"></span>
            </div>
        </div>
    </div>

    <script src="js/utils.js"></script>
    <script src="js/state.js"></script>
    <script src="js/api.js"></script>
    <script src="js/player.js"></script>
    <script src="js/interaction.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 3: 创建 styles.css**

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --deep-black: #0A0A0A;
    --electric-purple: #8B5CF6;
    --purple-dark: #6D28D9;
    --purple-light: #A78BFA;
    --neon-pink: #FF2E6E;
    --cyan: #00F0FF;
    --dark-gray: #1A1A2E;
    --medium-gray: #2A2A3E;
    --light-gray: #9CA3AF;
    --card-bg: #16162A;
    --star-yellow: #FFC107;
    --highlight-gold: #FFD700;
}

body {
    font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
    background: var(--deep-black);
    color: #fff;
    overflow-x: hidden;
    max-width: 430px;
    margin: 0 auto;
    min-height: 100vh;
}

.page {
    display: none;
    padding-bottom: 70px;
}

.page.active {
    display: block;
}

.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 50px 16px 12px;
}

.top-bar h1 {
    font-size: 22px;
    color: var(--cyan);
    font-weight: 700;
}

.search-icon {
    font-size: 20px;
    cursor: pointer;
}

.banner-container {
    padding: 0 16px;
    margin-bottom: 20px;
}

.banner-carousel {
    height: 180px;
    background: linear-gradient(135deg, var(--purple-dark), var(--neon-pink));
    border-radius: 12px;
    overflow: hidden;
}

.section {
    padding: 0 16px;
    margin-bottom: 24px;
}

.section-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--cyan);
}

.drama-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.drama-card {
    background: var(--card-bg);
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s;
}

.drama-card:hover {
    transform: translateY(-2px);
}

.drama-card-cover {
    width: 100%;
    height: 120px;
    background: linear-gradient(135deg, var(--medium-gray), var(--dark-gray));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
}

.drama-card-info {
    padding: 8px;
}

.drama-card-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.drama-card-episodes {
    font-size: 12px;
    color: var(--light-gray);
}

.detail-header {
    display: flex;
    align-items: center;
    padding: 50px 16px 12px;
    background: var(--dark-gray);
}

.detail-header h2 {
    font-size: 18px;
    margin-left: 12px;
}

.back-btn {
    background: none;
    border: none;
    color: var(--cyan);
    font-size: 24px;
    cursor: pointer;
    padding: 4px 8px;
}

.detail-content {
    padding: 16px;
}

.detail-cover {
    width: 100%;
    height: 200px;
    background: linear-gradient(135deg, var(--purple-dark), var(--neon-pink));
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 16px;
}

.detail-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.detail-info {
    margin-bottom: 20px;
}

.detail-info p {
    font-size: 14px;
    line-height: 1.6;
    color: var(--light-gray);
    margin-bottom: 8px;
}

.detail-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: var(--light-gray);
}

.episode-list h3 {
    font-size: 16px;
    margin-bottom: 12px;
}

.episode-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
}

.episode-btn {
    background: var(--card-bg);
    border: 1px solid var(--medium-gray);
    color: #fff;
    padding: 8px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}

.episode-btn:hover {
    background: var(--electric-purple);
    border-color: var(--electric-purple);
}

.episode-btn.active {
    background: var(--electric-purple);
    border-color: var(--electric-purple);
}

.player-container {
    position: relative;
    width: 100%;
    background: #000;
}

#video-player {
    width: 100%;
    height: auto;
}

.player-controls {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: var(--dark-gray);
}

#player-title {
    margin-left: 12px;
    font-size: 16px;
}
```

- [ ] **Step 4: 创建 player.css**

```css
.player-container {
    position: relative;
    width: 100%;
    background: #000;
    aspect-ratio: 16/9;
}

#video-player {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.player-controls {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: var(--dark-gray);
}

#player-title {
    margin-left: 12px;
    font-size: 16px;
    font-weight: 500;
}

.player-progress {
    width: 100%;
    height: 4px;
    background: var(--medium-gray);
    cursor: pointer;
}

.player-progress-bar {
    height: 100%;
    background: var(--cyan);
    width: 0%;
    transition: width 0.1s;
}

.player-time {
    display: flex;
    justify-content: space-between;
    padding: 4px 16px;
    font-size: 12px;
    color: var(--light-gray);
}
```

- [ ] **Step 5: 创建 interaction.css**

```css
.interaction-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
}

.interaction-overlay.hidden {
    display: none;
}

.interaction-popup {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 20px;
    width: 90%;
    max-width: 360px;
    animation: popIn 0.3s ease-out;
}

@keyframes popIn {
    from {
        transform: scale(0.8);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}

.interaction-question {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    text-align: center;
}

.interaction-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.interaction-option {
    background: var(--medium-gray);
    border: 2px solid transparent;
    color: #fff;
    padding: 12px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;
    text-align: left;
}

.interaction-option:hover {
    background: var(--purple-dark);
    border-color: var(--electric-purple);
}

.interaction-option.selected {
    background: var(--electric-purple);
    border-color: var(--electric-purple);
}

.interaction-option.correct {
    background: #10B981;
    border-color: #10B981;
}

.interaction-option.wrong {
    background: #EF4444;
    border-color: #EF4444;
}

.interaction-result {
    text-align: center;
    margin-top: 16px;
}

.interaction-points {
    font-size: 24px;
    font-weight: 700;
    color: var(--highlight-gold);
}

.interaction-stats {
    margin-top: 16px;
}

.stat-bar {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

.stat-label {
    width: 60px;
    font-size: 14px;
}

.stat-progress {
    flex: 1;
    height: 8px;
    background: var(--medium-gray);
    border-radius: 4px;
    overflow: hidden;
    margin: 0 8px;
}

.stat-fill {
    height: 100%;
    background: var(--cyan);
    border-radius: 4px;
    transition: width 0.5s;
}

.stat-count {
    width: 40px;
    text-align: right;
    font-size: 14px;
    color: var(--light-gray);
}
```

- [ ] **Step 6: 创建 api.js**

```javascript
const API_BASE_URL = '/api';

const api = {
    async getRecommendDramas(page = 0, size = 10) {
        const response = await fetch(`${API_BASE_URL}/drama/recommend?page=${page}&size=${size}`);
        return response.json();
    },

    async getHotDramas(page = 0, size = 10) {
        const response = await fetch(`${API_BASE_URL}/drama/hot?page=${page}&size=${size}`);
        return response.json();
    },

    async getDramaDetail(id) {
        const response = await fetch(`${API_BASE_URL}/drama/${id}/detail`);
        return response.json();
    },

    async searchDramas(keyword) {
        const response = await fetch(`${API_BASE_URL}/drama/search?keyword=${encodeURIComponent(keyword)}`);
        return response.json();
    },

    async getEpisodePlayInfo(episodeId) {
        const response = await fetch(`${API_BASE_URL}/episode/${episodeId}/playinfo`);
        return response.json();
    },

    async submitAnswer(userId, interactionPointId, selectedOption) {
        const response = await fetch(`${API_BASE_URL}/interaction/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, interactionPointId, selectedOption })
        });
        return response.json();
    },

    async getInteractionStats(interactionId) {
        const response = await fetch(`${API_BASE_URL}/interaction/${interactionId}/stats`);
        return response.json();
    }
};
```

- [ ] **Step 7: 创建 utils.js**

```javascript
const utils = {
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    showLoading(element) {
        element.innerHTML = '<div class="loading">加载中...</div>';
    },

    showError(element, message) {
        element.innerHTML = `<div class="error">${message}</div>`;
    }
};
```

- [ ] **Step 8: 创建 state.js**

```javascript
const state = {
    currentPage: 'home',
    previousPage: null,
    currentDrama: null,
    currentEpisode: null,
    userId: localStorage.getItem('userId') || '1',

    setPage(page) {
        this.previousPage = this.currentPage;
        this.currentPage = page;
    },

    goBack() {
        if (this.previousPage) {
            this.currentPage = this.previousPage;
            this.previousPage = null;
        }
    }
};
```

- [ ] **Step 9: 创建 player.js**

```javascript
const player = {
    videoElement: null,
    currentEpisode: null,
    interactionPoints: [],
    currentTime: 0,

    init() {
        this.videoElement = document.getElementById('video-player');
        this.setupEventListeners();
    },

    setupEventListeners() {
        this.videoElement.addEventListener('timeupdate', utils.throttle(() => {
            this.currentTime = this.videoElement.currentTime;
            this.checkInteractionPoints();
        }, 1000));

        this.videoElement.addEventListener('ended', () => {
            this.onVideoEnded();
        });
    },

    loadEpisode(episode) {
        this.currentEpisode = episode;
        this.interactionPoints = episode.interactionPoints || [];
        this.videoElement.src = episode.videoUrl;
        document.getElementById('player-title').textContent = episode.title;
    },

    checkInteractionPoints() {
        const currentTime = Math.floor(this.currentTime);
        const point = this.interactionPoints.find(p => 
            p.timestamp === currentTime && !p.shown
        );

        if (point) {
            point.shown = true;
            this.showInteraction(point);
        }
    },

    showInteraction(point) {
        this.videoElement.pause();
        interaction.show(point);
    },

    onVideoEnded() {
        // 自动播放下一集
        console.log('视频播放结束');
    },

    play() {
        this.videoElement.play();
    },

    pause() {
        this.videoElement.pause();
    }
};
```

- [ ] **Step 10: 创建 interaction.js**

```javascript
const interaction = {
    currentPoint: null,

    show(point) {
        this.currentPoint = point;
        const overlay = document.getElementById('interaction-overlay');
        overlay.classList.remove('hidden');
        overlay.innerHTML = this.createInteractionHTML(point);
    },

    createInteractionHTML(point) {
        let html = `
            <div class="interaction-popup">
                <div class="interaction-question">${point.question}</div>
                <div class="interaction-options">
        `;

        point.options.forEach((option, index) => {
            html += `
                <button class="interaction-option" onclick="interaction.selectOption('${option}')">
                    ${option}
                </button>
            `;
        });

        html += `
                </div>
                <div id="interaction-result" class="interaction-result"></div>
            </div>
        `;

        return html;
    },

    async selectOption(option) {
        const result = await api.submitAnswer(
            state.userId,
            this.currentPoint.id,
            option
        );

        this.showResult(result, option);
    },

    showResult(result, selectedOption) {
        const options = document.querySelectorAll('.interaction-option');
        options.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent.trim() === this.currentPoint.correctAnswer) {
                btn.classList.add('correct');
            } else if (btn.textContent.trim() === selectedOption && !result.correct) {
                btn.classList.add('wrong');
            }
        });

        const resultDiv = document.getElementById('interaction-result');
        resultDiv.innerHTML = `
            <div class="interaction-points">
                ${result.correct ? `+${result.pointsEarned}` : '答错了'}
            </div>
            <button class="continue-btn" onclick="interaction.close()">
                继续观看
            </button>
        `;
    },

    close() {
        const overlay = document.getElementById('interaction-overlay');
        overlay.classList.add('hidden');
        player.play();
    }
};
```

- [ ] **Step 11: 创建 app.js**

```javascript
const app = {
    init() {
        player.init();
        this.loadHomePage();
        this.setupNavigation();
    },

    setupNavigation() {
        // 底部导航
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    },

    navigateTo(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`${page}-page`).classList.add('active');
        state.setPage(page);

        if (page === 'home') {
            this.loadHomePage();
        }
    },

    async loadHomePage() {
        await Promise.all([
            this.loadRecommendDramas(),
            this.loadHotDramas()
        ]);
    },

    async loadRecommendDramas() {
        const container = document.getElementById('recommend-list');
        utils.showLoading(container);

        try {
            const response = await api.getRecommendDramas();
            if (response.code === 200) {
                this.renderDramaList(container, response.data);
            }
        } catch (error) {
            utils.showError(container, '加载失败');
        }
    },

    async loadHotDramas() {
        const container = document.getElementById('hot-list');
        utils.showLoading(container);

        try {
            const response = await api.getHotDramas();
            if (response.code === 200) {
                this.renderDramaList(container, response.data);
            }
        } catch (error) {
            utils.showError(container, '加载失败');
        }
    },

    renderDramaList(container, dramas) {
        container.innerHTML = dramas.map(drama => `
            <div class="drama-card" onclick="app.showDramaDetail(${drama.id})">
                <div class="drama-card-cover">🎬</div>
                <div class="drama-card-info">
                    <div class="drama-card-title">${drama.title}</div>
                    <div class="drama-card-episodes">${drama.totalEpisodes}集</div>
                </div>
            </div>
        `).join('');
    },

    async showDramaDetail(dramaId) {
        const response = await api.getDramaDetail(dramaId);
        if (response.code === 200) {
            state.currentDrama = response.data;
            this.renderDramaDetail(response.data);
            this.navigateTo('detail');
        }
    },

    renderDramaDetail(drama) {
        document.getElementById('detail-title').textContent = drama.title;
        document.getElementById('detail-description').textContent = drama.description;
        document.getElementById('detail-episodes').textContent = `共${drama.totalEpisodes}集`;
        document.getElementById('detail-status').textContent = drama.status === 'ONGOING' ? '连载中' : '已完结';

        // 加载剧集列表
        this.loadEpisodes(drama.id);
    },

    async loadEpisodes(dramaId) {
        const container = document.getElementById('episode-grid');
        // 这里需要调用获取剧集列表的API
        container.innerHTML = '<p>加载中...</p>';
    },

    async playEpisode(episodeId) {
        const response = await api.getEpisodePlayInfo(episodeId);
        if (response.code === 200) {
            state.currentEpisode = response.data;
            player.loadEpisode(response.data);
            this.navigateTo('player');
            player.play();
        }
    },

    showSearch() {
        // 搜索功能
        console.log('显示搜索');
    },

    goBack() {
        if (state.previousPage) {
            this.navigateTo(state.previousPage);
        } else {
            this.navigateTo('home');
        }
    }
};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
```

- [ ] **Step 12: 验证文件创建**

```bash
ls -la frontend/
ls -la frontend/css/
ls -la frontend/js/
```

- [ ] **Step 13: Commit**

```bash
git add frontend/
git commit -m "feat: 创建前端模块化结构"
```

---

## Task 10: 运行所有测试并验证

**Files:**
- None

- [ ] **Step 1: 运行后端所有测试**

Run: `cd backend && ./mvnw test`
Expected: All tests PASS

- [ ] **Step 2: 检查测试覆盖率**

Run: `cd backend && ./mvnw jacoco:report`
Expected: 生成覆盖率报告

- [ ] **Step 3: 验证前端文件**

```bash
# 检查前端文件完整性
ls -la frontend/
cat frontend/index.html | head -20
```

- [ ] **Step 4: Commit 最终状态**

```bash
git add -A
git commit -m "feat: 完成全栈重构第一阶段 - 测试基础和代码结构优化"
```

- [ ] **Step 5: 推送到 GitHub**

```bash
git push origin master
```

---

## 完成检查清单

- [ ] 所有 Service 层单元测试通过
- [ ] 测试覆盖率达到目标（Service 80%+, Controller 70%+）
- [ ] 统一响应格式已实现
- [ ] 全局异常处理已添加
- [ ] 前端模块化结构已创建
- [ ] 代码已提交并推送到 GitHub
- [ ] 现有功能未被破坏

---

## 后续工作

1. **第二阶段**: 后端代码深度重构
2. **第三阶段**: 前端代码完善和性能优化
3. **第四阶段**: UI/UX 改进

---

**计划完成！** 准备开始执行。
