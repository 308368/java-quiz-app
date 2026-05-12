"""
Java面试题库扩充脚本
从B站PDF/MD资料提取题目，合并到questions.json
"""

import json
import re
import os
import pdfplumber
from pathlib import Path
from difflib import SequenceMatcher
from datetime import datetime

# ============ 配置 ============
BASE_DIR = Path("D:/claudeChat/java-quiz-app/data")
QUESTIONS_FILE = BASE_DIR / "questions.json"
SOURCES = {
    "hr": Path("D:/BaiduNetdiskDownload/B站面试的/B站Java面试突击班-HR面试软技能笔记"),
    "v1": Path("D:/BaiduNetdiskDownload/B站面试的/第一版-B站面试题-答案课件讲义"),
    "v2": Path("D:/BaiduNetdiskDownload/B站面试的/第二版-B站面试题-答案课件讲义"),
    "v3": Path("D:/BaiduNetdiskDownload/B站面试的/第三版-B站面试题-答案课件讲义"),
    "large_pdfs": Path("D:/BaiduNetdiskDownload/B站面试的"),
}

# 分类映射
CATEGORY_MAP = {
    "JavaSE-面试答案": "Java SE",
    "Java基础-面试答案": "Java SE",
    "JVM-面试答案": "JVM",
    "多线程--面试答案": "并发",
    "Spring-面试答案": "Spring",
    "redis-面试答案": "Redis",
    "MyBatis-面试答案": "MyBatis",
    "SpringBoot-面试答案": "SpringBoot",
    "ES-面试答案": "Elasticsearch",
    "设计模式-面试答案": "设计模式",
    "Java基础": "Java SE",
}

# 关键词→分类
KEYWORD_CATEGORY = {
    "jvm": "JVM",
    "mysql": "MySQL",
    "redis": "Redis",
    "spring": "Spring",
    "springcloud": "分布式",
    "多线程": "并发",
    "高并发": "并发",
    "消息中间件": "消息队列",
    "设计模式": "设计模式",
    "mybatis": "MyBatis",
    "springboot": "SpringBoot",
    "elasticsearch": "Elasticsearch",
    "场景题": "场景题",
    "分布式": "分布式",
    "微服务": "分布式",
}


