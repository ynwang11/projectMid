from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import os
import json
from datetime import datetime, timedelta, date

app = Flask(__name__)
app.secret_key = 'your_secret_key_here' # 必须设置密钥以启用 session

# 简易数据暂存：写入 instance/data 下，避免用户手动重复输入
DATA_DIR = os.path.join(app.instance_path, "data")
os.makedirs(DATA_DIR, exist_ok=True)


def _safe_user_id(u: str) -> str:
    u = (u or "guest").strip()
    return "".join(ch for ch in u if ch.isalnum() or ch in ("-", "_"))[:64] or "guest"


def _vitals_path(user: str) -> str:
    return os.path.join(DATA_DIR, f"vitals_{_safe_user_id(user)}.jsonl")

def _config_path(user: str) -> str:
    return os.path.join(DATA_DIR, f"config_{_safe_user_id(user)}.json")

def _load_user_config(user: str) -> dict:
    path = _config_path(user)
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f) or {}
    except Exception:
        return {}

def _save_user_config(user: str, cfg: dict) -> None:
    path = _config_path(user)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(cfg or {}, f, ensure_ascii=False, indent=2)


def _is_local_ollama_base(base_url: str) -> bool:
    """Ollama 默认监听 :11434，提供 OpenAI 兼容的 /v1/chat/completions，本地可不带 API Key。"""
    u = (base_url or "").strip().lower()
    if ":11434" in u:
        return True
    try:
        from urllib.parse import urlparse

        p = urlparse(base_url.strip())
        return p.port == 11434
    except Exception:
        return False


def _openai_compatible_chat(
    base_url: str, model: str, messages: list, api_key: str | None, timeout: int
) -> str:
    import urllib.request

    url = f"{base_url.rstrip('/')}/v1/chat/completions"
    body = {"model": model, "messages": messages, "temperature": 0.7}
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8")
    data = json.loads(raw)
    reply = (
        data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    )
    if not reply:
        raise RuntimeError("empty_reply")
    return reply


def _append_jsonl(path: str, obj: dict) -> None:
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")


def _load_jsonl(path: str, since: datetime | None = None, limit: int = 20000) -> list[dict]:
    if not os.path.exists(path):
        return []
    out: list[dict] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except Exception:
                continue
            ts = obj.get("ts")
            if since and ts:
                try:
                    dt = datetime.fromisoformat(ts)
                except Exception:
                    dt = None
                if dt and dt < since:
                    continue
            out.append(obj)
            if len(out) >= limit:
                break
    return out


def _score_from_vitals(d: dict) -> int:
    """把演示 vitals 转成 0-100 的身心指数（用于长期趋势）。"""
    try:
        stress = float(d.get("stress", 0.5))
    except Exception:
        stress = 0.5
    base = 92 - int(round(stress * 40))
    # 小幅引入 HR/HRV/呼吸稳定性，避免完全随机
    try:
        hr = float(d.get("hr", 80))
        hrv = float(d.get("hrv", 45))
    except Exception:
        hr, hrv = 80.0, 45.0
    if hr < 58 or hr > 108:
        base -= 6
    if hrv >= 60:
        base += 3
    if not d.get("resp_stable", True):
        base -= 4
    return int(max(35, min(98, base)))

# 模拟用户数据库
USER_DATA = {"admin": "123456"}

# 路由：登录页面
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if username in USER_DATA and USER_DATA[username] == password:
            session['user'] = username # 记录登录状态
            return redirect(url_for('dashboard'))
        return "登录失败，用户名或密码错误"
    return render_template('login.html')

# 路由：退出登录
@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('index'))


