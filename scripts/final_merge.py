"""
最终合并脚本：将所有中间文件合并到questions.json
"""

import json
import re
from difflib import SequenceMatcher

BASE = "D:/claudeChat/java-quiz-app/data"
FILES = {
    "hr": f"{BASE}/hr_questions.json",
    "v1": f"{BASE}/v1_questions.json",
    "large": f"{BASE}/large_questions.json",
    "v2": "D:/claudeChat/b站面试题_提取结果.json",
}
EXISTING = f"{BASE}/questions.json"

def normalize(text):
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
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def similarity(a, b):
    if not a or not b:
        return 0
    return SequenceMatcher(None, a, b).ratio()

def load_questions(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        print(f"  读取失败 {path}: {e}")
        return []

def main():
    print("=" * 60)
    print("题库最终合并")
    print("=" * 60)

    # 读取原题库
    print("\n[1] 读取原题库...")
    existing = load_questions(EXISTING)
    print(f"  原题库: {len(existing)} 题")
    existing_norm = {normalize(q['question']): i for i, q in enumerate(existing)}

    # 读取所有来源
    all_sources = {}
    for name, path in FILES.items():
        qs = load_questions(path)
        if qs:
            all_sources[name] = qs
            print(f"  {name}: {len(qs)} 题")
        else:
            print(f"  {name}: 0 题（文件不存在或为空）")

    # 合并
    print("\n[2] 合并去重...")
    added_map = {}  # normalize(question) -> question dict

    for source_name, questions in all_sources.items():
        for q in questions:
            q_norm = normalize(q.get('question', ''))
            if not q_norm or len(q_norm) < 5:
                continue

            # 精确去重
            if q_norm in existing_norm:
                continue

            # 与已添加的去重
            if q_norm in added_map:
                # 保留更长的答案
                if len(q.get('answer', '')) > len(added_map[q_norm].get('answer', '')):
                    added_map[q_norm] = q
            else:
                # 模糊去重
                is_dup = False
                for en in added_map:
                    if similarity(q_norm, en) >= 0.85:
                        is_dup = True
                        break
                if not is_dup:
                    added_map[q_norm] = q

    added = list(added_map.values())
    print(f"  净新增: {len(added)} 题")

    # 分配ID
    print("\n[3] 分配ID...")
    existing_ids = set(q.get('id', '') for q in existing)
    existing_ids.update(q.get('id', '') for q in added)
    counter = 1
    for q in added:
        while True:
            new_id = f"new-{counter:04d}"
            if new_id not in existing_ids:
                q['id'] = new_id
                existing_ids.add(new_id)
                counter += 1
                break
            counter += 1

    # 合并
    merged = existing + added

    # 统计
    print("\n[4] 最终统计...")
    cats = {}
    for q in merged:
        c = q.get('category', 'unknown')
        cats[c] = cats.get(c, 0) + 1

    old_cats = {}
    for q in existing:
        c = q.get('category', 'unknown')
        old_cats[c] = old_cats.get(c, 0) + 1

    print(f"  最终总数: {len(merged)} 题（原有{len(existing)} + 净增{len(added)}）")
    print("  分类对比:")
    for c, n in sorted(cats.items(), key=lambda x: -x[1]):
        old_n = old_cats.get(c, 0)
        diff = n - old_n
        diff_str = f"+{diff}" if diff > 0 else str(diff)
        print(f"    {c}: {n} (原{old_n}, {diff_str})")

    # 保存
    print("\n[5] 保存...")
    with open(EXISTING + '.bak2', 'w', encoding='utf-8') as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)
    print("  备份完成")

    with open(EXISTING, 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
    print(f"  保存完成: {EXISTING}")

    print("\n" + "=" * 60)
    print(f"完成! 最终题库: {len(merged)} 题")
    print("=" * 60)

if __name__ == "__main__":
    main()