# ============ 工具函数 ============
def normalize(text):
    """规范化文本：全角转半角、去除多余空行"""
    if not text:
        return ""
    # 全角转半角
    rtext = []
    for c in text:
        o = ord(c)
        if 0xFF01 <= o <= 0xFF5E:
            o -= 0xFEE0
        elif o == 0x3000:
            o = 0x0020
        rtext.append(chr(o))
    text = "".join(rtext)
    # 去除多余空白
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def extract_question_from_filename(filename):
    """从文件名提取题目"""
    name = filename.replace(".md", "").replace(".pdf", "")
    # 去掉编号前缀
    name = re.sub(r'^\d+[\.、]\s*', '', name)
    name = re.sub(r'^面试题\d+\s*', '', name)
    name = re.sub(r'^\d+\s*', '', name)
    # 去掉常见后缀
    name = re.sub(r'\s*[-–]\s*答案.*$', '', name)
    name = re.sub(r'\s*【答案】.*$', '', name)
    name = re.sub(r'\s*答案.*$', '', name)
    name = re.sub(r'\.pdf$', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s*讲义$', '', name)
    name = re.sub(r'\s*面试$', '', name)
    name = re.sub(r'\s*面试专题$', '', name)
    name = re.sub(r'\s*面试题$', '', name)
    return normalize(name)


def text_similarity(a, b):
    """计算两个文本的相似度"""
    if not a or not b:
        return 0
    return SequenceMatcher(None, a, b).ratio()


def is_duplicate(new_q, existing, threshold=0.85):
    """检查是否与已有题目重复"""
    norm_q = normalize(new_q)
    for eq in existing:
        if text_similarity(norm_q, normalize(eq.get("question", ""))) >= threshold:
            return True
    return False


def classify_by_keyword(text):
    """根据关键词判断分类"""
    text_lower = text.lower()
    for kw, cat in KEYWORD_CATEGORY.items():
        if kw in text_lower:
            return cat
    return None


def parse_answer_text(raw_text):
    """解析PDF中的答案文本"""
    if not raw_text:
        return ""
    text = normalize(raw_text)
    # 去除页眉页脚等干扰（常见模式）
    text = re.sub(r'^\d+/\d+\s*$', '', text, flags=re.MULTILINE)
    return text.strip()


# ============ PDF处理 ============
def extract_pdf_text(pdf_path):
    """提取PDF文本（处理跨页）"""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            pages = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages.append(text)
            return pages
    except Exception as e:
        print(f"  PDF读取失败 {pdf_path.name}: {e}")
        return []


def parse_v1_pdf(pdf_path, category):
    """解析第一版PDF（文件名=题目，内容=答案）"""
    question = extract_question_from_filename(pdf_path.name)
    pages = extract_pdf_text(pdf_path)
    if not pages:
        return None
    answer = parse_answer_text("\n".join(pages))
    if not answer or len(answer) < 5:
        return None
    return {
        "question": question,
        "answer": answer,
        "category": category,
        "source": "v1_pdf"
    }


def parse_comprehensive_pdf(pdf_path):
    """解析综合PDF（题目+答案在同一页）"""
    pages = extract_pdf_text(pdf_path)
    questions = []
    current_q = None
    current_a = []

    for page in pages:
        if not page:
            continue
        # 按行处理
        lines = page.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue

            # 识别题目行：数字+点开头 或 以问号结尾 或 明确题目标记
            is_question = False
            q_match = re.match(r'^(\d+[.、])\s*(.+)', line)
            if q_match and len(line) < 200:
                # 可能是题目
                if current_q and current_a:
                    # 保存上一题
                    answer_text = parse_answer_text("\n".join(current_a))
                    if answer_text:
                        questions.append({
                            "question": normalize(current_q),
                            "answer": answer_text,
                        })
                current_q = q_match.group(2)
                current_a = []
                is_question = True
            elif line.endswith('？') or line.endswith('?'):
                if current_q and current_a:
                    answer_text = parse_answer_text("\n".join(current_a))
                    if answer_text:
                        questions.append({
                            "question": normalize(current_q),
                            "answer": answer_text,
                        })
                current_q = line
                current_a = []
                is_question = True

            if not is_question and current_q:
                current_a.append(line)

    # 保存最后一题
    if current_q and current_a:
        answer_text = parse_answer_text("\n".join(current_a))
        if answer_text:
            questions.append({
                "question": normalize(current_q),
                "answer": answer_text,
            })

    return questions


def parse_mysql_pdf(pdf_path):
    """解析MySQL PDF（格式：数字+题目 + 答案段落）"""
    pages = extract_pdf_text(pdf_path)
    questions = []
    i = 0
    while i < len(pages):
        text = pages[i]
        # 找题目模式: "1.什么是BufferPool？" 或 "1 什么是..."
        matches = re.finditer(r'(\d+)\.?\s*([^\n？?\d]{5,200}?)(\？|\?)', text)
        for m in matches:
            q_num = m.group(1)
            q_text = m.group(2).strip()
            q_full = f"{q_num}.{q_text}"

            # 找答案：从题目位置到下一个题目或下一页
            start = m.end()
            end_pos = None
            # 在当前页找下一个题目
            remaining = text[start:]
            next_match = re.search(r'\n\d+[\.、]\s*[^\n？?]{5,100}?(\？|\?)', remaining)
            if next_match:
                end_pos = start + next_match.start()
            else:
                # 看看后续页
                for j in range(i+1, min(i+3, len(pages))):
                    next_in_page = re.search(r'\n\d+[\.、]\s*[^\n？?]{5,100}?(\？|\?)', pages[j])
                    if next_in_page:
                        answer_text = text[start:] + "\n" + "\n".join(pages[i+1:j]) + "\n" + pages[j][:next_in_page.start()]
                        questions.append({
                            "question": normalize(q_full),
                            "answer": normalize(answer_text),
                            "category": "MySQL"
                        })
                        break
                    # 累积答案
                    if end_pos is None:
                        end_pos = len(text)

            if end_pos:
                answer_text = text[start:end_pos]
                if len(answer_text) > 10:
                    questions.append({
                        "question": normalize(q_full),
                        "answer": normalize(answer_text),
                        "category": "MySQL"
                    })
        i += 1

    return questions


def parse_1685pdf():
    """解析1685页核心讲PDF（多级标题+详细答案格式）"""
    pdf_path = SOURCES["large_pdfs"] / "1685页_Java面试突击核心讲.pdf"
    if not pdf_path.exists():
        return []

    questions = []
    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        print(f"  1685页PDF共 {total} 页，开始提取...")

        current_category = "Java SE"
        current_q = None
        current_a = []
        page_count = 0

        for page_idx, page in enumerate(pdf.pages):
            text = page.extract_text()
            if not text:
                continue
            page_count += 1

            # 检测分类标题
            for kw, cat in KEYWORD_CATEGORY.items():
                if kw in text.lower() and len(text) < 300:
                    detected = detect_category_from_page(text)
                    if detected:
                        current_category = detected

            # 解析题目
            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if not line:
                    continue

                # 检测是否为分类标题行（一级或二级标题）
                if is_category_header(line):
                    detected = detect_category_from_page(line)
                    if detected:
                        current_category = detected
                    continue

                # 识别题目
                q_match = re.match(r'^[\u4e00-\u9fa5a-zA-Z].{5,150}[？?]$', line)
                num_q_match = re.match(r'^\d+[\.、]\s*.{5,150}[？?]$', line)

                if num_q_match or (q_match and len(line) < 200):
                    if current_q and current_a:
                        answer_text = "\n".join(current_a)
                        if len(answer_text) > 5:
                            questions.append({
                                "question": normalize(current_q),
                                "answer": normalize(answer_text),
                                "category": current_category
                            })
                    current_q = line
                    current_a = []
                elif current_q:
                    current_a.append(line)

            if (page_idx + 1) % 200 == 0:
                print(f"    已处理 {page_idx+1}/{total} 页，已提取 {len(questions)} 题...")

        # 保存最后一题
        if current_q and current_a:
            answer_text = "\n".join(current_a)
            if len(answer_text) > 5:
                questions.append({
                    "question": normalize(current_q),
                    "answer": normalize(answer_text),
                    "category": current_category
                })

    print(f"  1685页PDF提取完成：{len(questions)} 题")
    return questions


def is_category_header(line):
    """判断是否为分类标题"""
    patterns = [
        r'^\u7b2c[一二三四五六七八九十\d]+\u7ae0',
        r'^第\d+章',
        r'^(Java基础|Java\s*SE|JVM|并发|多线程|MySQL|Redis|Spring|SpringBoot|MyBatis|分布式|消息队列|设计模式|计算机网络|操作系统|场景题|HR)',
        r'^\u3010.*?\u3011',
    ]
    for p in patterns:
        if re.search(p, line):
            return True
    return False


def detect_category_from_page(text):
    """从页面内容检测分类"""
    text_lower = text.lower()
    priorities = [
        (r'mysql|innodb|buffer\s*pool|索引|事务', 'MySQL'),
        (r'redis|缓存|穿透|雪崩|击穿', 'Redis'),
        (r'spring|ioc|aop|bean', 'Spring'),
        (r'springboot|自动装配', 'SpringBoot'),
        (r'mybatis|#{\$}|sql\s*映射', 'MyBatis'),
        (r'jvm|gc|垃圾回收|类加载', 'JVM'),
        (r'多线程|并发|锁|synchronized|lock|volatile', '并发'),
        (r'分布式|cap|base|微服务', '分布式'),
        (r'kafka|rabbitmq|消息|mq', '消息队列'),
        (r'设计模式|单例|工厂|代理', '设计模式'),
        (r'elasticsearch|es', 'Elasticsearch'),
        (r'场景题|高并发', '场景题'),
        (r'java基础|java\s*se|语法|数据类型', 'Java SE'),
    ]
    for pattern, cat in priorities:
        if re.search(pattern, text_lower):
            return cat
    return None


# ============ MD处理 ============
def parse_hr_md_files():
    """解析HR软技能MD文件"""
    hr_dir = SOURCES["hr"]
    if not hr_dir.exists():
        print(f"  HR目录不存在: {hr_dir}")
        return []

    questions = []
    md_files = list(hr_dir.glob("*.md"))
    print(f"  找到 {len(md_files)} 个HR MD文件")

    for md_file in md_files:
        question = extract_question_from_filename(md_file.name)
        if not question:
            question = md_file.stem

        try:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"  读取失败 {md_file.name}: {e}")
            content = ""

        answer = normalize(content)
        if len(answer) < 3:
            answer = "参考答案请自行准备"

        questions.append({
            "question": question,
            "answer": answer,
            "category": "HR软技能",
            "source": "hr_md"
        })

    print(f"  HR文件处理完成：{len(questions)} 题")
    return questions