TOOLS_CONFIG = {
    'tool_a': {
        'title': '生理数据实时监测中心',
        'desc': '云中海岛与耳狐精灵相伴，实时心率、呼吸、皮电、HRV、体温一目了然；底部可上传文件进行原分析。',
    },
    'tool_b': {
        'title': 'AI心理多维分析中心',
        'desc': '夜晚星光图书馆中，与白鼬学者共读心理图谱；下方可连接实时监测流。',
    },
    'tool_history': {
        'title': '长期身心报告档案馆',
        'desc': '在四季花海记忆花园中翻阅水晶档案、情绪日历与长期趋势。',
    },
    'tool_c': {
        'title': '系统参数设置',
        'desc': '在这里配置您的 API 密钥、数据库连接及其他全局变量。'
    }
}

# ---------------------------------------------------------
# 路由 1：启动页 - 沉浸式云端森林场景
# ---------------------------------------------------------
@app.route('/')
def launch():
    return render_template('launch.html')

# ---------------------------------------------------------
# 路由 2：原始首页（保留为备用）
# ---------------------------------------------------------
@app.route('/home')
def index():
    return render_template('index.html')


@app.route('/healing')
def healing():
    if not session.get('user'):
        return redirect(url_for('login'))
    return render_template('healing.html')


@app.route('/profile')
def profile_archive():
    """个人身心档案 & 隐私中心（精灵小屋场景）。"""
    if not session.get('user'):
        return redirect(url_for('login'))
    return render_template('profile_cabin.html', user=session.get('user'))


@app.route('/subscription')
def subscription():
    if not session.get('user'):
        return redirect(url_for('login'))
    return render_template('subscription.html', subscribed=bool(session.get('subscribed')))


@app.route('/settings/ai', methods=['GET', 'POST'])
def ai_settings():
    if not session.get('user'):
        return redirect(url_for('login'))
    user = session.get('user')
    cfg = _load_user_config(user)
    if request.method == 'POST':
        api_key = (request.form.get('api_key') or '').strip()
        base_url = (request.form.get('base_url') or '').strip() or 'http://127.0.0.1:11434'
        model = (request.form.get('model') or '').strip() or 'qwen2.5:1.5b'
        # 仅示意：生产环境请使用安全的密钥管理与服务端会话存储
        cfg.update({"openai_api_key": api_key, "openai_base_url": base_url, "openai_model": model})
        _save_user_config(user, cfg)
        return redirect(url_for('ai_settings'))
    return render_template('ai_settings.html', cfg=cfg)


@app.route('/subscribe', methods=['POST'])
def subscribe():
    if not session.get('user'):
        return redirect(url_for('login'))
    action = request.form.get('action', 'start')
    if action == 'cancel':
        session['subscribed'] = False
    else:
        session['subscribed'] = True
    return redirect(url_for('subscription'))


@app.route('/api/subscription-status')
def subscription_status():
    if not session.get('user'):
        return jsonify({"subscribed": False}), 401
    return jsonify({"subscribed": bool(session.get('subscribed'))})


@app.route('/api/healing-vitals')
def healing_vitals():
    """模拟生理状态：异常时前端切换极柔和安抚场景（无警报）。"""
    import random
    force = request.args.get('force')
    if force == 'calm':
        return jsonify({'abnormal': True, 'soft': True})
    if force == 'ok':
        return jsonify({'abnormal': False, 'soft': True})
    return jsonify({'abnormal': random.random() < 0.06, 'soft': True})


# ---------------------------------------------------------
# 路由 2：网页端主界面（处理工具切换和结果展示）
# ---------------------------------------------------------
@app.route('/dashboard/<tool_name>')
@app.route('/dashboard', defaults={'tool_name': 'tool_a'})
def dashboard(tool_name):
    # 1. 安全检查：使用 .get()，如果没登录会返回 None，不会报错
    user = session.get('user')
    
    # 2. 如果没登录，重定向到登录页
    if not user:
        return redirect(url_for('login'))
    
    # 3. 正常逻辑
    current_tool = TOOLS_CONFIG.get(tool_name, TOOLS_CONFIG['tool_a'])
    analysis_result = request.args.get('result', '')
    
    # 4. 确保将 user 变量传给模板
    return render_template(
        'dashboard.html', 
        user=user,  # 这里用上面获取到的 user 变量
        tool=current_tool, 
        active_tool=tool_name, 
        analysis_result=analysis_result
    )
