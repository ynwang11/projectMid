#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
app.py  完整整合版
1. 接收上传 CSV
2. 用模型预测 0-7
3. 根据数字读对应 txt 随机返回一句
4. 前端原样展示
"""
from flask import Flask, request, Response, send_from_directory
from flask_cors import CORS
import pandas as pd
import joblib
import random
from pathlib import Path
import socket
import threading
import time
import webbrowser
import os
import signal

# ---------- 配置 ----------
MODEL_PATH = "./mini-csv/emotion_rf_model.pkl"          # 模型
TXT_DIR = Path("./mini-csv/txts")            # txt 文件夹
FILE_MAP = {                                 # 数字 -> 文件
    1: TXT_DIR / "mid.txt",
    2: TXT_DIR / "positive.txt",
    3: TXT_DIR / "negative.txt",
    4: TXT_DIR / "thinking.txt"
}

# ---------- 预加载模型 ----------
model = joblib.load(MODEL_PATH)

# ---------- 工具：读文件并随机选句 ----------
_cache = {}
def random_sentence(code: int) -> str:
    """返回 code 对应文案，若未定义/文件空则返回友好提示。"""
    if code not in FILE_MAP:
        return f"状态 {code} 暂无文案（未定义）"
    path = FILE_MAP[code]
    if code not in _cache:
        if not path.exists():
            _cache[code] = []
        else:
            _cache[code] = [ln.rstrip("\n") for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip()]
    lines = _cache[code]
    return random.choice(lines) if lines else f"状态 {code} 文案为空"

# ---------- Flask ----------
app = Flask(__name__)
CORS(app)

# 静态文件
@app.route("/<path:filename>")
def static_file(filename):
    return send_from_directory(".", filename)

@app.route("/")
def index():
    return send_from_directory(".", "index.html")

# 上传 + 预测 + 选句
@app.route("/upload", methods=["POST"])
def upload():
    file = request.files.get("file")
    if not file:
        return Response("未上传文件", status=400, mimetype="text/plain")

    df   = pd.read_csv(file.stream)
    X    = df.drop(columns=["label"], errors="ignore")
    preds = model.predict(X)                # ndarray<int>

    # 每行预测值 -> 句子
    sentences = [random_sentence(int(p)) for p in preds]
    return Response("\n".join(sentences), mimetype="text/plain")

# ---------- 心跳 & 自杀 ----------
LAST_BEAT = time.time()

@app.route("/ping", methods=["POST"])
def ping():
    global LAST_BEAT
    LAST_BEAT = time.time()
    return "", 204

def watcher():
    while True:
        time.sleep(1)
        if time.time() - LAST_BEAT > 5:
            print("浏览器已关闭，服务自动退出")
            os.kill(os.getpid(), signal.SIGTERM)

threading.Thread(target=watcher, daemon=True).start()

# ---------- 启动 ----------
if __name__ == "__main__":
    with socket.socket() as s:
        s.bind(("", 0))
        port = s.getsockname()[1]
    threading.Thread(target=lambda: app.run(port=port, debug=False), daemon=True).start()
    time.sleep(0.5)
    webbrowser.open(f"http://localhost:{port}")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n服务已停止")