# ============ 第一版PDF处理 ============
def process_v1_pdfs():
    """处理第一版PDF文件"""
    v1_dir = SOURCES["v1"]
    if not v1_dir.exists():
        return []

    all_questions = []
    for folder_name in v1_dir.iterdir():
        if not folder_name.is_dir():
            continue
        folder_key = folder_name.name
        category = CATEGORY_MAP.get(folder_key, "Java SE")
        pdf_files = list(folder_name.glob("*.pdf"))
        print(f"  {folder_key}: {len(pdf_files)} PDF文件")

        for pdf_file in pdf_files:
            q = parse_v1_pdf(pdf_file, category)
            if q:
                all_questions.append(q)

    print(f"  第一版PDF处理完成：{len(all_questions)} 题")
    return all_questions


# ============ 第二版PDF处理 ============
def process_v2_pdfs():
    """处理第二版PDF文件"""
    v2_dir = SOURCES["v2"]
    if not v2_dir.exists():
        return []

    all_questions = []
    pdf_files = list(v2_dir.glob("*.pdf"))
    print(f"  第二版找到 {len(pdf_files)} 个PDF文件")

    for pdf_file in pdf_files:
        name = pdf_file.name.lower()
        # 分类
        if 'mysql' in name:
            cat = 'MySQL'
            questions = parse_mysql_pdf(pdf_file)
        elif 'jvm' in name:
            cat = 'JVM'
            questions = parse_comprehensive_pdf(pdf_file)
        elif 'redis' in name:
            cat = 'Redis'
            questions = parse_comprehensive_pdf(pdf_file)
        elif 'springcloud' in name:
            cat = '分布式'
            questions = parse_comprehensive_pdf(pdf_file)
        elif 'spring' in name:
            cat = 'Spring'
            questions = parse_comprehensive_pdf(pdf_file)
        elif 'springboot' in name:
            cat = 'SpringBoot'
            questions = parse_comprehensive_pdf(pdf_file)
        elif '多线程' in name or '并发' in name or '高并发' in name:
            cat = '并发'
            questions = parse_comprehensive_pdf(pdf_file)
        elif '消息' in name or 'mq' in name:
            cat = '消息队列'
            questions = parse_comprehensive_pdf(pdf_file)
        elif '设计模式' in name:
            cat = '设计模式'
            questions = parse_comprehensive_pdf(pdf_file)
        elif 'mybatis' in name:
            cat = 'MyBatis'
            questions = parse_comprehensive_pdf(pdf_file)
        else:
            cat = detect_category_from_page(pdf_file.name)
            cat = cat or 'Java SE'
            questions = parse_comprehensive_pdf(pdf_file)

        for q in questions:
            q['category'] = cat
            q['source'] = 'v2_pdf'

        all_questions.extend(questions)
        print(f"    {pdf_file.name}: {len(questions)} 题")

    print(f"  第二版PDF处理完成：{len(all_questions)} 题")
    return all_questions