# ---------------------------------------------------------
# 路由 3：分析逻辑（处理文件上传）
# ---------------------------------------------------------
@app.route('/analyze', methods=['POST'])
def analyze():
    # 检查是否有文件上传
    if 'file' not in request.files:
        return redirect(url_for('dashboard', tool_name='tool_a', result="错误：未找到文件字段"))
    
    file = request.files['file']
    
    if file.filename == '':
        return redirect(url_for('dashboard', tool_name='tool_a', result="错误：未选择任何文件"))

    if file:
        # --- 在这里编写你的 Python 分析逻辑 ---
        # 示例：我们读取文件名并模拟一个分析报告
        filename = file.filename
        
        # 模拟分析过程...
        import datetime
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        mock_report = (
            f"--- 分析报告 ---\n"
            f"处理时间: {timestamp}\n"
            f"上传文件: {filename}\n"
            f"状态: 分析成功\n"
            f"结果摘要: 检测到数据一致性良好，模型预测准确率为 98.5%。"
        )
        
        # 分析完成后，带着结果重定向回工具 A 页面
        return redirect(url_for('dashboard', tool_name='tool_a', result=mock_report))

    return redirect(url_for('dashboard', tool_name='tool_a'))

import time
from flask import Response



# 新增：模拟从另一个程序获取数据的生成器
def generate_realtime_data():
    # 这里以后可以对接你另一个程序的 Socket 或 API
    count = 0
    while True:
        time.sleep(1)  # 模拟每秒产生一条数据
        count += 1
        data = f"时间: {time.strftime('%H:%M:%S')} | 检测值: {count * 1.5} | 状态: 正常\n"
        # SSE 格式要求必须以 'data: ' 开头，以 '\n\n' 结尾
        yield f"data: {data}\n\n"

# 新增：数据流路由
@app.route('/stream')
def stream():
    return Response(generate_realtime_data(), mimetype='text/event-stream')


@app.route("/api/vitals-live")
def vitals_live():
    """模拟实时生理与情绪数据，驱动耳狐状态与魔法球配色。"""
    import random
    import time

    random.seed(int(time.time() * 10) % 100000)

    def walk_series(n, start, spread):
        out = []
        v = float(start)
        for _ in range(n):
            v += random.uniform(-spread, spread)
            out.append(round(v, 2))
        return out

    hr = int(round(random.uniform(62, 96)))
    resp = round(random.uniform(11, 22), 1)
    eda = round(random.uniform(0.1, 1.8), 2)
    hrv = int(round(random.uniform(28, 68)))
    temp = round(random.uniform(36.0, 37.4), 1)

    stress = random.uniform(0.12, 0.88)
    hr_stable = random.random() > 0.42
    resp_stable = random.random() > 0.38

    if stress < 0.38:
        emotion = "calm"
    elif stress < 0.58:
        emotion = "relaxed"
    else:
        emotion = "anxious"

    abnormal = stress > 0.74 or hr < 56 or hr > 108 or (not resp_stable and stress > 0.62)

    return jsonify(
        {
            "hr": hr,
            "resp": resp,
            "eda": eda,
            "hrv": hrv,
            "temp": temp,
            "stress": round(stress, 3),
            "hr_stable": hr_stable,
            "resp_stable": resp_stable,
            "emotion": emotion,
            "abnormal": abnormal,
            "series": {
                "hr": walk_series(32, hr, 1.8),
                "resp": walk_series(32, resp, 0.35),
                "eda": walk_series(32, eda, 0.08),
                "hrv": walk_series(32, hrv, 2.0),
                "temp": walk_series(32, temp, 0.04),
            },
        }
    )


