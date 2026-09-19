-- ============================================================================
--  智慧膳系统 · MySQL 8 数据库结构
--  ---------------------------------------------------------------------------
--  设计原则
--    1. 只存事实，派生值（达标率 / 徽章 / 颜色 / 分档）由查询或服务层计算
--    2. 接口契约保持不变：表结构可直接支撑现有全部路由的响应字段
--    3. 三端共用一个库：小程序学生端 / 大屏后厨端 / 管理端靠角色区分
--
--  字符集 utf8mb4 / 引擎 InnoDB（需要外键与事务）
--  执行： mysql -u root -p < sql/schema.sql
-- ============================================================================

SET NAMES utf8mb4;
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

CREATE DATABASE IF NOT EXISTS zhipan_canteen
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE zhipan_canteen;

-- ---------------------------------------------------------------------------
-- 如需「清空重建」，取消下面 4 行注释后再执行本脚本
-- ---------------------------------------------------------------------------
-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP TABLE IF EXISTS recommendation_log, dish_sales_daily, game_chest_log,
--   student_game_profile, remind_setting, checkin_record, nutrition_daily,
--   meal_record_item, meal_record, dish_allergen, dish_tag, tag, dish, canteen,
--   student_allergen, allergen, student_goal, student, admin_user, college;
-- SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================================
--  一、身份与档案
-- ============================================================================