# ============ 第三版PDF处理 ============
def process_v3_pdfs():
    """处理第三版PDF文件"""
    v3_dir = SOURCES["v3"]
    if not v3_dir.exists():
        return []

    all_questions = []
    pdf_files = list(v3_dir.glob("*.pdf"))
    print(f"  第三版找到 {len(pdf_files)} 个PDF文件")

    for pdf_file in pdf_files:
        name = pdf_file.name.lower()
        if 'jvm' in name:
            cat = 'JVM'
        elif 'spring' in name:
            cat = 'Spring'
        elif 'mybatis' in name:
            cat = 'MyBatis'
        else:
            cat = detect_category_from_page(pdf_file.name) or 'Java SE'

        questions = parse_comprehensive_pdf(pdf_file)
        for q in questions:
            q['category'] = cat
            q['source'] = 'v3_pdf'

        all_questions.extend(questions)
        print(f"    {pdf_file.name}: {len(questions)} 题")

    print(f"  第三版PDF处理完成：{len(all_questions)} 题")
    return all_questions


# ============ 场景题PDF处理 ============
def process_scene_pdf():
    """处理场景题PDF"""
    scene_pdf = SOURCES["large_pdfs"] / "Java场景题：Java程序员找工作最新面试场景攻略.pdf"
    if not scene_pdf.exists():
        print("  场景题PDF不存在")
        return []

    questions = parse_comprehensive_pdf(scene_pdf)
    for q in questions:
        q['category'] = '场景题'
        q['source'] = 'scene_pdf'

    print(f"  场景题PDF处理完成：{len(questions)} 题")
    return questions