@app.route("/api/vitals-store", methods=["POST"])
def vitals_store():
    """前端周期性上报 vitals，用于长期报告馆汇总（不要求用户手输）。"""
    user = session.get("user")
    if not user:
        return jsonify({"ok": False, "error": "not_logged_in"}), 401

    payload = request.get_json(silent=True) or {}
    # 只保存关键信息，避免体积膨胀
    slim = {
        "ts": datetime.utcnow().isoformat(timespec="seconds"),
        "hr": payload.get("hr"),
        "resp": payload.get("resp"),
        "eda": payload.get("eda"),
        "hrv": payload.get("hrv"),
        "temp": payload.get("temp"),
        "stress": payload.get("stress"),
        "emotion": payload.get("emotion"),
        "abnormal": payload.get("abnormal"),
        "hr_stable": payload.get("hr_stable"),
        "resp_stable": payload.get("resp_stable"),
    }
    slim["score"] = _score_from_vitals(slim)
    _append_jsonl(_vitals_path(user), slim)
    return jsonify({"ok": True})


@app.route('/api/history-data')
def get_history_data():
    """长期报告馆数据：从暂存 vitals 聚合生成 1周/1月/3月/1年 维度趋势。"""
    import calendar as calmod

    user = session.get("user")
    if not user:
        return jsonify({"error": "not_logged_in"}), 401
    subscribed = bool(session.get("subscribed"))

    rng = request.args.get("range", "week")
    if not subscribed and rng in ("month", "quarter", "year", "3m", "3month", "months"):
        return jsonify({"error": "subscription_required", "allowed": ["week"]}), 402
    now = datetime.utcnow()
    if rng == "year":
        since = now - timedelta(days=365)
        labels = [f"{i + 1}月" for i in range(12)]
    elif rng in ("quarter", "3m", "3month", "months"):
        since = now - timedelta(days=90)
        labels = [f"第{i + 1}周" for i in range(13)]
        rng = "quarter"
    elif rng == "month":
        since = now - timedelta(days=30)
        labels = [f"第{i + 1}周" for i in range(5)]
    else:
        since = now - timedelta(days=7)
        labels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
        rng = "week"

    records = _load_jsonl(_vitals_path(user), since=since)
    # 用 score 做聚合
    values = []
    if rng == "week":
        by_wd: dict[int, list[int]] = {i: [] for i in range(7)}
        for r in records:
            ts = r.get("ts")
            if not ts:
                continue
            try:
                dt = datetime.fromisoformat(ts)
            except Exception:
                continue
            by_wd[dt.weekday()].append(int(r.get("score", 0) or 0))
        for i in range(7):
            xs = by_wd.get(i) or []
            values.append(int(round(sum(xs) / len(xs))) if xs else 0)
    elif rng in ("month", "quarter"):
        # 以周为桶
        weeks = 5 if rng == "month" else 13
        buckets: list[list[int]] = [[] for _ in range(weeks)]
        for r in records:
            ts = r.get("ts")
            if not ts:
                continue
            try:
                dt = datetime.fromisoformat(ts)
            except Exception:
                continue
            idx = int((dt - since).days // 7)
            if 0 <= idx < weeks:
                buckets[idx].append(int(r.get("score", 0) or 0))
        values = [int(round(sum(b) / len(b))) if b else 0 for b in buckets]
    else:
        # year：按月桶
        buckets: dict[int, list[int]] = {i: [] for i in range(1, 13)}
        for r in records:
            ts = r.get("ts")
            if not ts:
                continue
            try:
                dt = datetime.fromisoformat(ts)
            except Exception:
                continue
            buckets[dt.month].append(int(r.get("score", 0) or 0))
        values = [int(round(sum(buckets[i + 1]) / len(buckets[i + 1]))) if buckets[i + 1] else 0 for i in range(12)]

    # 若暂无记录，用稳定的“柔和”默认值，避免空图造成割裂
    if not records or all(v == 0 for v in values):
        seed = hash((rng, user)) % 10
        base = 78 + (seed - 5)
        values = [max(55, min(92, base + (i % 3 - 1) * 3)) for i in range(len(labels))]

    today = date.today()
    y, m = today.year, today.month
    _, days_in_month = calmod.monthrange(y, m)

    # 日历：优先用本月记录生成，没有的天用空白默认
    day_scores: dict[int, list[int]] = {d: [] for d in range(1, days_in_month + 1)}
    month_since = datetime(today.year, today.month, 1)
    month_records = _load_jsonl(_vitals_path(user), since=month_since)
    for r in month_records:
        ts = r.get("ts")
        if not ts:
            continue
        try:
            dt = datetime.fromisoformat(ts)
        except Exception:
            continue
        if dt.year == y and dt.month == m:
            day_scores.get(dt.day, []).append(int(r.get("score", 0) or 0))

    calendar_days = []
    for d in range(1, days_in_month + 1):
        xs = day_scores.get(d) or []
        score = int(round(sum(xs) / len(xs))) if xs else 0
        if score == 0:
            # 0 表示暂无记录：用“休整”色淡化显示
            mood = "rest"
            score = 60
        elif score >= 86:
            mood = "great"
        elif score >= 76:
            mood = "good"
        elif score >= 68:
            mood = "calm"
        elif score >= 58:
            mood = "low"
        else:
            mood = "rest"
        calendar_days.append({"day": d, "score": score, "mood": mood})

    if 3 <= m <= 5:
        season = "spring"
    elif 6 <= m <= 8:
        season = "summer"
    elif 9 <= m <= 11:
        season = "autumn"
    else:
        season = "winter"

    avg = int(round(sum(values) / max(len(values), 1)))
    range_label = {"week": "近一周", "month": "近一月", "quarter": "近三月", "year": "近一年"}.get(rng, "近一周")
    ai_summary = (
        f"{range_label}身心指数均值约 {avg}。这里的数据来自你在「生理实时监测」与疗愈互动中的暂存记录，"
        "无需手动重复输入。若你希望更完整的长期报告，可持续使用监测与情绪记录功能。"
    )

    # 水晶档案：根据选择的时间维度，突出当前区间
    reports = [
        {
            "id": f"{rng}-summary",
            "type": "week" if rng == "week" else "month" if rng == "month" else "year" if rng == "year" else "month",
            "title": f"{range_label} · 趋势报告",
            "summary": f"本段均值 {avg}，趋势已汇总到下方曲线。",
            "detail": "【趋势报告】\n"
            f"· 统计区间：{range_label}\n"
            f"· 记录条数：{len(records)}\n"
            "· 建议：在压力波峰前加入 3 分钟呼吸锚定或短步行，让身心恢复更可持续。",
        }
    ]

    return jsonify(
        {
            "range": rng,
            "labels": labels,
            "values": values,
            "season": season,
            "year": y,
            "month": m,
            "month_label": f"{m} 月",
            "calendar": calendar_days,
            "reports": reports,
            "ai_summary": ai_summary,
        }
    )


@app.route("/api/ai-chat", methods=["POST"])
def ai_chat():
    """简易 AI 接入占位：后续可替换为真实模型调用。"""
    user = session.get("user")
    if not user:
        return jsonify({"error": "not_logged_in"}), 401
    subscribed = bool(session.get("subscribed"))
    if not subscribed:
        return jsonify({"error": "subscription_required"}), 402

    payload = request.get_json(silent=True) or {}
    text = (payload.get("text") or "").strip()
    if not text:
        return jsonify({"reply": "我在这里。你可以先说一句：你现在最难受的点是什么？"})

    cfg = _load_user_config(user)
    api_key = (cfg.get("openai_api_key") or "").strip()
    base_url = (cfg.get("openai_base_url") or "http://127.0.0.1:11434").strip().rstrip("/")
    model = (cfg.get("openai_model") or "qwen2.5:1.5b").strip()

    use_ollama_local = (not api_key) and _is_local_ollama_base(base_url)
    # 云端 OpenAI 兼容：必须有 Key；本地 Ollama：可无 Key
    if not api_key and not use_ollama_local:
        reply = (
            "我听见了。我们先把强度降下来：现在请做一次 4 秒吸气—2 秒停—6 秒呼气。\n"
            "然后告诉我：这份难受更像是「紧张/焦虑」、还是「委屈/难过」、还是「愤怒/不公平」？"
        )
        return jsonify({"reply": reply, "mode": "fallback"})

    messages = [
        {
            "role": "system",
            "content": "你是温柔、专业的心理陪伴助手。避免诊断；先共情，再给一个可执行的小步骤。",
        },
        {"role": "user", "content": text},
    ]
    timeout = 120 if use_ollama_local else 60

    try:
        reply = _openai_compatible_chat(base_url, model, messages, api_key or None, timeout)
        return jsonify({"reply": reply, "mode": "ollama" if use_ollama_local else "openai"})
    except Exception:
        reply = (
            "我在这里。先别急着解决所有问题，我们只做一件小事：把肩膀放松，慢慢把呼气拉长。\n"
            "你愿意告诉我：此刻你最需要的是被理解、被支持，还是一个具体解决方案？"
        )
        return jsonify({"reply": reply, "mode": "degraded"})


@app.route("/api/psych-analysis")
def psych_analysis():
    """心理多维分析可视化数据（按时间维度切换）；与 /stream 实时流独立。"""
    import random

    rng = request.args.get("range", "today")
    seed = hash((rng, request.remote_addr or "")) % (2**32)
    random.seed(seed)

    ring = {
        "labels": ["愉悦", "平静", "焦虑", "低落", "亢奋"],
        "values": [random.randint(8, 32) for _ in range(5)],
    }
    radar = {
        "labels": ["情绪稳定", "认知清晰", "社交能量", "自我关怀", "睡眠质", "压力感"],
        "values": [random.randint(42, 96) for _ in range(6)],
    }
    wave = {
        "labels": [f"{i + 1}" for i in range(12)],
        "values": [random.randint(50, 92) for _ in range(12)],
    }
    curve = {
        "labels": ["一", "二", "三", "四", "五", "六", "日"],
        "values": [random.randint(55, 95) for _ in range(7)],
    }
    bars = {
        "labels": ["HRV", "静息", "步数", "深睡", "心率变", "皮温"],
        "values": [random.randint(40, 98) for _ in range(6)],
    }
    polar = {
        "labels": ["专注", "放松", "积极", "敏感", "复原"],
        "values": [random.randint(35, 95) for _ in range(5)],
    }

    range_label = {"realtime": "实时", "today": "今日", "week": "本周", "month": "本月"}.get(
        rng, "今日"
    )
    ai_text = (
        f"【{range_label}心象综述】当前维度显示：情绪谱以「{ring['labels'][ring['values'].index(max(ring['values']))]}」成分略突出；"
        f"认知与自我调节维度整体处于温和区间。波浪曲线提示日内波动存在 {random.randint(2, 4)} 个小峰，"
        "建议在高峰前安排 5 分钟呼吸锚定。生理条带与心理雷达呈弱正相关，说明身心联动良好。"
        "点击任一带光图表可展开细读；亦可点下方文字听我慢慢说。"
    )

    details = {
        "ring": "环形图 · 情绪成分占比：用于观察主导情绪色调，非诊断标签。",
        "radar": "雷达图 · 六维心理资源：数值越高表示该维度近期自评越充足。",
        "wave": "波浪图 · 12 时段波动：模拟一日内心理能量起伏。",
        "curve": "曲线图 · 周趋势：连接每日综合指数。",
        "bars": "柱状图 · 生理代理指标：与主观感受对照阅读。",
        "polar": "极区图 · 五维平衡：专注—放松—积极等轴的相对形状。",
    }

    return jsonify(
        {
            "range": rng,
            "ring": ring,
            "radar": radar,
            "wave": wave,
            "curve": curve,
            "bars": bars,
            "polar": polar,
            "ai_text": ai_text,
            "details": details,
        }
    )


if __name__ == '__main__':
    # debug=True 允许你修改代码后页面自动重载，无需手动重启服务器
    app.run(debug=True, port=5000)