-- 学院字典（对应大屏「各学院营养评分对比」）
CREATE TABLE IF NOT EXISTS college (
  id   SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '学院ID',
  name VARCHAR(32) NOT NULL COMMENT '学院名称',
  PRIMARY KEY (id),
  UNIQUE KEY uk_college_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学院字典';

-- 管理端账号（替代 middleware/auth.js 里写死的固定 token）
CREATE TABLE IF NOT EXISTS admin_user (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(32)  NOT NULL COMMENT '登录名',
  password_hash VARCHAR(160) NOT NULL COMMENT 'scrypt$salt$hash，见 utils/password.js',
  name          VARCHAR(32)  NOT NULL COMMENT '显示名',
  role          VARCHAR(16)  NOT NULL DEFAULT 'admin' COMMENT 'admin 管理员 / kitchen 后厨 / viewer 只读',
  status        TINYINT      NOT NULL DEFAULT 1 COMMENT '1 启用 0 停用',
  last_login_at DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_admin_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理端账号';

-- 学生主表：合并原 students + studentProfiles + studentAccounts 三处数据
CREATE TABLE IF NOT EXISTS student (
  id            BIGINT UNSIGNED   NOT NULL COMMENT '学号，如 2023010042',
  account       VARCHAR(32)       NOT NULL COMMENT '登录账号，如 stu2023010042',
  password_hash VARCHAR(160)      NOT NULL COMMENT 'scrypt$salt$hash',
  name          VARCHAR(32)       NOT NULL,
  gender        VARCHAR(4)        NOT NULL DEFAULT '男' COMMENT '男 / 女',
  age           TINYINT UNSIGNED  NULL,
  college_id    SMALLINT UNSIGNED NULL,
  avatar        VARCHAR(16)       NULL COMMENT 'emoji 头像',
  diet_type     VARCHAR(16)       NOT NULL DEFAULT '无限制' COMMENT '无限制/清真/蛋奶素/无麸质/低敏',
  height_cm     DECIMAL(5,1)      NULL,
  weight_kg     DECIMAL(5,1)      NULL,
  bmi           DECIMAL(4,1)      NULL COMMENT '由身高体重计算后写入',
  status        TINYINT           NOT NULL DEFAULT 1 COMMENT '1 在读 0 离校',
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_student_account (account),
  KEY idx_student_college (college_id),
  KEY idx_student_name (name),
  CONSTRAINT fk_student_college FOREIGN KEY (college_id)
    REFERENCES college (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生档案';

-- 每人营养目标（原 todayNutritionStore 里的 *Target 字段）
CREATE TABLE IF NOT EXISTS student_goal (
  student_id     BIGINT UNSIGNED   NOT NULL,
  goal_type      VARCHAR(16)       NOT NULL DEFAULT '均衡饮食' COMMENT '健康增重/减脂塑形/均衡饮食/增肌增重',
  cal_target     SMALLINT UNSIGNED NOT NULL DEFAULT 2200 COMMENT 'kcal',
  protein_target SMALLINT UNSIGNED NOT NULL DEFAULT 75 COMMENT 'g',
  carbs_target   SMALLINT UNSIGNED NOT NULL DEFAULT 280 COMMENT 'g',
  fat_target     SMALLINT UNSIGNED NOT NULL DEFAULT 65 COMMENT 'g',
  fiber_target   SMALLINT UNSIGNED NOT NULL DEFAULT 25 COMMENT 'g',
  updated_at     DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id),
  CONSTRAINT fk_goal_student FOREIGN KEY (student_id)
    REFERENCES student (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生营养目标';

-- 过敏原字典
CREATE TABLE IF NOT EXISTS allergen (
  id   SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(16) NOT NULL COMMENT '花生/海鲜/虾蟹/芒果/牛奶/鸡蛋/麸质/坚果',
  PRIMARY KEY (id),
  UNIQUE KEY uk_allergen_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='过敏原字典';

-- 学生过敏原（原 allergyList 数组，现在是真正的多对多）
CREATE TABLE IF NOT EXISTS student_allergen (
  student_id  BIGINT UNSIGNED   NOT NULL,
  allergen_id SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (student_id, allergen_id),
  KEY idx_sa_allergen (allergen_id),
  CONSTRAINT fk_sa_student FOREIGN KEY (student_id) REFERENCES student (id) ON DELETE CASCADE,
  CONSTRAINT fk_sa_allergen FOREIGN KEY (allergen_id) REFERENCES allergen (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生过敏原关联';


-- ============================================================================
--  二、菜品与供应
-- ============================================================================

-- 食堂/窗口（大屏「食堂数量 3」与窗口销量榜）
CREATE TABLE IF NOT EXISTS canteen (
  id       SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name     VARCHAR(32) NOT NULL COMMENT '第一食堂 / 第二食堂 / 第三食堂',
  location VARCHAR(64) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_canteen_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食堂/窗口字典';

-- 菜品主表（对应 foodDB）
CREATE TABLE IF NOT EXISTS dish (
  id          BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  canteen_id  SMALLINT UNSIGNED NULL,
  name        VARCHAR(64)       NOT NULL,
  emoji       VARCHAR(16)       NULL,
  category    VARCHAR(24)       NOT NULL DEFAULT '热菜' COMMENT '荤菜/素菜/汤品/主食/小吃/饮品',
  cal         SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '每份 kcal',
  protein     DECIMAL(5,1)      NOT NULL DEFAULT 0,
  fat         DECIMAL(5,1)      NOT NULL DEFAULT 0,
  carbs       DECIMAL(5,1)      NOT NULL DEFAULT 0,
  fiber       DECIMAL(5,1)      NOT NULL DEFAULT 0,
  price       DECIMAL(6,2)      NOT NULL DEFAULT 0,
  description VARCHAR(255)      NULL,
  on_sale     TINYINT           NOT NULL DEFAULT 1 COMMENT '1 在售 0 下架',
  created_at  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_dish_canteen_sale (canteen_id, on_sale),
  KEY idx_dish_category (category),
  KEY idx_dish_name (name),
  CONSTRAINT fk_dish_canteen FOREIGN KEY (canteen_id)
    REFERENCES canteen (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜品';

CREATE TABLE IF NOT EXISTS tag (
  id   SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(16) NOT NULL COMMENT '高蛋白/低脂/高纤维/低卡/低GI/粗粮/补铁/人气王/易消化',
  PRIMARY KEY (id),
  UNIQUE KEY uk_tag_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜品标签字典';

CREATE TABLE IF NOT EXISTS dish_tag (
  dish_id BIGINT UNSIGNED   NOT NULL,
  tag_id  SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (dish_id, tag_id),
  KEY idx_dt_tag (tag_id),
  CONSTRAINT fk_dt_dish FOREIGN KEY (dish_id) REFERENCES dish (id) ON DELETE CASCADE,
  CONSTRAINT fk_dt_tag FOREIGN KEY (tag_id) REFERENCES tag (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜品标签关联';

-- 菜品含哪些过敏原 —— 推荐接口据此做过敏拦截（当前 Mock 完全没有这个能力）
CREATE TABLE IF NOT EXISTS dish_allergen (
  dish_id     BIGINT UNSIGNED   NOT NULL,
  allergen_id SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (dish_id, allergen_id),
  KEY idx_da_allergen (allergen_id),
  CONSTRAINT fk_da_dish FOREIGN KEY (dish_id) REFERENCES dish (id) ON DELETE CASCADE,
  CONSTRAINT fk_da_allergen FOREIGN KEY (allergen_id) REFERENCES allergen (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜品过敏原关联';


-- ============================================================================
--  三、用餐事实（明细）
-- ============================================================================

-- 一餐一行。唯一键保证「同一天同一餐」不重复写入，天然幂等
CREATE TABLE IF NOT EXISTS meal_record (
  id            BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  student_id    BIGINT UNSIGNED   NOT NULL,
  meal_date     DATE              NOT NULL,
  meal_type     VARCHAR(8)        NOT NULL COMMENT '早餐/午餐/晚餐/加餐',
  meal_time     TIME              NULL,
  total_cal     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  total_protein DECIMAL(5,1)      NOT NULL DEFAULT 0,
  total_cost    DECIMAL(7,2)      NOT NULL DEFAULT 0,
  source        TINYINT           NOT NULL DEFAULT 1 COMMENT '1 刷卡 2 手动 3 拍照识别',
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_meal_student_date_type (student_id, meal_date, meal_type),
  KEY idx_meal_date (meal_date),
  KEY idx_meal_student_date (student_id, meal_date),
  CONSTRAINT fk_meal_student FOREIGN KEY (student_id)
    REFERENCES student (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用餐记录（餐次）';

-- 一餐中的每道菜。营养值 = 下单时快照，菜品配方变更不影响历史
CREATE TABLE IF NOT EXISTS meal_record_item (
  id        BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  record_id BIGINT UNSIGNED   NOT NULL,
  dish_id   BIGINT UNSIGNED   NOT NULL,
  meal_date DATE              NOT NULL COMMENT '冗余自 meal_record，便于按天归档/分区',
  qty       DECIMAL(4,1)      NOT NULL DEFAULT 1,
  cal       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  protein   DECIMAL(5,1)      NOT NULL DEFAULT 0,
  fat       DECIMAL(5,1)      NOT NULL DEFAULT 0,
  carbs     DECIMAL(5,1)      NOT NULL DEFAULT 0,
  fiber     DECIMAL(5,1)      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_item_record (record_id),
  KEY idx_item_date (meal_date),
  KEY idx_item_dish_date (dish_id, meal_date),
  CONSTRAINT fk_item_record FOREIGN KEY (record_id) REFERENCES meal_record (id) ON DELETE CASCADE,
  CONSTRAINT fk_item_dish FOREIGN KEY (dish_id) REFERENCES dish (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用餐明细（菜品）';

-- 每日营养汇总（物化表）。首页 / 冒险页折线图 / 热力图 / 纤维分布 / 月度趋势都读它，
-- 避免每次都扫明细表。生产环境由写后重算或定时任务维护。
CREATE TABLE IF NOT EXISTS nutrition_daily (
  student_id BIGINT UNSIGNED   NOT NULL,
  stat_date  DATE              NOT NULL,
  calories   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  protein    DECIMAL(5,1)      NOT NULL DEFAULT 0,
  carbs      DECIMAL(5,1)      NOT NULL DEFAULT 0,
  fat        DECIMAL(5,1)      NOT NULL DEFAULT 0,
  fiber      DECIMAL(5,1)      NOT NULL DEFAULT 0,
  score      TINYINT UNSIGNED  NOT NULL DEFAULT 0 COMMENT '0-100 营养评分',
  checked    TINYINT           NOT NULL DEFAULT 0 COMMENT '是否已打卡',
  updated_at DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, stat_date),
  KEY idx_nd_date_score (stat_date, score),
  KEY idx_nd_date_fiber (stat_date, fiber),
  CONSTRAINT fk_nd_student FOREIGN KEY (student_id)
    REFERENCES student (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日营养汇总';

-- 打卡流水（审计用；nutrition_daily.checked 只存最新状态）
CREATE TABLE IF NOT EXISTS checkin_record (
  id           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  student_id   BIGINT UNSIGNED  NOT NULL,
  check_date   DATE             NOT NULL,
  score_before TINYINT UNSIGNED NULL,
  score_after  TINYINT UNSIGNED NULL,
  created_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_checkin_student_date (student_id, check_date),
  KEY idx_checkin_date (check_date),
  CONSTRAINT fk_checkin_student FOREIGN KEY (student_id)
    REFERENCES student (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打卡流水';

-- 菜品每日销量 —— 热力图 / 销量预测 / 采购建议的真实数据源
CREATE TABLE IF NOT EXISTS dish_sales_daily (
  dish_id   BIGINT UNSIGNED   NOT NULL,
  stat_date DATE              NOT NULL,
  qty       SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '售出份数',
  PRIMARY KEY (dish_id, stat_date),
  KEY idx_dsd_date (stat_date),
  CONSTRAINT fk_dsd_dish FOREIGN KEY (dish_id) REFERENCES dish (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜品每日销量';


-- ============================================================================
--  四、提醒 / 游戏化 / 推荐
-- ============================================================================

-- 三餐提醒（原 remindSettingsStore）
CREATE TABLE IF NOT EXISTS remind_setting (
  student_id  BIGINT UNSIGNED NOT NULL,
  meal_type   VARCHAR(8)      NOT NULL COMMENT '早餐/午餐/晚餐',
  enabled     TINYINT         NOT NULL DEFAULT 1,
  remind_time TIME            NOT NULL,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, meal_type),
  CONSTRAINT fk_remind_student FOREIGN KEY (student_id)
    REFERENCES student (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用餐提醒设置';

-- 游戏化档案（原 studentProfiles 里的 level / checkDays / avgScore + 小程序主题）
CREATE TABLE IF NOT EXISTS student_game_profile (
  student_id BIGINT UNSIGNED   NOT NULL,
  level      TINYINT UNSIGNED  NOT NULL DEFAULT 1,
  coin       INT UNSIGNED      NOT NULL DEFAULT 0,
  theme      VARCHAR(16)       NOT NULL DEFAULT 'night' COMMENT '小程序主题：night/dawn/mint/lavender/snow',
  check_days SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '累计打卡天数',
  avg_score  TINYINT UNSIGNED  NOT NULL DEFAULT 0 COMMENT '平均营养评分',
  updated_at DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id),
  CONSTRAINT fk_game_student FOREIGN KEY (student_id)
    REFERENCES student (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏化档案';

-- 宝箱开启记录：唯一键 (student_id, open_date) 天然实现「每日只能开一次」
-- 替代现在小程序里比对 storage 日期字符串的做法
CREATE TABLE IF NOT EXISTS game_chest_log (
  id         BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED   NOT NULL,
  open_date  DATE              NOT NULL,
  coin       SMALLINT UNSIGNED NOT NULL DEFAULT 50 COMMENT '获得金币',
  created_at DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_chest_student_date (student_id, open_date),
  CONSTRAINT fk_chest_student FOREIGN KEY (student_id)
    REFERENCES student (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='宝箱开启记录（每日一次）';

-- 推荐曝光/采纳日志（可选：用于评估推荐效果）
CREATE TABLE IF NOT EXISTS recommendation_log (
  id         BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED  NOT NULL,
  rec_date   DATE             NOT NULL,
  dish_id    BIGINT UNSIGNED  NULL,
  rank_no    TINYINT UNSIGNED NOT NULL DEFAULT 1,
  score      TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '推荐得分 0-100',
  adopted    TINYINT          NOT NULL DEFAULT 0 COMMENT '1 学生采纳',
  created_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reclog_student_date (student_id, rec_date),
  KEY idx_reclog_dish (dish_id),
  CONSTRAINT fk_reclog_student FOREIGN KEY (student_id) REFERENCES student (id) ON DELETE CASCADE,
  CONSTRAINT fk_reclog_dish FOREIGN KEY (dish_id) REFERENCES dish (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='推荐日志';


-- ============================================================================
--  五、视图：把原来写死的统计口径变成可复算的查询
-- ============================================================================

-- 今日营养（实时聚合当天明细；当天数据量小，走 uk_meal_student_date_type）
CREATE OR REPLACE VIEW v_student_today_nutrition AS
SELECT r.student_id                AS student_id,
       r.meal_date                 AS stat_date,
       SUM(i.cal)                  AS calories,
       SUM(i.protein)              AS protein,
       SUM(i.carbs)                AS carbs,
       SUM(i.fat)                  AS fat,
       SUM(i.fiber)                AS fiber
FROM meal_record r
JOIN meal_record_item i ON i.record_id = r.id
WHERE r.meal_date = CURDATE()
GROUP BY r.student_id, r.meal_date;

-- 膳食纤维分档（对应 /api/overview/fiber-dist，当前写死为 1,120 / 1,760 / 1,120）
CREATE OR REPLACE VIEW v_fiber_distribution AS
SELECT CASE
         WHEN fiber < 10 THEN '严重不足 (<10g)'
         WHEN fiber < 20 THEN '摄入不足 (10-20g)'
         ELSE '基本达标 (>=20g)'
       END      AS band,
       COUNT(*) AS student_count
FROM nutrition_daily
WHERE stat_date = CURDATE()
GROUP BY band;

-- 群体营养达标率（对应 /api/group-radar 的 actual[]，标准值为 100）
CREATE OR REPLACE VIEW v_group_nutrition_ratio AS
SELECT ROUND(AVG(d.calories / NULLIF(g.cal_target, 0)) * 100)     AS cal_ratio,
       ROUND(AVG(d.protein  / NULLIF(g.protein_target, 0)) * 100) AS protein_ratio,
       ROUND(AVG(d.fat      / NULLIF(g.fat_target, 0)) * 100)     AS fat_ratio,
       ROUND(AVG(d.carbs    / NULLIF(g.carbs_target, 0)) * 100)   AS carbs_ratio,
       ROUND(AVG(d.fiber    / NULLIF(g.fiber_target, 0)) * 100)   AS fiber_ratio,
       COUNT(DISTINCT d.student_id)                               AS student_count
FROM nutrition_daily d
JOIN student_goal g ON g.student_id = d.student_id
WHERE d.stat_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY);

-- 学生健康分层（对应大屏「健康学生 / 亚健康 / 高风险」，当前写死 2,845 / 1,059 / 96）
CREATE OR REPLACE VIEW v_student_health_level AS
SELECT student_id,
       CASE WHEN score >= 80 THEN '健康'
            WHEN score >= 60 THEN '亚健康'
            ELSE '高风险'
       END    AS level,
       score,
       stat_date
FROM nutrition_daily
WHERE stat_date = CURDATE();


-- ============================================================================
--  六、字典数据（静态参照数据，随结构一起初始化）
-- ============================================================================

INSERT IGNORE INTO college (name) VALUES
  ('计算机学院'), ('经管学院'), ('文学院'), ('理学院'), ('工程学院'),
  ('医学院'), ('艺术学院'), ('体育学院'), ('外国语学院');

INSERT IGNORE INTO canteen (name, location) VALUES
  ('第一食堂', '东区生活区'), ('第二食堂', '西区生活区'), ('第三食堂', '南区生活区');

INSERT IGNORE INTO allergen (name) VALUES
  ('花生'), ('海鲜'), ('虾蟹'), ('芒果'), ('牛奶'), ('鸡蛋'), ('麸质'), ('坚果');

INSERT IGNORE INTO tag (name) VALUES
  ('高蛋白'), ('低脂'), ('高纤维'), ('低卡'), ('低GI'), ('粗粮'), ('补铁'), ('人气王'), ('易消化');

-- 说明：管理员账号与学生数据由 scripts/seed.js 生成（需要计算密码哈希）