# ============ 1000道PDF处理 ============
def process_1000_pdf():
    """处理1000道PDF（尝试多种方法）"""
    pdf_path = SOURCES["large_pdfs"] / "1000道_互联网Java工程师面试题_485页_PDF.pdf"
    if not pdf_path.exists():
        return []

    print(f"  尝试解析1000道PDF ({pdf_path.name})...")

    # 方法1：pypdf
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(pdf_path))
        print(f"  pypdf成功，共 {len(reader.pages)} 页")
        # 尝试读取文本
        for i, page in enumerate(reader.pages[:3]):
            text = page.extract_text()
            if text:
                print(f"  Page {i+1} preview: {text[:300]}")
    except Exception as e:
        print(f"  pypdf失败: {e}")

    # 方法2：直接用pdfplumber
    try:
        questions = parse_1685pdf_like(str(pdf_path), "Java SE")
        if questions:
            return questions
    except Exception as e:
        print(f"  解析失败: {e}")

    return []


def parse_1685pdf_like(pdf_path, default_cat):
    """类似1685页PDF的解析方式"""
    questions = []
    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        print(f"    PDF共 {total} 页")

        current_cat = default_cat
        current_q = None
        current_a = []

        for page_idx, page in enumerate(pdf.pages):
            text = page.extract_text()
            if not text:
                continue

            # 更新分类
            detected = detect_category_from_page(text)
            if detected:
                current_cat = detected

            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if not line:
                    continue

                if is_category_header(line):
                    d = detect_category_from_page(line)
                    if d:
                        current_cat = d
                    continue

                # 题目识别
                q_match = re.match(r'^[\u4e00-\u9fa5a-zA-Z].{5,150}[？?]$', line)
                num_q_match = re.match(r'^\d+[\.、]\s*.{5,150}[？?]$', line)

                if num_q_match or q_match:
                    if current_q and current_a:
                        ans = normalize("\n".join(current_a))
                        if len(ans) > 5:
                            questions.append({
                                "question": normalize(current_q),
                                "answer": ans,
                                "category": current_cat,
                                "source": "1000_pdf"
                            })
                    current_q = line
                    current_a = []
                elif current_q:
                    current_a.append(line)

            if (page_idx + 1) % 100 == 0:
                print(f"    已处理 {page_idx+1}/{total} 页，{len(questions)} 题...")

        # 最后一题
        if current_q and current_a:
            ans = normalize("\n".join(current_a))
            if len(ans) > 5:
                questions.append({
                    "question": normalize(current_q),
                    "answer": ans,
                    "category": current_cat,
                    "source": "1000_pdf"
                })

    print(f"  1000道PDF提取完成：{len(questions)} 题")
    return questions


# ============ 合并与去重 ============
def merge_and_deduplicate(existing, new_questions):
    """合并并去重"""
    existing_norm = [normalize(q.get('question', '')) for q in existing]
    existing_answers = {normalize(q.get('question', '')): q.get('answer', '') for q in existing}

    added = []
    updated = 0

    for nq in new_questions:
        if not nq.get('question'):
            continue

        norm_q = normalize(nq['question'])

        # 精确去重
        if norm_q in existing_norm:
            # 检查是否需要修正答案
            old_ans = existing_answers.get(norm_q, '')
            new_ans = nq.get('answer', '')
            if len(new_ans) > len(old_ans) * 1.5 and len(new_ans) > 50:
                # 新答案更详细，替换
                for eq in added:
                    if normalize(eq['question']) == norm_q:
                        eq['answer'] = new_ans
                        updated += 1
                        break
            continue

        # 模糊去重
        if is_duplicate(norm_q, [q['question'] for q in added], 0.85):
            continue

        added.append(nq)

    return added, updated


