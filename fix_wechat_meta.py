#!/usr/bin/env python3
"""Batch fix WeChat sharing meta tags on all HTML pages.
Key changes per the verified WeChat sharing implementation:
- Add og:image:secure_url (critical for WeChat)
- Add og:image:type (WeChat needs MIME type hint)
- Fix og:image:width/height to match actual 300x300 image
- Use 300x300 optimized image (10KB, WeChat prefers small files)
- Add cache-busting ?v= parameter to image URLs
"""

import os
import re
import glob

ROOT = r'C:\Users\trust\WorkBuddy\2026-06-25-19-29-57\src\frontend'
IMG_URL_BASE = 'https://shenjiaben-research-institute.onrender.com/assets/images/wechat-share-300.jpg'
IMG_URL_CACHE = IMG_URL_BASE + '?v=20260627'

NEW_META_BLOCK = f'''  <!-- 微信/社交分享优化 -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="湖州市沈家本研究院 — 传承法治文化 · 弘扬法学精神">
  <meta property="og:description" content="立足家本故里，集学术研究、法律数据聚合、文化传播于一体的综合性法律研究机构。传承法治文化，弘扬法学精神。">
  <meta property="og:image" content="{IMG_URL_CACHE}">
  <meta property="og:image:secure_url" content="{IMG_URL_CACHE}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="300">
  <meta property="og:image:height" content="300">
  <meta property="og:url" content="https://shenjiaben-research-institute.onrender.com/">
  <meta property="og:site_name" content="湖州市沈家本研究院">
  <meta property="og:locale" content="zh_CN">
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="湖州市沈家本研究院 — 传承法治文化 · 弘扬法学精神">
  <meta name="twitter:description" content="立足家本故里，集学术研究、法律数据聚合、文化传播于一体的综合性法律研究机构。传承法治文化，弘扬法学精神。">
  <meta name="twitter:image" content="{IMG_URL_CACHE}">
  <!-- Schema.org 结构化数据 -->
  <meta itemprop="name" content="湖州市沈家本研究院 — 传承法治文化 · 弘扬法学精神">
  <meta itemprop="description" content="立足家本故里，集学术研究、法律数据聚合、文化传播于一体的综合性法律研究机构。传承法治文化，弘扬法学精神。">
  <meta itemprop="image" content="{IMG_URL_CACHE}">
  <!-- 微信 wx: 首选标签 -->
  <meta property="wx:image" content="{IMG_URL_CACHE}">
  <meta property="wx:title" content="湖州市沈家本研究院 — 传承法治文化 · 弘扬法学精神">
  <meta property="wx:description" content="立足家本故里，集学术研究、法律数据聚合、文化传播于一体的综合性法律研究机构。传承法治文化，弘扬法学精神。">
  <meta property="wx:url" content="https://shenjiaben-research-institute.onrender.com/">
  <!-- 微信 wechat: 兼容标签 -->
  <meta name="wechat:image" content="{IMG_URL_CACHE}">
  <meta name="wechat:title" content="湖州市沈家本研究院 — 传承法治文化 · 弘扬法学精神">
  <meta name="wechat:description" content="立足家本故里，集学术研究、法律数据聚合、文化传播于一体的综合性法律研究机构。传承法治文化，弘扬法学精神。">'''

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the entire meta block from "<!-- 微信/社交分享优化 -->" to "</head>" CSS link
    # Pattern: everything between the WeChat comment and the first <link rel="stylesheet"
    pattern = r'<!-- 微信/社交分享优化 -->.*?(?=<link rel="stylesheet")'
    if not re.search(pattern, content, re.DOTALL):
        print(f'  SKIP {os.path.basename(filepath)} — no wechat meta block found')
        return False
    
    new_content = re.sub(pattern, NEW_META_BLOCK + '\n  ', content, flags=re.DOTALL)
    
    if new_content == content:
        print(f'  UNCHANGED {os.path.basename(filepath)}')
        return False
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f'  FIXED {os.path.basename(filepath)}')
    return True

def main():
    html_files = glob.glob(os.path.join(ROOT, '*.html'))
    print(f'Found {len(html_files)} HTML files in {ROOT}\n')
    
    fixed = 0
    for f in sorted(html_files):
        if fix_file(f):
            fixed += 1
    
    print(f'\nTotal: {fixed} files fixed.')

if __name__ == '__main__':
    main()