def assign_ids(existing, new_questions, prefix="new"):
    """为新题目分配ID"""
    existing_ids = set(q.get('id', '') for q in existing)
    counter = 1
    for q in new_questions:
        while True:
            new_id = f"{prefix}-{counter:04d}"
            if new_id not in existing_ids:
                q['id'] = new_id
                existing_ids.add(new_id)
                counter += 1
                break
            counter += 1
    return new_questions


# ============ 主流程 ============
def main():
    print("=" * 60)
    print("Java面试题库扩充脚本")
    print("=" * 60)

    # 读取现有题库
    print("\n[1] 读取现有题库...")
    with open(QUESTIONS_FILE, 'r', encoding='utf-8') as f:
        existing = json.load(f)
    print(f"  现有题库：{len(existing)} 题")

    # 统计现有分类
    cats = {}
    for q in existing:
        c = q.get('category', 'unknown')
        cats[c] = cats.get(c, 0) + 1
    for c, n in sorted(cats.items(), key=lambda x: -x[1]):
        print(f"    {c}: {n}")

    all_new = []

    # 处理各来源
    print("\n[2] 处理HR软技能MD文件...")
    hr_qs = parse_hr_md_files()
    all_new.extend(hr_qs)

    print("\n[3] 处理第一版PDF...")
    v1_qs = process_v1_pdfs()
    all_new.extend(v1_qs)

    print("\n[4] 处理第二版PDF...")
    v2_qs = process_v2_pdfs()
    all_new.extend(v2_qs)

    print("\n[5] 处理第三版PDF...")
    v3_qs = process_v3_pdfs()
    all_new.extend(v3_qs)

    print("\n[6] 处理场景题PDF...")
    scene_qs = process_scene_pdf()
    all_new.extend(scene_qs)

    print("\n[7] 处理1000道PDF...")
    try:
        pdf_path = SOURCES["large_pdfs"] / "1000道_互联网Java工程师面试题_485页_PDF.pdf"
        if pdf_path.exists():
            qs = parse_1685pdf_like(str(pdf_path), "Java SE")
            all_new.extend(qs)
            print(f"  1000道PDF：{len(qs)} 题")
        else:
            print("  1000道PDF文件不存在")
    except Exception as e:
        print(f"  1000道PDF处理失败: {e}")

    print("\n[8] 处理1685页PDF...")
    try:
        qs = parse_1685pdf()
        all_new.extend(qs)
    except Exception as e:
        print(f"  1685页PDF处理失败: {e}")

    print(f"\n  提取题目总数（去重前）: {len(all_new)}")

    # 去重
    print("\n[9] 去重合并...")
    added, updated = merge_and_deduplicate(existing, all_new)
    print(f"  净新增: {len(added)} 题")
    print(f"  答案修正: {updated} 题")

    # 分配ID
    assign_ids(existing, added)

    # 合并
    merged = existing + added

    # 统计
    print("\n[10] 最终统计...")
    new_cats = {}
    for q in merged:
        c = q.get('category', 'unknown')
        new_cats[c] = new_cats.get(c, 0) + 1
    print(f"  合并后总题数: {len(merged)}")
    print("  各分类题数:")
    for c, n in sorted(new_cats.items(), key=lambda x: -x[1]):
        old_n = cats.get(c, 0)
        diff = n - old_n
        diff_str = f"+{diff}" if diff > 0 else str(diff)
        print(f"    {c}: {n} ({diff_str})")

    # 保存
    print("\n[11] 保存题库...")
    backup = QUESTIONS_FILE.with_suffix('.json.bak')
    with open(backup, 'w', encoding='utf-8') as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)
    print(f"  备份已保存: {backup}")

    with open(QUESTIONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
    print(f"  题库已更新: {QUESTIONS_FILE}")

    print("\n" + "=" * 60)
    print("完成!")
    print(f"  原题库: {len(existing)} 题")
    print(f"  净新增: {len(added)} 题")
    print(f"  答案修正: {updated} 题")
    print(f"  最终总数: {len(merged)} 题")
    print("=" * 60)


if __name__ == "__main__":
    main()